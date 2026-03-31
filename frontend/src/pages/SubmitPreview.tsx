import { useState } from 'react'
import type { Patient, PAFormFields, SubmitResponse } from '../types'
import { api } from '../services/api'
import StepNav from '../components/StepNav'

interface Props {
  patient: Patient
  form: PAFormFields
  onBack: () => void
  onReset: () => void
}

export default function SubmitPreview({ patient, form, onBack, onReset }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [result, setResult] = useState<SubmitResponse | null>(null)
  const [error, setError] = useState('')

  async function handleSubmit() {
    setSubmitting(true)
    setError('')
    try {
      const res = await api.submitPA(patient.id, form)
      setResult(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDownloadPDF() {
    setDownloading(true)
    try {
      await api.downloadPDF(form, `${patient.first_name} ${patient.last_name}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'PDF generation failed')
    } finally {
      setDownloading(false)
    }
  }

  if (result) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <StepNav current={3} />
        <div className="card text-center py-12">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-green-700 mb-2">PA Request Submitted</h2>
          <p className="text-gray-600 mb-6">{result.message}</p>
          <div className="inline-block bg-gray-50 border border-gray-200 rounded-xl px-8 py-4 mb-6">
            <p className="text-xs text-gray-500 mb-1">Confirmation Number</p>
            <p className="text-2xl font-mono font-bold text-brand-800 tracking-wide">{result.confirmation_number}</p>
            <p className="text-xs text-gray-400 mt-1">Submitted {result.submitted_date}</p>
          </div>
          <div className="flex gap-3 justify-center flex-wrap">
            <button className="btn-secondary" onClick={handleDownloadPDF} disabled={downloading}>
              {downloading ? '⏳ Generating…' : '📄 Download PDF'}
            </button>
            <button className="btn-primary" onClick={onReset}>
              Start New PA
            </button>
          </div>
          {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
        </div>
      </div>
    )
  }

  const comorbidities = [
    form.comorbidity_hypertension && 'Hypertension',
    form.comorbidity_dyslipidemia && 'Dyslipidemia',
    form.comorbidity_prediabetes && 'Prediabetes',
    form.comorbidity_sleep_apnea && 'Sleep Apnea',
    form.comorbidity_nafld && 'NAFLD',
    form.comorbidity_other,
  ].filter(Boolean).join(', ')

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <StepNav current={3} />

      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900">Review & Submit</h2>
        <p className="text-sm text-gray-500">Final review of the prior authorization request before submission to MassHealth</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <PreviewSection title="Patient">
          <Row label="Name" value={`${form.patient_first_name} ${form.patient_last_name}`} />
          <Row label="Date of Birth" value={form.patient_dob} />
          <Row label="Sex" value={form.patient_sex} />
          <Row label="MRN" value={form.patient_mrn} />
          <Row label="Insurance" value="MassHealth" />
          <Row label="Address" value={form.patient_address} />
        </PreviewSection>

        <PreviewSection title="Diagnosis">
          <Row label="Primary Dx" value={`${form.primary_diagnosis_code} — ${form.primary_diagnosis_description}`} />
          <Row label="BMI" value={form.current_bmi + (form.bmi_percentile ? ` (${form.bmi_percentile}th %ile)` : '')} />
          <Row label="Weight" value={form.current_weight_kg ? `${form.current_weight_kg} kg` : '—'} />
          <Row label="Height" value={form.current_height_cm ? `${form.current_height_cm} cm` : '—'} />
          {comorbidities && <Row label="Comorbidities" value={comorbidities} />}
        </PreviewSection>

        <PreviewSection title="Weight Management History">
          <Row label="Program" value={form.weight_management_program} />
          <Row label="Duration" value={form.program_duration_months ? `${form.program_duration_months} months` : '—'} />
          <Row label="Prior Medications" value={form.prior_medications_tried} />
        </PreviewSection>

        <PreviewSection title="Requested Medication">
          <Row label="Drug" value={form.requested_drug} />
          <Row label="Dose" value={form.requested_dose} />
          <Row label="Quantity" value={form.quantity} />
          <Row label="Duration" value={`${form.duration_months} months`} />
        </PreviewSection>

        <PreviewSection title="Prescriber">
          <Row label="Name" value={form.prescriber_name} />
          <Row label="NPI" value={form.prescriber_npi} />
          <Row label="Specialty" value={form.prescriber_specialty} />
        </PreviewSection>

        <PreviewSection title="Contraindication Attestations">
          <Row label="No pancreatitis history" value={form.no_pancreatitis_history ? '✓ Confirmed' : '✗ Not confirmed'} />
          <Row label="No MEN2 history" value={form.no_men2_history ? '✓ Confirmed' : '✗ Not confirmed'} />
          <Row label="No thyroid Ca history" value={form.no_thyroid_cancer_history ? '✓ Confirmed' : '✗ Not confirmed'} />
        </PreviewSection>

        <div className="card">
          <h3 className="section-heading">Clinical Justification</h3>
          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
            {form.clinical_justification || <span className="text-gray-400 italic">No justification provided</span>}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-6 mt-2">
        <button className="btn-secondary" onClick={onBack}>← Edit Form</button>
        <div className="flex gap-3">
          <button className="btn-secondary" onClick={handleDownloadPDF} disabled={downloading}>
            {downloading ? '⏳ Generating…' : '📄 Download PDF'}
          </button>
          <button className="btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? '⏳ Submitting…' : 'Submit to MassHealth →'}
          </button>
        </div>
      </div>
    </div>
  )
}

function PreviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <h3 className="section-heading">{title}</h3>
      <div className="divide-y divide-gray-50">{children}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4 py-1.5">
      <span className="text-xs text-gray-500 w-36 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-gray-800 flex-1">{value || '—'}</span>
    </div>
  )
}
