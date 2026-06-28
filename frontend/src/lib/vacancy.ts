import type { VacancyPriority, VacancyStatus, WorkFormat } from '../types'

export const statusLabels: Record<VacancyStatus, string> = {
  interesting: 'Интересно',
  applied: 'Отклик',
  interview: 'Интервью',
  test: 'Тестовое',
  offer: 'Оффер',
  rejected: 'Отказ',
  archived: 'Архив',
}

export const priorityLabels: Record<VacancyPriority, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
}

export const workFormatLabels: Record<WorkFormat, string> = {
  remote: 'Удалённо',
  office: 'Офис',
  hybrid: 'Гибрид',
}

export const statusStyles: Record<VacancyStatus, string> = {
  interesting: 'bg-sky-50 text-sky-700 ring-sky-200',
  applied: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  interview: 'bg-amber-50 text-amber-800 ring-amber-200',
  test: 'bg-violet-50 text-violet-700 ring-violet-200',
  offer: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 ring-rose-200',
  archived: 'bg-zinc-100 text-zinc-600 ring-zinc-200',
}
