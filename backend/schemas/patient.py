from pydantic import BaseModel
from typing import Optional
from datetime import date


class Diagnosis(BaseModel):
    code: str        # ICD-10
    display: str
    onset_date: Optional[str] = None


class Medication(BaseModel):
    name: str
    dose: Optional[str] = None
    start_date: Optional[str] = None


class BMIRecord(BaseModel):
    date: str
    bmi: float
    bmi_percentile: Optional[float] = None
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None


class LabResult(BaseModel):
    name: str
    value: str
    unit: str
    date: str
    reference_range: Optional[str] = None


class PatientSummary(BaseModel):
    id: str
    first_name: str
    last_name: str
    date_of_birth: str
    age: int
    sex: str
    mrn: str
    insurance: str = "MassHealth"
    address: Optional[str] = None
    phone: Optional[str] = None
    diagnoses: list[Diagnosis] = []
    medications: list[Medication] = []
    bmi_history: list[BMIRecord] = []
    labs: list[LabResult] = []
    weight_management_program_months: Optional[int] = None
    weight_management_program_note: Optional[str] = None
    provider_name: Optional[str] = None
    provider_npi: Optional[str] = None
    provider_specialty: Optional[str] = None
