import {
  Archive,
  BadgeCheck,
  CalendarPlus,
  CircleX,
  FilePenLine,
  Send,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { transitionVacancy } from '../api/dashboard'
import type { Vacancy, VacancyStatus } from '../types'

interface VacancyWorkflowActionsProps {
  vacancy: Vacancy
  onTransitioned: (vacancy: Vacancy) => void
}

interface WorkflowAction {
  label: string
  nextStatus: VacancyStatus
  icon: LucideIcon
  className: string
}

const actionsByStatus: Record<VacancyStatus, WorkflowAction[]> = {
  interesting: [
    {
      label: 'Откликнуться',
      nextStatus: 'applied',
      icon: Send,
      className: 'border-teal-200 text-teal-700 hover:bg-teal-50',
    },
  ],
  applied: [
    {
      label: 'Назначить интервью',
      nextStatus: 'interview',
      icon: CalendarPlus,
      className: 'border-amber-200 text-amber-800 hover:bg-amber-50',
    },
    {
      label: 'Получен отказ',
      nextStatus: 'rejected',
      icon: CircleX,
      className: 'border-rose-200 text-rose-700 hover:bg-rose-50',
    },
  ],
  interview: [
    {
      label: 'Назначить тестовое',
      nextStatus: 'test',
      icon: FilePenLine,
      className: 'border-violet-200 text-violet-700 hover:bg-violet-50',
    },
    {
      label: 'Получен отказ',
      nextStatus: 'rejected',
      icon: CircleX,
      className: 'border-rose-200 text-rose-700 hover:bg-rose-50',
    },
  ],
  test: [
    {
      label: 'Получен оффер',
      nextStatus: 'offer',
      icon: BadgeCheck,
      className: 'border-emerald-200 text-emerald-700 hover:bg-emerald-50',
    },
    {
      label: 'Получен отказ',
      nextStatus: 'rejected',
      icon: CircleX,
      className: 'border-rose-200 text-rose-700 hover:bg-rose-50',
    },
  ],
  offer: [
    {
      label: 'Архивировать',
      nextStatus: 'archived',
      icon: Archive,
      className: 'border-zinc-300 text-zinc-700 hover:bg-zinc-50',
    },
  ],
  rejected: [
    {
      label: 'Архивировать',
      nextStatus: 'archived',
      icon: Archive,
      className: 'border-zinc-300 text-zinc-700 hover:bg-zinc-50',
    },
  ],
  archived: [],
}

export function VacancyWorkflowActions({
  vacancy,
  onTransitioned,
}: VacancyWorkflowActionsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const actions = actionsByStatus[vacancy.status]

  if (actions.length === 0) {
    return null
  }

  const handleTransition = async (nextStatus: VacancyStatus) => {
    setIsSubmitting(true)
    setError(null)
    try {
      const transitionedVacancy = await transitionVacancy(vacancy.id, nextStatus)
      onTransitioned(transitionedVacancy)
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Не удалось изменить статус вакансии',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section>
      <h3 className="text-sm font-semibold text-zinc-900">Следующий переход</h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <button
              key={action.nextStatus}
              type="button"
              className={`inline-flex h-9 items-center gap-2 rounded-md border bg-white px-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${action.className}`}
              onClick={() => handleTransition(action.nextStatus)}
              disabled={isSubmitting}
            >
              <Icon size={16} aria-hidden="true" />
              {action.label}
            </button>
          )
        })}
      </div>
      {error && (
        <p className="mt-2 text-sm text-rose-700" role="alert">
          {error}
        </p>
      )}
    </section>
  )
}
