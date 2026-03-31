"""
MassHealth GLP-1 prior authorization eligibility criteria engine.

Criteria for pediatric GLP-1 coverage (semaglutide/liraglutide):
  1. [Required]  Age 12–17
  2. [Required]  BMI ≥ 95th percentile (Class 1+ obesity)
  3. [Required]  ≥ 6 months of supervised weight management program
  4. [Preferred] ≥ 1 weight-related comorbidity
  5. [Required]  No absolute contraindications (MEN2, thyroid cancer hx, pancreatitis hx)
  6. [Required]  Prescriber is pediatrician or specialist
"""

from schemas.patient import PatientSummary
from schemas.eligibility import CriterionResult, CriterionStatus, EligibilityResult

COMORBIDITY_CODES = {
    "I10",   # Hypertension
    "E78.5", "E78.00", "E78.01",  # Dyslipidemia
    "R73.09","E11.9","E11","E13",  # Pre-diabetes / T2DM
    "J96.00","G47.33",             # Obstructive sleep apnea
    "K76.0", "K75.81",             # NAFLD / NASH
}

CONTRAINDICATION_CODES = {
    "K85",   "K85.9",  # Acute pancreatitis
    "K86.1",           # Chronic pancreatitis
    "C73",             # Malignant neoplasm of thyroid
    "D34",             # Benign thyroid neoplasm
    "D44.0",           # Uncertain thyroid neoplasm
    "E31.2", "E31.20", # MEN type 2
}


