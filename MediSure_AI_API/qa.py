# doc_analyzer.py
# -*- coding: utf-8 -*-

from datetime import datetime
import os
import chromadb
from dotenv import load_dotenv

# Import LangChain PDF loader to extract text from PDF files
from langchain_community.document_loaders import PyPDFLoader

# Import text splitter to break text into smaller, manageable chunks
from langchain.text_splitter import RecursiveCharacterTextSplitter

# Import OpenAI Embeddings and Chat LLM from langchain_openai
from langchain_openai import OpenAIEmbeddings, ChatOpenAI

# Import Chroma (vector database) for storing document embeddings
from langchain_community.vectorstores import Chroma

# Import RetrievalQA chain to connect LLM with vector DB retriever
from langchain.chains import RetrievalQA

# Import PromptTemplate to create custom prompts
from langchain.prompts import PromptTemplate


# ------------------------------------------------------------------------
# Environment & persistence setup
# ------------------------------------------------------------------------

# Load environment variables from .env file (e.g., API keys)
load_dotenv()

# Directory to store persistent Chroma vector DB files
CHROMA_DIR = "vector_store"
os.makedirs(CHROMA_DIR, exist_ok=True)


# ------------------------------------------------------------------------
# PDF processing → Vector store
# ------------------------------------------------------------------------

def process_pdf(pdf_path: str):
    """
    Processes a PDF file:
    - Extracts text from the PDF using PyPDFLoader.
    - Splits text into smaller chunks for better embedding and retrieval.
    - Generates embedding vectors for each chunk using OpenAI Embeddings.
    - Stores these vectors in a persistent Chroma vector database (one collection per PDF).
    """
    # Step 1: Load the PDF and extract documents (pages or sections)
    loader = PyPDFLoader(pdf_path)
    documents = loader.load()

    # Step 2: Split extracted text into manageable chunks
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)
    chunks = splitter.split_documents(documents)

    # Step 3: Get the OpenAI API key from environment variables
    api_key = os.getenv("OPENAI_API_KEY")

    # Step 4: Create an embeddings object for OpenAI
    embeddings = OpenAIEmbeddings(
        model="text-embedding-3-small",   # Lightweight, high-quality embeddings
        api_key=api_key
    )

    # Step 5: Store chunk embeddings in Chroma vector DB (collection per PDF)
    collection_name = os.path.basename(pdf_path)  # Use PDF file name as collection name
    vectordb = Chroma.from_documents(
        chunks,
        embedding=embeddings,
        collection_name=collection_name,
        persist_directory=CHROMA_DIR,
        # metadata={"uploadDate": datetime.now().isoformat()},  # Optional custom metadata
    )

    # Persist vectors to disk
    vectordb.persist()


# ------------------------------------------------------------------------
# Helpers: detect document type, build prompts, list collections
# ------------------------------------------------------------------------

def _get_all_text_from_collection(collection_name: str) -> str:
    """
    Safely reads raw documents from the underlying Chroma collection using the chromadb client.
    This helps with document-type detection (claim vs medical) without re-reading the PDF.
    """
    try:
        client = chromadb.PersistentClient(path=CHROMA_DIR)
        col = client.get_collection(name=collection_name)
        payload = col.get(include=["documents"])
        docs = payload.get("documents", []) or []
        return " ".join(docs).lower()
    except Exception:
        return ""

def _detect_document_type(collection_name: str) -> str:
    """
    Detect if the document is:
    - claim → claim form with policy number, claim number, insurer
    - medical → prescriptions, lab reports, diagnoses
    - general → everything else
    """
    text = _get_all_text_from_collection(collection_name)

    claim_markers = ["policy number", "claim number", "insurance provider", "coverage start", "coverage end"]
    medical_markers = ["prescription", "diagnosis", "medication", "drug", "tablet", "capsule", "ml", "mg", "lab result", "blood test"]

    if any(m in text for m in claim_markers):
        return "claim"
    elif any(m in text for m in medical_markers):
        return "medical"
    else:
        return "general"


def _claim_validation_prompt() -> PromptTemplate:
    template = """
You are an expert in medical insurance claim processing and medical billing compliance.

Task:
Validate the provided claim form for missing, blank, incomplete, or incorrect information.

Mandatory Fields Checklist:
1. Patient Information:
   - Full Name
   - Date of Birth
   - Gender
   - Address
   - Contact Information (phone/email)
2. Insurance Policy Details:
   - Insurance Provider Name
   - Policy Number
   - Group Number (if applicable)
   - Plan Type
   - Coverage Start Date
   - Coverage End Date
   - Branch/Code (if applicable)
3. Claim Information:
   - Claim Number
   - Date of Service (must be within coverage period)
   - Provider Name
   - Provider Address
   - Diagnosis
   - Treatment Provided
   - Total Amount Billed
   - Amount Covered by Insurance
   - Patient Responsibility
4. Supporting Documentation:
   - Doctor’s Notes / Medical Reports
   - Lab Reports / Test Results
   - Bills & Receipts
   - Discharge Summary (if applicable)
5. Authorization & Declaration:
   - Patient Signature
   - Date of Patient Signature
   - Provider Signature
   - Date of Provider Signature
   - Authorization for Release of Medical Information (if required)

Rules:
- If a label is present but the value is empty → mark as missing.
- If a field is not found in the document → mark as missing.
- If the date of service is outside the coverage period → mark as inconsistent.
- Always respond in this format exactly:

Potential Rejection Reasons:
- <reason 1>
- <reason 2>
...

If no issues found, respond exactly with:
Potential Rejection Reasons:
- No missing or incorrect information found — claim appears complete.

PDF Content:
{context}

Question:
{question}
"""
    return PromptTemplate(template=template, input_variables=["context", "question"])


