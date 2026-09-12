import { BarChart3, Clock3, Percent } from 'lucide-react'
import { statusLabels } from '../lib/vacancy'
import type { Stats, VacancyStatus } from '../types'

interface WorkflowAnalyticsPanelProps {
  stats: Stats | null
  isLoading: boolean
}

const funnelStatuses: VacancyStatus[] = [
  'interesting',
  'applied',
  'interview',
  'test',
  'offer',
  'rejected',
]

export function WorkflowAnalyticsPanel({
  stats,
  isLoading,
}: WorkflowAnalyticsPanelProps) {
  const maximum = Math.max(
    ...funnelStatuses.map((status) => stats?.by_status[status] ?? 0),
    1,
  )
  const durationStatuses = funnelStatuses.filter(
    (status) => (stats?.average_days_by_status[status] ?? 0) > 0,
  )

  return (
    <section className="grid gap-5 xl:grid-cols-3">
      <div className="rounded-lg border border-zinc-200 bg-white p-4 xl:col-span-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="text-indigo-700" size={18} aria-hidden="true" />
          <h2 className="font-semibold">Воронка вакансий</h2>
        </div>
        <div className="mt-4 space-y-3">
          {funnelStatuses.map((status) => {
            const value = stats?.by_status[status] ?? 0
            return (
              <div key={status} className="grid grid-cols-[6.5rem_minmax(0,1fr)_2rem] items-center gap-3 text-sm">
                <span className="text-zinc-600">{statusLabels[status]}</span>
                <div className="h-2 overflow-hidden rounded bg-zinc-100">
                  <div
                    className="h-full rounded bg-indigo-600"
                    style={{ width: `${(value / maximum) * 100}%` }}
                  />
                </div>
                <span className="text-right font-medium text-zinc-800">
                  {isLoading ? '-' : value}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="space-y-5">
        <section className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <Percent className="text-teal-700" size={18} aria-hidden="true" />
            <h2 className="font-semibold">Отклик → интервью</h2>
          </div>
          <p className="mt-3 text-2xl font-semibold text-zinc-900">
            {isLoading
              ? '-'
              : stats?.applied_to_interview_conversion === null
                ? 'Нет данных'
                : `${stats?.applied_to_interview_conversion}%`}
          </p>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <Clock3 className="text-violet-700" size={18} aria-hidden="true" />
            <h2 className="font-semibold">Среднее время в статусе</h2>
          </div>
          <div className="mt-3 space-y-2 text-sm">
            {!isLoading && durationStatuses.length === 0 && (
              <p className="text-zinc-500">Данных пока нет</p>
            )}
            {durationStatuses.map((status) => (
              <div key={status} className="flex justify-between gap-3 text-zinc-700">
                <span>{statusLabels[status]}</span>
                <span className="font-medium">
                  {stats?.average_days_by_status[status]} дн.
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  )
}
