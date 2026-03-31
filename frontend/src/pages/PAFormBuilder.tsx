import { useState, useEffect } from 'react'
import type { Patient, EligibilityResult, PAFormFields } from '../types'
import { api } from '../services/api'
import StepNav from '../components/StepNav'

interface Props {
  patient: Patient
  eligibility: EligibilityResult
  drug: string
  onContinue: (form: PAFormFields) => void
  onBack: () => void
}

export default function PAFormBuilder({ patient, eligibility, drug, onContinue, onBack }: Props) {
  const [form, setForm] = useState<PAFormFields | null>(null)
  const [loading, setLoading] = useState(true)
  const [regenLoading, setRegenLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.generateForm(patient.id, drug)
      .then(setForm)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [patient.id, drug])

  function update(key: keyof PAFormFields, value: string | boolean) {
    setForm(prev => prev ? { ...prev, [key]: value } : prev)
  }

  async function regenJustification() {
    setRegenLoading(true)
    try {
      const { justification } = await api.regenerateJustification(patient.id, drug)
      setForm(prev => prev ? { ...prev, clinical_justification: justification } : prev)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to regenerate')
    } finally {
      setRegenLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <StepNav current={2} />
        <div className="card text-center py-16">
          <div className="text-4xl mb-3">🤖</div>
          <p className="text-gray-600 font-medium">Generating PA form with Claude AI…</p>
          <p className="text-sm text-gray-400 mt-1">Extracting clinical data and drafting justification</p>
        </div>
      </div>
    )
  }

  if (!form) return null

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <StepNav current={2} />

      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900">PA Form Builder</h2>
        <p className="text-sm text-gray-500">Review and edit the pre-filled prior authorization form. Fields auto-populated from athenahealth.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Section A */}
        <Section title="Section A — Patient Information">
          <div className="grid grid-cols-2 gap-4">
            <Field label="First Name" value={form.patient_first_name} onChange={v => update('patient_first_name', v)} />
            <Field label="Last Name" value={form.patient_last_name} onChange={v => update('patient_last_name', v)} />
            <Field label="Date of Birth" value={form.patient_dob} onChange={v => update('patient_dob', v)} />
            <Field label="Sex" value={form.patient_sex} onChange={v => update('patient_sex', v)} />
            <Field label="MRN" value={form.patient_mrn} onChange={v => update('patient_mrn', v)} />
            <Field label="Insurance ID" value={form.patient_insurance_id} onChange={v => update('patient_insurance_id', v)} />
          </div>
          <Field label="Address" value={form.patient_address} onChange={v => update('patient_address', v)} />
          <Field label="Phone" value={form.patient_phone} onChange={v => update('patient_phone', v)} />
        </Section>

        {/* Section B */}
        <Section title="Section B — Diagnosis & Clinical Data">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Primary Dx Code" value={form.primary_diagnosis_code} onChange={v => update('primary_diagnosis_code', v)} />
            <Field label="Primary Dx Description" value={form.primary_diagnosis_description} onChange={v => update('primary_diagnosis_description', v)} />
            <Field label="Current BMI" value={form.current_bmi} onChange={v => update('current_bmi', v)} />
            <Field label="BMI Percentile" value={form.bmi_percentile} onChange={v => update('bmi_percentile', v)} />
            <Field label="Weight (kg)" value={form.current_weight_kg} onChange={v => update('current_weight_kg', v)} />
            <Field label="Height (cm)" value={form.current_height_cm} onChange={v => update('current_height_cm', v)} />
          </div>
          <Field label="Secondary Diagnoses" value={form.secondary_diagnoses} onChange={v => update('secondary_diagnoses', v)} textarea />

          {/* Comorbidities */}
          <div className="mt-2">
            <label className="label">Weight-related Comorbidities</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                ['comorbidity_hypertension', 'Hypertension'],
                ['comorbidity_dyslipidemia', 'Dyslipidemia'],
                ['comorbidity_prediabetes', 'Prediabetes / T2DM'],
                ['comorbidity_sleep_apnea', 'Obstructive Sleep Apnea'],
                ['comorbidity_nafld', 'NAFLD / NASH'],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!form[key as keyof PAFormFields]}
                    onChange={e => update(key as keyof PAFormFields, e.target.checked)}
                    className="rounded"
                  />
                  {label}
                </label>
              ))}
            </div>
            <Field label="Other comorbidities" value={form.comorbidity_other} onChange={v => update('comorbidity_other', v)} />
          </div>
        </Section>

        {/* Section C */}
        <Section title="Section C — Weight Management History">
          <Field
            label="Program Description"
            value={form.weight_management_program}
            onChange={v => update('weight_management_program', v)}
            textarea
          />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Duration (months)" value={form.program_duration_months} onChange={v => update('program_duration_months', v)} />
            <Field label="Program Start Date" value={form.program_start_date} onChange={v => update('program_start_date', v)} />
          </div>
          <Field label="Prior medications tried" value={form.prior_medications_tried} onChange={v => update('prior_medications_tried', v)} />
        </Section>

        {/* Section D */}
        <Section title="Section D — Requested Medication">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Requested Drug</label>
              <select
                className="input"
                value={form.requested_drug}
                onChange={e => update('requested_drug', e.target.value)}
              >
                {['Semaglutide (Wegovy)', 'Liraglutide (Saxenda)', 'Tirzepatide (Zepbound)'].map(d => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>
            <Field label="Dose / Route" value={form.requested_dose} onChange={v => update('requested_dose', v)} />
            <Field label="Quantity" value={form.quantity} onChange={v => update('quantity', v)} />
            <Field label="Duration (months)" value={form.duration_months} onChange={v => update('duration_months', v)} />
          </div>
        </Section>

        {/* Section E — Prescriber */}
        <Section title="Section E — Prescriber">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Prescriber Name" value={form.prescriber_name} onChange={v => update('prescriber_name', v)} />
            <Field label="NPI" value={form.prescriber_npi} onChange={v => update('prescriber_npi', v)} />
            <Field label="Specialty" value={form.prescriber_specialty} onChange={v => update('prescriber_specialty', v)} />
            <Field label="Phone" value={form.prescriber_phone} onChange={v => update('prescriber_phone', v)} />
          </div>
        </Section>

        {/* Section F — Contraindications */}
        <Section title="Section F — Contraindication Attestations">
          <div className="space-y-2">
            {[
              ['no_pancreatitis_history', 'No history of pancreatitis'],
              ['no_men2_history', 'No history of Multiple Endocrine Neoplasia type 2 (MEN2)'],
              ['no_thyroid_cancer_history', 'No personal or family history of medullary thyroid carcinoma'],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!form[key as keyof PAFormFields]}
                  onChange={e => update(key as keyof PAFormFields, e.target.checked)}
                  className="rounded"
                />
                {label}
              </label>
            ))}
          </div>
        </Section>

        {/* Section G — Clinical Justification */}
        <Section title="Section G — Clinical Justification (AI-Generated)">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">
              Drafted by Claude AI based on patient data. Edit as needed before submission.
            </p>
            <button
              className="btn-secondary text-xs py-1"
              onClick={regenJustification}
              disabled={regenLoading}
            >
              {regenLoading ? '⏳ Regenerating…' : '🔄 Regenerate'}
            </button>
          </div>
          <Field
            label=""
            value={form.clinical_justification}
            onChange={v => update('clinical_justification', v)}
            textarea
            rows={10}
          />
        </Section>
      </div>

      <div className="flex justify-between pt-6">
        <button className="btn-secondary" onClick={onBack}>← Back</button>
        <button
          className="btn-primary"
          onClick={() => onContinue(form)}
        >
          Review & Submit →
        </button>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <h3 className="section-heading">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Field({
  label, value, onChange, textarea = false, rows = 3,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  textarea?: boolean
  rows?: number
}) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      {textarea ? (
        <textarea
          className="input resize-y"
          rows={rows}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      ) : (
        <input
          className="input"
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      )}
    </div>
  )
}
