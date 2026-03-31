from pydantic import BaseModel
from typing import Optional
from enum import Enum


class CriterionStatus(str, Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    NEEDS_REVIEW = "NEEDS_REVIEW"


class CriterionResult(BaseModel):
    name: str
    description: str
    status: CriterionStatus
    value: Optional[str] = None
    required: bool = True
    note: Optional[str] = None


class EligibilityResult(BaseModel):
    patient_id: str
    eligible: bool           # True if all required criteria pass
    criteria: list[CriterionResult]
    summary: str
