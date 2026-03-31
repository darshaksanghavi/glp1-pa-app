"""
Claude API integration for:
  1. generate_justification() — clinical narrative for the PA form
  2. extract_additional_fields() — supplement form fields from unstructured notes
"""

import os
import json
import anthropic

from schemas.patient import PatientSummary
from schemas.eligibility import EligibilityResult

_client: anthropic.Anthropic | None = None


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise RuntimeError("ANTHROPIC_API_KEY environment variable not set")
        _client = anthropic.Anthropic(api_key=api_key)
    return _client


def generate_justification(patient: PatientSummary, eligibility: EligibilityResult, drug: str) -> str:
    """
    Generate a 2–3 paragraph clinical justification for the MassHealth GLP-1 PA.
    Returns the narrative text.
    """
    latest_bmi = patient.bmi_history[0] if patient.bmi_history else None
    bmi_str = f"BMI {latest_bmi.bmi:.1f} ({latest_bmi.bmi_percentile:.1f}th percentile)" if latest_bmi else "BMI not recorded"
    diagnoses_str = "; ".join(f"{d.code} {d.display}" for d in patient.diagnoses)
    labs_str = "; ".join(f"{l.name} {l.value} {l.unit}" for l in patient.labs)
    criteria_summary = "\n".join(
        f"  - {c.name}: {c.status.value} ({c.value or ''})"
        for c in eligibility.criteria
    )

    prompt = f"""You are a clinical documentation specialist writing a prior authorization justification for a Massachusetts pediatric clinic.

Patient: {patient.first_name} {patient.last_name}, {patient.age} y/o {patient.sex}
{bmi_str}
Active diagnoses: {diagnoses_str}
Recent labs: {labs_str}
Weight management program: {patient.weight_management_program_months or 0} months — {patient.weight_management_program_note or 'none'}
Requested medication: {drug}
Prescriber: {patient.provider_name} ({patient.provider_specialty})

MassHealth eligibility criteria assessment:
{criteria_summary}

Write a 2–3 paragraph prior authorization clinical justification for {drug} for this pediatric patient.
Requirements:
- Reference specific clinical values (BMI, labs, diagnoses) from the data above
- Explain why lifestyle intervention alone has been insufficient
- Address any weight-related comorbidities that increase urgency
- State that this medication is medically necessary and appropriate
- Professional clinical tone — this will be reviewed by a MassHealth medical director
- Do NOT include placeholder text like "[X]" — use only the data provided
- Do NOT include a salutation or signature
"""

    client = _get_client()
    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )
    return message.content[0].text


def extract_additional_fields(notes_text: str) -> dict:
    """
    Given unstructured clinical notes, extract structured PA form fields.
    Returns a dict of field_name -> value pairs to overlay on the form.
    """
    prompt = f"""Extract prior authorization form fields from the clinical note below.
Return ONLY valid JSON with these possible keys:
  weight_management_program, program_start_date, weight_change_description,
  prior_medications_tried, comorbidity_other, clinical_notes

Clinical note:
{notes_text}

Return only the JSON object, no explanation."""

    client = _get_client()
    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=512,
        messages=[{"role": "user", "content": prompt}],
    )
    text = message.content[0].text.strip()
    # Strip markdown code fences if present
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {}
