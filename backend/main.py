from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routers import patients, eligibility, pa_form, ai, submission, pdf

load_dotenv()

app = FastAPI(title="MassHealth GLP-1 PA Assistant", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(patients.router, prefix="/patients", tags=["patients"])
app.include_router(eligibility.router, prefix="/eligibility", tags=["eligibility"])
app.include_router(pa_form.router, prefix="/pa-form", tags=["pa-form"])
app.include_router(ai.router, prefix="/ai", tags=["ai"])
app.include_router(submission.router, prefix="/submit", tags=["submission"])
app.include_router(pdf.router, prefix="/pdf", tags=["pdf"])


@app.get("/")
def root():
    return {"status": "ok", "app": "MassHealth GLP-1 PA Assistant"}
