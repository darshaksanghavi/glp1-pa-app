from pydantic import BaseModel
from typing import Optional


class PAFormFields(BaseModel):
    # Section A — Patient Info
    patient_first_name: str = ""
    patient_last_name: str = ""
    patient_dob: str = ""
    patient_sex: str = ""
    patient_mrn: str = ""
    patient_insurance_id: str = ""
    patient_address: str = ""
    patient_phone: str = ""

    # Section B — Diagnosis
    primary_diagnosis_code: str = ""
    primary_diagnosis_description: str = ""
    secondary_diagnoses: str = ""
    current_bmi: str = ""
    bmi_percentile: str = ""
    current_weight_kg: str = ""
    current_height_cm: str = ""

    # Section C — Weight Management History
    weight_management_program: str = ""
    program_duration_months: str = ""
    program_start_date: str = ""
    weight_change_description: str = ""
    prior_medications_tried: str = ""

    # Section D — Requested Medication
    requested_drug: str = "Semaglutide (Wegovy)"
    requested_dose: str = "0.25 mg subcutaneous weekly (titration)"
    quantity: str = "4 injections per 28-day supply"
    duration_months: str = "12"
    diagnosis_supporting_request: str = ""

    # Section E — Prescriber
    prescriber_name: str = ""
    prescriber_npi: str = ""
    prescriber_specialty: str = ""
    prescriber_phone: str = ""

    # Section F — Clinical Justification (Claude-generated)
    clinical_justification: str = ""

    # Comorbidities checkboxes
    comorbidity_hypertension: bool = False
    comorbidity_dyslipidemia: bool = False
    comorbidity_prediabetes: bool = False
    comorbidity_sleep_apnea: bool = False
    comorbidity_nafld: bool = False
    comorbidity_other: str = ""

    # Contraindication confirmations
    no_pancreatitis_history: bool = True
    no_men2_history: bool = True
    no_thyroid_cancer_history: bool = True


class PAFormGenerateRequest(BaseModel):
    patient_id: str
    requested_drug: Optional[str] = "Semaglutide (Wegovy)"


class PAFormUpdateRequest(BaseModel):
    fields: PAFormFields
