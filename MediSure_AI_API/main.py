from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from qa import process_document, ask_question,pdflist_collectionso

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/upload")
async def upload_doc(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as f:
        f.write(await file.read())
    process_document(file_path)
    return {"message": f"Uploaded and processed {file.filename}","success": True}

@app.post("/ask")
async def ask(pdf_name: str = Form(...), question: str = Form(...)):
    try:
        result = ask_question(pdf_name, question)
        return JSONResponse(content={"answer": result['result']})
    except Exception as e:
        print(e)
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/pdflist")
def list_collectionso():
    pdflist = pdflist_collectionso()
    return  pdflist
   
