import random
import string
from datetime import date
from fastapi import APIRouter
from pydantic import BaseModel
from schemas.pa_form import PAFormFields

router = APIRouter()


class SubmitRequest(BaseModel):
    patient_id: str
    form: PAFormFields


class SubmitResponse(BaseModel):
    confirmation_number: str
    status: str
    message: str
    submitted_date: str


@router.post("", response_model=SubmitResponse)
def submit_pa(req: SubmitRequest):
    """Simulated MassHealth PA submission. Returns a mock confirmation number."""
    suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
    confirmation = f"PA-MASSHEALTH-{date.today().year}-{suffix}"
    return SubmitResponse(
        confirmation_number=confirmation,
        status="PENDING_REVIEW",
        message=(
            f"Prior authorization request for {req.form.requested_drug} submitted successfully. "
            f"MassHealth will review within 3–5 business days. "
            f"Reference this confirmation number for status inquiries."
        ),
        submitted_date=date.today().isoformat(),
    )
