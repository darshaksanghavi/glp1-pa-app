from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services import athena_service, eligibility_service, claude_service

router = APIRouter()


class JustifyRequest(BaseModel):
    patient_id: str
    drug: str = "Semaglutide (Wegovy)"


class ExtractRequest(BaseModel):
    notes_text: str


class JustifyResponse(BaseModel):
    justification: str


class ExtractResponse(BaseModel):
    fields: dict


@router.post("/justify", response_model=JustifyResponse)
def justify(req: JustifyRequest):
    patient = athena_service.get_patient(req.patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    eligibility = eligibility_service.check_glp1_criteria(patient)
    try:
        text = claude_service.generate_justification(patient, eligibility, req.drug)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    return JustifyResponse(justification=text)


@router.post("/extract", response_model=ExtractResponse)
def extract(req: ExtractRequest):
    try:
        fields = claude_service.extract_additional_fields(req.notes_text)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    return ExtractResponse(fields=fields)
