from fastapi import APIRouter, HTTPException, Query
from schemas.patient import PatientSummary
from services import athena_service

router = APIRouter()


@router.get("/search", response_model=list[PatientSummary])
def search_patients(q: str = Query(..., min_length=1, description="Patient name or MRN")):
    return athena_service.search_patients(q)


@router.get("/{patient_id}", response_model=PatientSummary)
def get_patient(patient_id: str):
    patient = athena_service.get_patient(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient
