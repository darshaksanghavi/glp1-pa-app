from fastapi import APIRouter, HTTPException
from schemas.eligibility import EligibilityResult
from services import athena_service, eligibility_service

router = APIRouter()


@router.get("/{patient_id}", response_model=EligibilityResult)
def check_eligibility(patient_id: str):
    patient = athena_service.get_patient(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return eligibility_service.check_glp1_criteria(patient)
