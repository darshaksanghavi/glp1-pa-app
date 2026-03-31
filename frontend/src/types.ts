export interface Diagnosis {
  code: string
  display: string
  onset_date?: string
}

export interface Medication {
  name: string
  dose?: string
  start_date?: string
}

export interface BMIRecord {
  date: string
  bmi: number
  bmi_percentile?: number
  weight_kg?: number
  height_cm?: number
}

export interface LabResult {
  name: string
  value: string
  unit: string
  date: string
  reference_range?: string
}

export interface Patient {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string
  age: number
  sex: string
  mrn: string
  insurance: string
  address?: string
  phone?: string
  diagnoses: Diagnosis[]
  medications: Medication[]
  bmi_history: BMIRecord[]
  labs: LabResult[]
  weight_management_program_months?: number
  weight_management_program_note?: string
  provider_name?: string
  provider_npi?: string
  provider_specialty?: string
}

export type CriterionStatus = 'PASS' | 'FAIL' | 'NEEDS_REVIEW'

export interface CriterionResult {
  name: string
  description: string
  status: CriterionStatus
  value?: string
  required: boolean
  note?: string
}

export interface EligibilityResult {
  patient_id: string
  eligible: boolean
  criteria: CriterionResult[]
  summary: string
}

export interface PAFormFields {
  patient_first_name: string
  patient_last_name: string
  patient_dob: string
  patient_sex: string
  patient_mrn: string
  patient_insurance_id: string
  patient_address: string
  patient_phone: string
  primary_diagnosis_code: string
  primary_diagnosis_description: string
  secondary_diagnoses: string
  current_bmi: string
  bmi_percentile: string
  current_weight_kg: string
  current_height_cm: string
  weight_management_program: string
  program_duration_months: string
  program_start_date: string
  weight_change_description: string
  prior_medications_tried: string
  requested_drug: string
  requested_dose: string
  quantity: string
  duration_months: string
  diagnosis_supporting_request: string
  prescriber_name: string
  prescriber_npi: string
  prescriber_specialty: string
  prescriber_phone: string
  clinical_justification: string
  comorbidity_hypertension: boolean
  comorbidity_dyslipidemia: boolean
  comorbidity_prediabetes: boolean
  comorbidity_sleep_apnea: boolean
  comorbidity_nafld: boolean
  comorbidity_other: string
  no_pancreatitis_history: boolean
  no_men2_history: boolean
  no_thyroid_cancer_history: boolean
}

export interface SubmitResponse {
  confirmation_number: string
  status: string
  message: string
  submitted_date: string
}
