import { useState } from 'react'
import type { Patient, EligibilityResult, PAFormFields } from './types'
import PatientSearch from './pages/PatientSearch'
import EligibilityCheck from './pages/EligibilityCheck'
import PAFormBuilder from './pages/PAFormBuilder'
import SubmitPreview from './pages/SubmitPreview'

type Step = 'search' | 'eligibility' | 'form' | 'preview'

export default function App() {
  const [step, setStep] = useState<Step>('search')
  const [patient, setPatient] = useState<Patient | null>(null)
  const [eligibility, setEligibility] = useState<EligibilityResult | null>(null)
  const [form, setForm] = useState<PAFormFields | null>(null)
  const [drug, setDrug] = useState('Semaglutide (Wegovy)')

  function reset() {
    setStep('search')
    setPatient(null)
    setEligibility(null)
    setForm(null)
    setDrug('Semaglutide (Wegovy)')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-brand-800 text-white shadow-lg">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-lg">💊</div>
          <div>
            <h1 className="font-bold text-lg leading-none">GLP-1 PA Assistant</h1>
            <p className="text-xs text-blue-200">MassHealth Prior Authorization · Pediatric Obesity</p>
          </div>
          <div className="ml-auto">
            <span className="text-xs bg-amber-400 text-amber-900 font-medium px-2 py-0.5 rounded-full">
              PROTOTYPE · Demo Data Only
            </span>
          </div>
        </div>
      </header>

      <main>
        {step === 'search' && (
          <PatientSearch
            onPatientSelected={p => {
              setPatient(p)
              setStep('eligibility')
            }}
          />
        )}

        {step === 'eligibility' && patient && (
          <EligibilityCheck
            patient={patient}
            onContinue={e => {
              setEligibility(e)
              setStep('form')
            }}
            onBack={() => setStep('search')}
          />
        )}

        {step === 'form' && patient && eligibility && (
          <PAFormBuilder
            patient={patient}
            eligibility={eligibility}
            drug={drug}
            onContinue={f => {
              setForm(f)
              setStep('preview')
            }}
            onBack={() => setStep('eligibility')}
          />
        )}

        {step === 'preview' && patient && form && (
          <SubmitPreview
            patient={patient}
            form={form}
            onBack={() => setStep('form')}
            onReset={reset}
          />
        )}
      </main>
    </div>
  )
}
