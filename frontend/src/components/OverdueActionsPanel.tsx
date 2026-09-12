import { AlertTriangle, Check, Clock3 } from 'lucide-react'
import { useState } from 'react'
import { completeNextAction } from '../api/dashboard'
import type { Vacancy } from '../types'

interface OverdueActionsPanelProps {
  actions: Vacancy[]
  isLoading: boolean
  onCompleted: (vacancy: Vacancy) => void
}

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  dateStyle: 'medium',
  timeZone: 'UTC',
})

function formatDeadline(value: string): string {
  return dateFormatter.format(new Date(`${value}T00:00:00Z`))
}

export function OverdueActionsPanel({
  actions,
  isLoading,
  onCompleted,
}: OverdueActionsPanelProps) {
  const [completingId, setCompletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleComplete = async (vacancy: Vacancy) => {
    setCompletingId(vacancy.id)
    setError(null)
    try {
      const completedVacancy = await completeNextAction(vacancy.id)
      onCompleted(completedVacancy)
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Не удалось завершить действие',
      )
    } finally {
      setCompletingId(null)
    }
  }

  return (
    <section className="rounded-lg border border-amber-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="text-amber-600" size={18} aria-hidden="true" />
        <h2 className="font-semibold">Просроченные действия</h2>
      </div>

      <div className="mt-4 space-y-3">
        {isLoading &&
          Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="h-12 animate-pulse rounded bg-zinc-100" />
          ))}

        {!isLoading && actions.length === 0 && (
          <p className="text-sm text-zinc-500">Просроченных действий нет</p>
        )}

        {!isLoading &&
          actions.map((vacancy) => (
            <div
              key={vacancy.id}
              className="flex items-start justify-between gap-3 border-b border-zinc-100 pb-3 last:border-b-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-800">
                  {vacancy.next_action}
                </p>
                <p className="mt-1 truncate text-xs text-zinc-500">
                  {vacancy.position} в {vacancy.company}
                </p>
                {vacancy.next_action_at && (
                  <p className="mt-1 inline-flex items-center gap-1 text-xs text-amber-700">
                    <Clock3 size={13} aria-hidden="true" />
                    {formatDeadline(vacancy.next_action_at)}
                  </p>
                )}
              </div>
              <button
                type="button"
                className="icon-button shrink-0 text-emerald-700"
                onClick={() => handleComplete(vacancy)}
                disabled={completingId === vacancy.id}
                aria-label={`Завершить: ${vacancy.next_action}`}
                title="Отметить выполненным"
              >
                <Check size={17} aria-hidden="true" />
              </button>
            </div>
          ))}
      </div>

      {error && (
        <p className="mt-3 text-sm text-rose-700" role="alert">
          {error}
        </p>
      )}
    </section>
  )
}
