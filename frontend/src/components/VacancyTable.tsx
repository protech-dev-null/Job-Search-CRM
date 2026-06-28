import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react'
import { priorityLabels, statusLabels, statusStyles, workFormatLabels } from '../lib/vacancy'
import type { VacancyPage } from '../types'

interface VacancyTableProps {
  data: VacancyPage
  isLoading: boolean
  onPageChange: (page: number) => void
}

export function VacancyTable({ data, isLoading, onPageChange }: VacancyTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[840px] border-collapse text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-500">
            <tr>
              <th className="px-4 py-3">Компания и позиция</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3">Приоритет</th>
              <th className="px-4 py-3">Формат</th>
              <th className="px-4 py-3">Следующий шаг</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {isLoading &&
              Array.from({ length: 5 }, (_, index) => (
                <tr key={index} className="animate-pulse">
                  <td className="px-4 py-4"><div className="h-8 w-48 rounded bg-zinc-100" /></td>
                  <td className="px-4 py-4"><div className="h-6 w-20 rounded bg-zinc-100" /></td>
                  <td className="px-4 py-4"><div className="h-5 w-16 rounded bg-zinc-100" /></td>
                  <td className="px-4 py-4"><div className="h-5 w-16 rounded bg-zinc-100" /></td>
                  <td className="px-4 py-4"><div className="h-5 w-36 rounded bg-zinc-100" /></td>
                </tr>
              ))}

            {!isLoading && data.items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-14 text-center">
                  <Inbox className="mx-auto text-zinc-300" size={28} aria-hidden="true" />
                  <p className="mt-3 font-medium text-zinc-700">Вакансии не найдены</p>
                  <p className="mt-1 text-zinc-500">Измените параметры поиска</p>
                </td>
              </tr>
            )}

            {!isLoading &&
              data.items.map((vacancy) => (
                <tr key={vacancy.id} className="transition-colors hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-zinc-900">{vacancy.position}</p>
                    <p className="mt-0.5 text-zinc-500">{vacancy.company}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusStyles[vacancy.status]}`}>
                      {statusLabels[vacancy.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-700">{priorityLabels[vacancy.priority]}</td>
                  <td className="px-4 py-3 text-zinc-700">{workFormatLabels[vacancy.work_format]}</td>
                  <td className="max-w-56 truncate px-4 py-3 text-zinc-600">
                    {vacancy.next_action ?? 'Не назначен'}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <footer className="flex items-center justify-between border-t border-zinc-200 px-4 py-3 text-sm">
        <p className="text-zinc-500">
          {data.total === 0 ? 'Нет записей' : `${data.total} вакансий`}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="icon-button"
            onClick={() => onPageChange(data.page - 1)}
            disabled={data.page <= 1 || isLoading}
            aria-label="Предыдущая страница"
            title="Предыдущая страница"
          >
            <ChevronLeft size={17} />
          </button>
          <span className="min-w-20 text-center text-zinc-600">
            {data.page} из {Math.max(data.pages, 1)}
          </span>
          <button
            type="button"
            className="icon-button"
            onClick={() => onPageChange(data.page + 1)}
            disabled={data.page >= data.pages || isLoading}
            aria-label="Следующая страница"
            title="Следующая страница"
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </footer>
    </div>
  )
}
