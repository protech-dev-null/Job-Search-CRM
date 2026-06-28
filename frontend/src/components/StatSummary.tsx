import { BriefcaseBusiness, CalendarCheck, Handshake, Send } from 'lucide-react'
import type { Stats } from '../types'

interface StatSummaryProps {
  stats: Stats | null
  isLoading: boolean
}

const items = [
  {
    label: 'Всего вакансий',
    value: (stats: Stats) => stats.total,
    icon: BriefcaseBusiness,
    accent: 'text-zinc-700 bg-zinc-100',
  },
  {
    label: 'Отклики',
    value: (stats: Stats) => stats.by_status.applied,
    icon: Send,
    accent: 'text-indigo-700 bg-indigo-50',
  },
  {
    label: 'Интервью',
    value: (stats: Stats) => stats.by_status.interview,
    icon: CalendarCheck,
    accent: 'text-amber-700 bg-amber-50',
  },
  {
    label: 'Офферы',
    value: (stats: Stats) => stats.by_status.offer,
    icon: Handshake,
    accent: 'text-emerald-700 bg-emerald-50',
  },
]

export function StatSummary({ stats, isLoading }: StatSummaryProps) {
  return (
    <section id="analytics" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map(({ label, value, icon: Icon, accent }) => (
        <article key={label} className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-zinc-500">{label}</p>
            <span className={`grid size-8 place-items-center rounded-md ${accent}`}>
              <Icon size={17} aria-hidden="true" />
            </span>
          </div>
          {isLoading ? (
            <div className="mt-3 h-8 w-14 animate-pulse rounded bg-zinc-100" />
          ) : (
            <p className="mt-2 text-2xl font-semibold text-zinc-900">
              {stats ? value(stats) : 0}
            </p>
          )}
        </article>
      ))}
    </section>
  )
}
