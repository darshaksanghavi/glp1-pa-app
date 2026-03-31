"""
athenahealth FHIR R4 service.
In prototype mode, returns mock patient data from data/mock_patients.json.
In production, swap load_patients() to call the athenahealth FHIR API with OAuth2.
"""

import json
import os
from typing import Optional

from schemas.patient import PatientSummary

_MOCK_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "mock_patients.json")

_patients: list[PatientSummary] = []


def _load_patients() -> list[PatientSummary]:
    global _patients
    if not _patients:
        with open(_MOCK_FILE, "r") as f:
            raw = json.load(f)
        _patients = [PatientSummary(**p) for p in raw]
    return _patients


def search_patients(query: str) -> list[PatientSummary]:
    """Search by name or MRN (case-insensitive substring match)."""
    q = query.strip().lower()
    return [
        p for p in _load_patients()
        if q in p.first_name.lower()
        or q in p.last_name.lower()
        or q in f"{p.first_name} {p.last_name}".lower()
        or q in p.mrn.lower()
    ]


def get_patient(patient_id: str) -> Optional[PatientSummary]:
    return next((p for p in _load_patients() if p.id == patient_id), None)