def _medical_report_prompt() -> PromptTemplate:
    template = """
You are a medical assistant AI. Use BOTH:
- The provided PDF content.
- Your general medical knowledge.

Task:
1) Extract Patient Demographics (if present):
   - Full Name, Age/DOB, Gender, Address, Contact Number

2) Extract Doctor Demographics (if present):
   - Full Name, Qualification, Registration/License Number, Hospital/Clinic Name, Address, Contact Number

3) Diagnosis & Key Findings:
   - List the main diagnosis and important clinical/lab findings.

4) Medicines Mentioned:
   - For each medicine, list:
     • Pros (benefits, rationale, effectiveness)
     • Cons (side effects, precautions)
     • Alternatives — If not provided in the PDF, use your medical knowledge to suggest safe, common alternatives for the same condition, mentioning that these are general options and may not apply to every patient.

5) Always include:
   "This information is educational and not a medical diagnosis. Consult a qualified doctor before making any medical decisions."

Rules:
- Even if alternatives are not in the PDF, you MUST use your own knowledge to suggest commonly known options.
- Be specific and concise.

PDF Content:
{context}

Question:
{question}

Your Structured Summary:
"""
    return PromptTemplate(template=template, input_variables=["context", "question"])

def _general_document_prompt() -> PromptTemplate:
    template = """
You are an AI document assistant. Use BOTH:
- The provided PDF content.
- Your general knowledge about forms, claims, and document validation.

Task:
1) Extract Key Information (if present):
   - Identify all mandatory fields relevant to the document type (e.g., Policy Number, Claim Number, Insurer Details, Patient/Client Details, Dates, Signatures).
   - Explicitly note any missing or incomplete fields.

2) Validate Document:
   - Check if required fields are correctly filled and consistent.
   - Highlight errors, inconsistencies, or missing information.

3) Potential Rejection Reasons:
   - List all reasons why the document/claim could be rejected based on missing or incorrect information.
   - Be specific and structured, referring to the fields causing potential rejection.

4) Recommendations:
   - Suggest corrective actions or information needed to complete the document.
   - Do not provide personal or sensitive information beyond what’s in the PDF.

5) Always include:
   "This analysis is educational and for document validation purposes only. Confirm with relevant authority before submission."

Rules:
- Even if the PDF has missing data, you MUST identify potential rejection reasons.
- Be concise, structured, and actionable.

PDF Content:
{context}

Question:
{question}

Your Structured Summary:
"""
    return PromptTemplate(template=template, input_variables=["context", "question"])


# ------------------------------------------------------------------------
# Main QA entry points (kept compatible with your original surface)
# ------------------------------------------------------------------------
def ask_question(pdf_name: str, query: str = None):
    try:
        api_key = os.getenv("OPENAI_API_KEY")

        embeddings = OpenAIEmbeddings(
            model="text-embedding-3-small",
            api_key=api_key
        )

        vectordb = Chroma(
            collection_name=pdf_name,
            embedding_function=embeddings,
            persist_directory=CHROMA_DIR,
        )

        llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.2,
            api_key=api_key
        )

        doc_type = _detect_document_type(pdf_name)

        if doc_type == "claim":
            prompt = _claim_validation_prompt()
            if query:
                final_query = f"{query}\n\nAlso, audit this claim form and list all potential rejection reasons."
            else:
                final_query = "Audit this claim form and list all potential rejection reasons."

        elif doc_type == "medical":
            prompt = _medical_report_prompt()
            final_query = query or "Extract demographics, diagnosis, and analyze medicines (pros/cons/alternatives)."

        else:  # general documents
            prompt = _general_document_prompt()
            final_query = query or "Summarize and answer questions about this document."

        qa = RetrievalQA.from_chain_type(
            llm=llm,
            retriever=vectordb.as_retriever(search_kwargs={"k": 8}),
            return_source_documents=True,
            chain_type_kwargs={"prompt": prompt}
        )

        return qa.invoke(final_query)

    except Exception as e:
        print("❌ Error in ask_question:", e)
        return {"error": str(e)}


def pdflist_collectionso():
    """
    Utility: list all available Chroma collections (i.e., processed PDFs).
    """
    client = chromadb.PersistentClient(path=CHROMA_DIR)
    collections = client.list_collections()
    # col.metadata is a dict where you can put custom info during ingestion if desired
    return [
        {
            "name": col.name,
            "id": getattr(col, "id", None),     # id may be present depending on chromadb version
            # "uploadDate": col.metadata.get("uploadDate") if col.metadata else None
        }
        for col in collections
    ]
