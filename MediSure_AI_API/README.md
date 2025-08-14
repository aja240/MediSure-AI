# 🧠 PDF QA Chatbot Backend (FastAPI + LangChain + ChromaDB)

This backend allows you to:
- 📤 Upload one or more PDFs
- 💾 Store them as vector embeddings using ChromaDB
- 💬 Ask questions based on each uploaded PDF using OpenAI's GPT model

---

## ⚙️ Tech Stack

- 🔧 FastAPI — Backend framework
- 🧠 LangChain — RAG + Embedding logic
- 📂 ChromaDB — Persistent vector store
- 🤖 OpenAI — GPT-3.5/4 LLM for QA
- 📄 PyPDF — PDF loader
- 🌍 CORS enabled for frontend communication
- 🔐 dotenv — API key management

---

## 📦 Setup Instructions

### 1. Clone or unzip the project

### 2. Set up Python virtual environment

```bash
cd pdf_qa_backend
python -m venv venv

3. Activate the virtual environment
🪟 On Windows:

venv\Scripts\activate
🐧 On macOS/Linux:

source venv/bin/activate

###. Install dependencies
pip install -r requirements.txt
### Run the FastAPI server
uvicorn main:app --reload

pdf_qa_backend/
├── main.py               # FastAPI app
├── qa.py                 # LangChain logic
├── .env                  # API Key storage
├── requirements.txt
├── uploads/              # Uploaded PDFs
└── vector_store/         # Chroma vector DB
