"""
Vercel serverless entry point for the FastAPI backend.
Routes are prefixed with /api to match Vercel's routing.
"""

import sys
import os

# Make backend modules importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from routers import patients, eligibility, pa_form, ai, submission, pdf

app = FastAPI(title="MassHealth GLP-1 PA Assistant")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# No /api prefix — Vercel strips it before passing the path to this function
app.include_router(patients.router,    prefix="/patients",    tags=["patients"])
app.include_router(eligibility.router, prefix="/eligibility", tags=["eligibility"])
app.include_router(pa_form.router,     prefix="/pa-form",     tags=["pa-form"])
app.include_router(ai.router,          prefix="/ai",          tags=["ai"])
app.include_router(submission.router,  prefix="/submit",      tags=["submission"])
app.include_router(pdf.router,         prefix="/pdf",         tags=["pdf"])


@app.get("/")
def root():
    return {"status": "ok"}
