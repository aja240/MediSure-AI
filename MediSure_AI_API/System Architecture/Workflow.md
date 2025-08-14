                 ┌───────────────┐
                 │   User/Client │
                 └──────┬────────┘
                        │  (1) PDF Upload
                        ▼
                ┌─────────────────────┐
                │  process_pdf()      │
                │  (PDF Processor)    │
                └──────┬──────────────┘
                        │
         ┌──────────────┴──────────────┐
         │   1. PDF → Text (PyPDFLoader)
         │   2. Text → Chunks (Splitter)
         │   3. Chunks → Vectors (OpenAI Embedding)
         │   4. Vectors Store → ChromaDB
         └─────────────────────────────┘
                        │
                        ▼
              ┌──────────────────────┐
              │  Chroma Vector Store │
              └──────┬───────────────┘
                        │
   (2) User asks Q      │
        (query)         ▼
                ┌────────────────────┐
                │   ask_question()   │
                │  (Query Handler)   │
                └──────┬─────────────┘
                        │
   ┌────────────────────────────┐
   │ 1. Query → Embedding (OpenAI)
   │ 2. Retrieve similar vectors from Chroma
   │ 3. Send context to LLM (ChatOpenAI)
   │ 4. LLM generates Answer (RetrievalQA)
   └────────────────────────────┘
                        │
                        ▼
              ┌──────────────────────┐
              │      Answer to User  │
              └──────────────────────┘
