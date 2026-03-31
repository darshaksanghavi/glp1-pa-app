from fastapi import APIRouter, HTTPException
from schemas.pa_form import PAFormFields, PAFormGenerateRequest, PAFormUpdateRequest
from schemas.eligibility import EligibilityResult
from services import athena_service, form_service, eligibility_service, claude_service

router = APIRouter()

# In-memory store for prototype (replace with DB in production)
_forms: dict[str, PAFormFields] = {}


@router.post("/generate", response_model=PAFormFields)
def generate_form(req: PAFormGenerateRequest):
    patient = athena_service.get_patient(req.patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    fields = form_service.build_form_fields(patient, req.requested_drug or "Semaglutide (Wegovy)")

    # Generate AI clinical justification
    eligibility = eligibility_service.check_glp1_criteria(patient)
    try:
        justification = claude_service.generate_justification(patient, eligibility, req.requested_drug or "Semaglutide (Wegovy)")
        fields.clinical_justification = justification
    except RuntimeError:
        fields.clinical_justification = "[ANTHROPIC_API_KEY not configured — add your key to .env to enable AI justification]"

    _forms[req.patient_id] = fields
    return fields


@router.get("/{patient_id}", response_model=PAFormFields)
def get_form(patient_id: str):
    if patient_id not in _forms:
        raise HTTPException(status_code=404, detail="Form not yet generated for this patient")
    return _forms[patient_id]


@router.put("/{patient_id}", response_model=PAFormFields)
def update_form(patient_id: str, req: PAFormUpdateRequest):
    _forms[patient_id] = req.fields
    return req.fields
