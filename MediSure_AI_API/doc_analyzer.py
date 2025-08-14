# doc_analyzer.py
# -*- coding: utf-8 -*-

from datetime import datetime
import os
import chromadb
from dotenv import load_dotenv
import pprint


# LangChain PDF loader & text splitter
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter

from langchain.schema import Document
# OpenAI embeddings & Chat LLM
from langchain_openai import OpenAIEmbeddings, ChatOpenAI

# Vector DB & RetrievalQA
from langchain_chroma import Chroma
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate

# ------------------------------------------------------------------------
# Environment & persistence setup
# ------------------------------------------------------------------------
load_dotenv()
CHROMA_DIR = "vector_store"
os.makedirs(CHROMA_DIR, exist_ok=True)


# ------------------------------------------------------------------------
# Document loaders
# ------------------------------------------------------------------------
def is_pdf(file_path: str) -> bool:
    with open(file_path, "rb") as f:
        return f.read(4) == b"%PDF"



def load_hl7(file_path: str):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    messages = content.split("MSH|")
    docs = []
    for msg in messages:
        if msg.strip():
            docs.append(Document(page_content="MSH|" + msg))
    return docs

def load_txt(file_path: str):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    return [Document(page_content=content)]

def load_csv(file_path: str):
    import pandas as pd
    df = pd.read_csv(file_path)
    # Convert each row to a Document object
    docs = []
    for i, row in df.iterrows():
        docs.append(Document(page_content=row.to_json()))
    return docs


def process_document(file_path: str):
    """
    Processes a PDF, HL7, CSV or TXT file:
    - Extracts text
    - Splits into chunks
    - Generates embeddings
    - Stores in persistent Chroma collection (one per file)
    """
    # --- Load documents ---'
    pprint.pprint(f"Processing file: {file_path}")
    if is_pdf(file_path):
        loader = PyPDFLoader(file_path)
        documents = loader.load()
    elif file_path.endswith(".hl7"):
        documents = load_hl7(file_path)
    elif file_path.endswith(".txt"):
         documents = load_txt(file_path)
    elif file_path.endswith(".json"):
         documents = load_txt(file_path)
    elif file_path.endswith(".csv"):
         documents = load_txt(file_path)
    else:
        raise ValueError("Unsupported file type. Only PDF, HL7, or TXT allowed.")

    # --- Split into chunks ---
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)
    chunks = splitter.split_documents(documents)

    # --- Generate embeddings ---
    api_key = os.getenv("OPENAI_API_KEY")
    embeddings = OpenAIEmbeddings(model="text-embedding-3-small", api_key=api_key)

    # --- Store in Chroma ---
    collection_name = os.path.basename(file_path)
    
    vectordb = Chroma.from_documents(
        documents=chunks,          # your list of Document objects
        embedding=embeddings,      # your embeddings instance
        collection_name=collection_name,
        persist_directory=CHROMA_DIR
    )
    #vectordb.persist()
    return f"Processed and stored: {collection_name}"


# ------------------------------------------------------------------------
# Helpers: text retrieval & type detection
# ------------------------------------------------------------------------
def _get_all_text_from_collection(collection_name: str) -> str:
    try:
        client = chromadb.PersistentClient(path=CHROMA_DIR)
        col = client.get_collection(name=collection_name)
        payload = col.get(include=["documents"])
        docs = payload.get("documents", []) or []
        return " ".join(docs).lower()
    except Exception:
        return ""


def _detect_document_type(collection_name: str) -> tuple[str, str]:
    """
    Returns main_type, sub_type
    main_type: claim | medical | hl7 | billing | csv | general
    sub_type: more granular, e.g., insurance_claim, lab_report, billing_data
    """
    text = _get_all_text_from_collection(collection_name)

    claim_markers = ["policy number", "claim number", "insurance provider", "coverage start", "coverage end", "plan type", "group number"]
    billing_markers = ["invoice number", "billing amount", "total due", "payment date", "procedure code"]
    medical_markers = ["prescription", "diagnosis", "medication", "drug", "tablet", "capsule", "ml", "mg", "lab result", "blood test"]
    hl7_markers = ["MSH|", "PID|", "OBR|", "OBX|"]

    main_type = "general"
    sub_type = None

    # Check insurance claims first
    if any(m in text.lower() for m in claim_markers):
        main_type = "claim"
        sub_type = "insurance_claim"
    # Optionally: detect billing separately
    elif any(m in text.lower() for m in billing_markers):
        main_type = "billing"
        sub_type = "billing_data"
    elif any(m in text.lower() for m in medical_markers):
        main_type = "medical"
        if "prescription" in text.lower():
            sub_type = "prescription"
        elif "lab result" in text.lower() or "blood test" in text.lower():
            sub_type = "lab_report"
        else:
            sub_type = "medical_general"
    elif any(m in text for m in hl7_markers):
        main_type = "hl7"
        sub_type = "hl7_message"
    elif text.count(",") > 2:
        main_type = "csv"
        sub_type = "csv_data"

    return main_type, sub_type

