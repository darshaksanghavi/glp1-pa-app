import type { Patient, EligibilityResult, PAFormFields, SubmitResponse } from '../types'

const BASE = '/api'

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Request failed')
  }
  return res.json()
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Request failed')
  }
  return res.json()
}

async function put<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Request failed')
  }
  return res.json()
}

export const api = {
  searchPatients: (q: string) =>
    get<Patient[]>(`/patients/search?q=${encodeURIComponent(q)}`),

  getPatient: (id: string) =>
    get<Patient>(`/patients/${id}`),

  checkEligibility: (patientId: string) =>
    get<EligibilityResult>(`/eligibility/${patientId}`),

  generateForm: (patientId: string, drug: string) =>
    post<PAFormFields>('/pa-form/generate', { patient_id: patientId, requested_drug: drug }),

  getForm: (patientId: string) =>
    get<PAFormFields>(`/pa-form/${patientId}`),

  updateForm: (patientId: string, fields: PAFormFields) =>
    put<PAFormFields>(`/pa-form/${patientId}`, { fields }),

  regenerateJustification: (patientId: string, drug: string) =>
    post<{ justification: string }>('/ai/justify', { patient_id: patientId, drug }),

  submitPA: (patientId: string, form: PAFormFields) =>
    post<SubmitResponse>('/submit', { patient_id: patientId, form }),

  downloadPDF: async (form: PAFormFields, patientName: string) => {
    const res = await fetch(`${BASE}/pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ form, patient_name: patientName }),
    })
    if (!res.ok) throw new Error('PDF generation failed')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `PA_${patientName.replace(' ', '_')}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  },
}
