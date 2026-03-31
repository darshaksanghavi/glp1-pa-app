"""
Maps patient EHR data to PA form fields.
"""

from schemas.patient import PatientSummary
from schemas.pa_form import PAFormFields

COMORBIDITY_CODES_MAP = {
    "hypertension": ["I10"],
    "dyslipidemia": ["E78.5", "E78.00", "E78.01", "E78"],
    "prediabetes": ["R73.09", "E11"],
    "sleep_apnea": ["J96.00", "G47.33"],
    "nafld": ["K76.0", "K75.81"],
}


def build_form_fields(patient: PatientSummary, requested_drug: str = "Semaglutide (Wegovy)") -> PAFormFields:
    latest_bmi = patient.bmi_history[0] if patient.bmi_history else None
    secondary = [d for d in patient.diagnoses if d.code != (patient.diagnoses[0].code if patient.diagnoses else "")]

    def _has_code(codes: list[str]) -> bool:
        for d in patient.diagnoses:
            for c in codes:
                if d.code.startswith(c):
                    return True
        return False

    prior_meds = ", ".join(m.name for m in patient.medications) if patient.medications else "None"

    fields = PAFormFields(
        # Section A
        patient_first_name=patient.first_name,
        patient_last_name=patient.last_name,
        patient_dob=patient.date_of_birth,
        patient_sex=patient.sex,
        patient_mrn=patient.mrn,
        patient_insurance_id=patient.mrn,  # placeholder — real ID from insurance card
        patient_address=patient.address or "",
        patient_phone=patient.phone or "",

        # Section B
        primary_diagnosis_code=patient.diagnoses[0].code if patient.diagnoses else "",
        primary_diagnosis_description=patient.diagnoses[0].display if patient.diagnoses else "",
        secondary_diagnoses="; ".join(f"{d.code} {d.display}" for d in secondary) if secondary else "",
        current_bmi=f"{latest_bmi.bmi:.1f}" if latest_bmi else "",
        bmi_percentile=f"{latest_bmi.bmi_percentile:.1f}" if latest_bmi and latest_bmi.bmi_percentile else "",
        current_weight_kg=f"{latest_bmi.weight_kg:.1f}" if latest_bmi and latest_bmi.weight_kg else "",
        current_height_cm=f"{latest_bmi.height_cm:.1f}" if latest_bmi and latest_bmi.height_cm else "",

        # Section C
        weight_management_program=patient.weight_management_program_note or "",
        program_duration_months=str(patient.weight_management_program_months or ""),
        prior_medications_tried=prior_meds,

        # Section D
        requested_drug=requested_drug,

        # Section E — prescriber
        prescriber_name=patient.provider_name or "",
        prescriber_npi=patient.provider_npi or "",
        prescriber_specialty=patient.provider_specialty or "",

        # Comorbidities
        comorbidity_hypertension=_has_code(COMORBIDITY_CODES_MAP["hypertension"]),
        comorbidity_dyslipidemia=_has_code(COMORBIDITY_CODES_MAP["dyslipidemia"]),
        comorbidity_prediabetes=_has_code(COMORBIDITY_CODES_MAP["prediabetes"]),
        comorbidity_sleep_apnea=_has_code(COMORBIDITY_CODES_MAP["sleep_apnea"]),
        comorbidity_nafld=_has_code(COMORBIDITY_CODES_MAP["nafld"]),
    )

    return fields
