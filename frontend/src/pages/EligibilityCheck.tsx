import { useState, useEffect } from 'react'
import type { Patient, EligibilityResult } from '../types'
import { api } from '../services/api'
import StepNav from '../components/StepNav'
import CriteriaCard from '../components/CriteriaCard'

interface Props {
  patient: Patient
  onContinue: (eligibility: EligibilityResult) => void
  onBack: () => void
}

export default function EligibilityCheck({ patient, onContinue, onBack }: Props) {
  const [eligibility, setEligibility] = useState<EligibilityResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [drug, setDrug] = useState('Semaglutide (Wegovy)')

  const DRUGS = [
    'Semaglutide (Wegovy)',
    'Liraglutide (Saxenda)',
    'Tirzepatide (Zepbound)',
  ]

  useEffect(() => {
    api.checkEligibility(patient.id)
      .then(setEligibility)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [patient.id])

  const passCount = eligibility?.criteria.filter(c => c.status === 'PASS').length ?? 0
  const total = eligibility?.criteria.length ?? 0

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <StepNav current={1} />

      {/* Patient banner */}
      <div className="card mb-6 flex items-center gap-4 py-4">
        <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-800 flex items-center justify-center font-bold">
          {patient.first_name[0]}{patient.last_name[0]}
        </div>
        <div>
          <p className="font-semibold text-gray-900">{patient.first_name} {patient.last_name}</p>
          <p className="text-xs text-gray-500">
            {patient.age} y/o {patient.sex} · MRN {patient.mrn} ·{' '}
            BMI {patient.bmi_history[0]?.bmi.toFixed(1) ?? '—'}
          </p>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">MassHealth Eligibility Check</h2>
            <p className="text-sm text-gray-500">GLP-1 prior authorization criteria</p>
          </div>
          {eligibility && (
            <div className={`text-center px-4 py-2 rounded-lg ${
              eligibility.eligible ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <div className={`text-2xl font-bold ${eligibility.eligible ? 'text-green-700' : 'text-red-700'}`}>
                {passCount}/{total}
              </div>
              <div className={`text-xs font-medium ${eligibility.eligible ? 'text-green-600' : 'text-red-600'}`}>
                {eligibility.eligible ? 'Eligible' : 'Not Eligible'}
              </div>
            </div>
          )}
        </div>

        {/* Drug selector */}
        <div className="mb-6">
          <label className="label">Requested GLP-1 Medication</label>
          <select
            className="input"
            value={drug}
            onChange={e => setDrug(e.target.value)}
          >
            {DRUGS.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>

        {loading && (
          <div className="text-center py-12 text-gray-400">
            <div className="animate-spin text-3xl mb-2">⏳</div>
            <p className="text-sm">Evaluating eligibility criteria…</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {eligibility && (
          <>
            {/* Summary banner */}
            <div className={`rounded-lg px-4 py-3 text-sm mb-6 ${
              eligibility.eligible ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {eligibility.summary}
            </div>

            {/* Criteria list */}
            <div className="space-y-3 mb-6">
              {eligibility.criteria.map((c, i) => (
                <CriteriaCard key={i} criterion={c} />
              ))}
            </div>
          </>
        )}

        <div className="flex justify-between pt-4 border-t border-gray-100">
          <button className="btn-secondary" onClick={onBack}>← Back</button>
          <button
            className="btn-primary"
            disabled={!eligibility}
            onClick={() => eligibility && onContinue(eligibility)}
          >
            Continue to PA Form →
          </button>
        </div>
      </div>
    </div>
  )
}