# ------------------------------------------------------------------------
# Prompt Templates
# ------------------------------------------------------------------------
def _claim_validation_prompt() -> PromptTemplate:
    template = """
You are an expert in medical insurance claim processing and medical billing compliance.

Task:
Validate the provided claim form for missing, blank, incomplete, or incorrect information.

Mandatory Fields Checklist:
1. Patient Information: Full Name, Date of Birth, Gender, Address, Contact Info
2. Insurance Policy Details: Provider, Policy Number, Group Number, Plan Type, Coverage Dates
3. Claim Information: Claim Number, Date of Service, Provider Name, Diagnosis, Treatment, Billing Amounts
4. Supporting Documentation: Doctor Notes, Lab Reports, Bills, Discharge Summary
5. Authorization & Declaration: Patient & Provider Signatures, Authorization for Release

Rules:
- Label present but empty → mark as missing
- Field not found → mark as missing
- Date of service outside coverage → inconsistent
- Respond exactly as:

Potential Rejection Reasons:
- <reason 1>
- <reason 2>
...

If no issues:
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
- The PDF content
- Your medical knowledge

Task:
Extract:
1) Patient Demographics
2) Doctor Demographics
3) Diagnosis & Key Findings
4) Medicines (Pros, Cons, Alternatives)

Always include:
"This info is educational and not a medical diagnosis."

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
- PDF content
- General knowledge

Task:
1) Extract Key Information (mandatory fields)
2) Validate Document (missing/inconsistent)
3) List Potential Rejection Reasons
4) Suggest corrective actions

Always include:
"This analysis is educational and for validation purposes only."

PDF Content:
{context}

Question:
{question}

Your Structured Summary:
"""
    return PromptTemplate(template=template, input_variables=["context", "question"])


def _hl7_prompt() -> PromptTemplate:
    template = """
You are an expert in healthcare HL7 messages.

Task:
1) Extract Patient Information from PID segment
2) Extract Visit & Order Info from OBR segment
3) Extract Observations from OBX segments
4) Validate HL7 message: highlight missing or inconsistent fields
5) Provide concise summary of key clinical findings

Rules:
- Be structured and specific
- Always include: "This analysis is for educational purposes only."

HL7 Content:
{context}

Question:
{question}

Structured Summary:
"""
    return PromptTemplate(template=template, input_variables=["context", "question"])


def _csv_prompt() -> PromptTemplate:
    template = """
You are an AI document assistant specialized in CSV tabular data.

Task:
1) Read header & rows
2) Identify mandatory columns (e.g., Patient ID, Policy Number, Date, Amount)
3) Validate completeness & correctness of each row
4) List missing, blank, or inconsistent fields
5) Summarize key metrics (row count, errors found)

Rules:
- Be concise, structured, and actionable
- Always include: "This analysis is for validation purposes only."

CSV Content:
{context}

Question:
{question}

Structured Summary:
"""
    return PromptTemplate(template=template, input_variables=["context", "question"])

def _billing_data_prompt() -> PromptTemplate:
    template = """
You are an AI assistant specialized in billing and invoice data.

Task:
1) Validate each row for mandatory fields: Invoice Number, Patient ID, Service Date, Amount, Payment Status
2) Identify missing or inconsistent fields
3) Summarize totals and highlight discrepancies

CSV/JSON/TXT Content:
{context}

Question:
{question}

Structured Summary:
"""
    return PromptTemplate(template=template, input_variables=["context", "question"])

def _insurance_claim_prompt() -> PromptTemplate:
    template = """
You are an expert in medical insurance claim processing.

Task:
1) Validate the provided claim data for missing, blank, incomplete, or incorrect fields.
2) Mandatory fields: Patient Info, Insurance Provider, Policy Number, Claim Number, Coverage Dates, Treatment & Billing details.
3) Highlight any inconsistencies or missing info.

Rules:
- Field not found → mark as missing
- Date of service outside coverage → inconsistent
- Always include: "This analysis is educational only."

Content:
{context}

Question:
{question}

Structured Summary:
"""
    return PromptTemplate(template=template, input_variables=["context", "question"])

# ------------------------------------------------------------------------
# Main QA entry point
# ------------------------------------------------------------------------
def ask_question(collection_name: str, query: str = None):
    """
    Ask a question about a processed document collection.
    Automatically selects the appropriate prompt based on document type.
    """
    try:
        api_key = os.getenv("OPENAI_API_KEY")
        embeddings = OpenAIEmbeddings(model="text-embedding-3-small", api_key=api_key)

        vectordb = Chroma(
            collection_name=collection_name,
            embedding_function=embeddings,
            persist_directory=CHROMA_DIR,
        )

        llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.2, api_key=api_key)
        doc_type, sub_type = _detect_document_type(collection_name)

        if doc_type == "claim":
            # Use PDF-specific prompt if collection came from PDF
            if collection_name.lower().endswith(".pdf"):
                prompt = _claim_validation_prompt()
                final_query = query or "Audit this PDF claim form and list all potential rejection reasons."
            else:
                # Use tabular/text prompt for CSV/JSON/TXT
                prompt = _insurance_claim_prompt()
                final_query = query or "Audit this insurance claim data and list all potential rejection reasons."
        elif doc_type == "medical":
            prompt = _medical_report_prompt()
            final_query = query or "Extract demographics, diagnosis, and analyze medicines."
        elif doc_type == "hl7":
            prompt = _hl7_prompt()
            final_query = query or "Extract patient info, visit details, observations, and validate HL7 message."
        elif doc_type == "csv":
            prompt = _csv_prompt()
            final_query = query or "Validate CSV, highlight missing/inconsistent fields, summarize key metrics."
        elif doc_type == "billing":
            prompt = _billing_data_prompt()
            final_query = query or "Validate billing records, highlight missing/inconsistent fields, and summarize key metrics."
        else:
            prompt = _general_document_prompt()
            final_query = query or "Summarize and validate this document."

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


# ------------------------------------------------------------------------
# Utility: list all processed PDFs / collections
# ------------------------------------------------------------------------
def pdflist_collectionso():
    client = chromadb.PersistentClient(path=CHROMA_DIR)
    collections = client.list_collections()
    pprint.pprint(collections)
    return [
        {
            "name": col.name,
            "id": getattr(col, "id", None),     # id may be present depending on chromadb version
            # "uploadDate": col.metadata.get("uploadDate") if col.metadata else None
        }
        for col in collections
    ]