def check_glp1_criteria(patient: PatientSummary) -> EligibilityResult:
    criteria: list[CriterionResult] = []

    # ── Criterion 1: Age 12–17 ─────────────────────────────────────
    age_status = CriterionStatus.PASS if 12 <= patient.age <= 17 else CriterionStatus.FAIL
    criteria.append(CriterionResult(
        name="Age 12–17",
        description="Patient must be 12–17 years old (FDA-approved age range for semaglutide/liraglutide)",
        status=age_status,
        value=f"{patient.age} years old",
        required=True,
        note=None if age_status == CriterionStatus.PASS else
             ("Patient is under 12 — GLP-1s not FDA-approved for this age group" if patient.age < 12
              else "Patient is 18+ — adult PA pathway required"),
    ))

    # ── Criterion 2: BMI ≥ 95th percentile ───────────────────────
    latest_bmi = patient.bmi_history[0] if patient.bmi_history else None
    if latest_bmi is None:
        bmi_status = CriterionStatus.NEEDS_REVIEW
        bmi_value = "No BMI on record"
    elif latest_bmi.bmi_percentile is not None and latest_bmi.bmi_percentile >= 95:
        bmi_status = CriterionStatus.PASS
        bmi_value = f"BMI {latest_bmi.bmi:.1f} ({latest_bmi.bmi_percentile:.1f}th percentile)"
    elif latest_bmi.bmi_percentile is None:
        bmi_status = CriterionStatus.NEEDS_REVIEW
        bmi_value = f"BMI {latest_bmi.bmi:.1f} — percentile not recorded, manual review needed"
    else:
        bmi_status = CriterionStatus.FAIL
        bmi_value = f"BMI {latest_bmi.bmi:.1f} ({latest_bmi.bmi_percentile:.1f}th percentile) — below 95th"

    criteria.append(CriterionResult(
        name="BMI ≥ 95th percentile",
        description="Current BMI must be at or above the 95th percentile for age and sex",
        status=bmi_status,
        value=bmi_value,
        required=True,
    ))

    # ── Criterion 3: ≥ 6 months supervised weight management ──────
    months = patient.weight_management_program_months or 0
    if months >= 6:
        wm_status = CriterionStatus.PASS
        wm_note = None
    elif months > 0:
        wm_status = CriterionStatus.NEEDS_REVIEW
        wm_note = f"Only {months} months documented — 6 months required; clinical review recommended"
    else:
        wm_status = CriterionStatus.FAIL
        wm_note = "No supervised weight management program documented"

    criteria.append(CriterionResult(
        name="≥ 6 months supervised weight management",
        description="Documented enrollment in a structured weight management program for at least 6 months",
        status=wm_status,
        value=f"{months} months" if months else "None documented",
        required=True,
        note=wm_note,
    ))

    # ── Criterion 4: ≥ 1 weight-related comorbidity (preferred) ──
    diagnosis_codes = {d.code for d in patient.diagnoses}
    matched_comorbidities = [
        d.display for d in patient.diagnoses
        if d.code in COMORBIDITY_CODES or any(d.code.startswith(c) for c in COMORBIDITY_CODES)
    ]
    if matched_comorbidities:
        comorbidity_status = CriterionStatus.PASS
        comorbidity_value = ", ".join(matched_comorbidities)
    else:
        comorbidity_status = CriterionStatus.NEEDS_REVIEW
        comorbidity_value = "None identified in problem list"

    criteria.append(CriterionResult(
        name="Weight-related comorbidity",
        description="At least one obesity-related comorbidity (HTN, dyslipidemia, prediabetes, sleep apnea, NAFLD)",
        status=comorbidity_status,
        value=comorbidity_value,
        required=False,
        note=None if matched_comorbidities else "Preferred but not strictly required — strengthen justification",
    ))

    # ── Criterion 5: No contraindications ─────────────────────────
    contraindications = [
        d.display for d in patient.diagnoses
        if d.code in CONTRAINDICATION_CODES or any(d.code.startswith(c) for c in CONTRAINDICATION_CODES)
    ]
    if contraindications:
        contra_status = CriterionStatus.FAIL
        contra_value = ", ".join(contraindications)
    else:
        contra_status = CriterionStatus.PASS
        contra_value = "No contraindications identified"

    criteria.append(CriterionResult(
        name="No absolute contraindications",
        description="No history of pancreatitis, MEN type 2, or thyroid carcinoma",
        status=contra_status,
        value=contra_value,
        required=True,
        note=", ".join(contraindications) if contraindications else None,
    ))

    # ── Criterion 6: Qualified prescriber ─────────────────────────
    specialty = (patient.provider_specialty or "").lower()
    qualified = any(s in specialty for s in ["pediatric", "endocrin", "obesity", "medicine"])
    if qualified:
        prescriber_status = CriterionStatus.PASS
        prescriber_value = f"{patient.provider_name} — {patient.provider_specialty}"
    elif not patient.provider_specialty:
        prescriber_status = CriterionStatus.NEEDS_REVIEW
        prescriber_value = "Prescriber specialty not on record"
    else:
        prescriber_status = CriterionStatus.NEEDS_REVIEW
        prescriber_value = f"{patient.provider_specialty} — verify MassHealth prescriber requirements"

    criteria.append(CriterionResult(
        name="Qualified prescriber",
        description="Prescriber is a pediatrician, pediatric endocrinologist, or obesity medicine specialist",
        status=prescriber_status,
        value=prescriber_value,
        required=True,
    ))

    # ── Overall eligibility ────────────────────────────────────────
    required_failures = [c for c in criteria if c.required and c.status == CriterionStatus.FAIL]
    review_items = [c for c in criteria if c.status == CriterionStatus.NEEDS_REVIEW]
    eligible = len(required_failures) == 0

    if eligible and not review_items:
        summary = "Patient meets all required MassHealth criteria for GLP-1 prior authorization."
    elif eligible and review_items:
        items = ", ".join(c.name for c in review_items)
        summary = f"Patient meets required criteria but {len(review_items)} item(s) need clinician review: {items}."
    else:
        items = ", ".join(c.name for c in required_failures)
        summary = f"Patient does NOT meet required criteria: {items}."

    return EligibilityResult(
        patient_id=patient.id,
        eligible=eligible,
        criteria=criteria,
        summary=summary,
    )
