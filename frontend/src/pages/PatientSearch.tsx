import { useState } from 'react'
import type { Patient } from '../types'
import { api } from '../services/api'
import StepNav from '../components/StepNav'

interface Props {
  onPatientSelected: (patient: Patient) => void
}

export default function PatientSearch({ onPatientSelected }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Patient[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError('')
    try {
      const patients = await api.searchPatients(query.trim())
      setResults(patients)
      setSearched(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <StepNav current={0} />

      <div className="card">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Patient Search</h1>
        <p className="text-sm text-gray-500 mb-6">
          Search by patient name or MRN to pull data from athenahealth
        </p>

        <form onSubmit={handleSearch} className="flex gap-3 mb-6">
          <input
            className="input flex-1"
            placeholder="Patient name or MRN (e.g. Emily Chen)"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button type="submit" className="btn-primary whitespace-nowrap" disabled={loading}>
            {loading ? 'Searching…' : 'Search'}
          </button>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">
            {error}
          </div>
        )}

        {searched && results.length === 0 && !loading && (
          <p className="text-sm text-gray-500 text-center py-8">No patients found for "{query}"</p>
        )}

        {results.length > 0 && (
          <div className="space-y-3">
            {results.map(patient => (
              <PatientCard key={patient.id} patient={patient} onSelect={onPatientSelected} />
            ))}
          </div>
        )}

        {!searched && (
          <div className="text-center py-10 text-gray-400">
            <div className="text-4xl mb-2">🔍</div>
            <p className="text-sm">Search for a patient to begin a prior authorization</p>
            <p className="text-xs mt-1 text-gray-300">Demo patients: Emily Chen, Marcus Williams, Sofia Martinez</p>
          </div>
        )}
      </div>
    </div>
  )
}

function PatientCard({ patient, onSelect }: { patient: Patient; onSelect: (p: Patient) => void }) {
  const latest = patient.bmi_history[0]
  const comorbidities = patient.diagnoses.slice(1).map(d => d.display)

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-brand-600 hover:bg-brand-50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-800 flex items-center justify-center font-bold text-sm">
              {patient.first_name[0]}{patient.last_name[0]}
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {patient.first_name} {patient.last_name}
              </p>
              <p className="text-xs text-gray-500">
                {patient.age} y/o {patient.sex} · MRN: {patient.mrn} · {patient.insurance}
              </p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <span className="text-gray-500">Date of birth</span>
            <span className="text-gray-800">{patient.date_of_birth}</span>
            {latest && (
              <>
                <span className="text-gray-500">Current BMI</span>
                <span className="text-gray-800">
                  {latest.bmi.toFixed(1)}
                  {latest.bmi_percentile ? ` (${latest.bmi_percentile.toFixed(1)}th %ile)` : ''}
                </span>
              </>
            )}
            <span className="text-gray-500">Primary Dx</span>
            <span className="text-gray-800 truncate">{patient.diagnoses[0]?.display ?? '—'}</span>
            {patient.weight_management_program_months !== undefined && (
              <>
                <span className="text-gray-500">Weight Mgmt</span>
                <span className="text-gray-800">{patient.weight_management_program_months} months</span>
              </>
            )}
          </div>

          {comorbidities.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {comorbidities.slice(0, 4).map((c, i) => (
                <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{c}</span>
              ))}
            </div>
          )}
        </div>

        <button
          className="btn-primary text-sm flex-shrink-0"
          onClick={() => onSelect(patient)}
        >
          Select
        </button>
      </div>
    </div>
  )
}
