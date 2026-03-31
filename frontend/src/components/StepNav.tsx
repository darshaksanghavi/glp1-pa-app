const STEPS = [
  { label: 'Patient Search',   short: '1' },
  { label: 'Eligibility',      short: '2' },
  { label: 'PA Form',          short: '3' },
  { label: 'Review & Submit',  short: '4' },
]

interface Props {
  current: number  // 0-indexed
}

export default function StepNav({ current }: Props) {
  return (
    <nav className="flex items-center gap-0 mb-8">
      {STEPS.map((step, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2
              ${i < current  ? 'bg-brand-600 border-brand-600 text-white' : ''}
              ${i === current ? 'bg-brand-800 border-brand-800 text-white' : ''}
              ${i > current  ? 'bg-white border-gray-300 text-gray-400' : ''}
            `}>
              {i < current ? '✓' : step.short}
            </div>
            <span className={`hidden sm:block text-sm font-medium
              ${i === current ? 'text-brand-800' : i < current ? 'text-brand-600' : 'text-gray-400'}
            `}>
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mx-3 ${i < current ? 'bg-brand-600' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </nav>
  )
}
