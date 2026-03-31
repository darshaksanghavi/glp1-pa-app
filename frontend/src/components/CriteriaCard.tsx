import type { CriterionResult } from '../types'

interface Props {
  criterion: CriterionResult
}

const STATUS_CONFIG = {
  PASS: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    badge: 'bg-green-100 text-green-800',
    icon: '✓',
    iconColor: 'text-green-600',
  },
  FAIL: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-800',
    icon: '✕',
    iconColor: 'text-red-600',
  },
  NEEDS_REVIEW: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-800',
    icon: '!',
    iconColor: 'text-amber-600',
  },
}

export default function CriteriaCard({ criterion }: Props) {
  const cfg = STATUS_CONFIG[criterion.status]
  return (
    <div className={`rounded-lg border p-4 ${cfg.bg} ${cfg.border}`}>
      <div className="flex items-start gap-3">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5 ${cfg.badge}`}>
          {cfg.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-gray-900">{criterion.name}</span>
            {!criterion.required && (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Preferred</span>
            )}
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.badge}`}>
              {criterion.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-0.5">{criterion.description}</p>
          {criterion.value && (
            <p className="text-sm font-medium text-gray-800 mt-1">{criterion.value}</p>
          )}
          {criterion.note && (
            <p className={`text-xs mt-1 ${criterion.status === 'FAIL' ? 'text-red-700' : 'text-amber-700'}`}>
              {criterion.note}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
