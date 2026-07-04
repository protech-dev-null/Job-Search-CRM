import {
  ExternalLink,
  History,
  ListTodo,
  Pencil,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { deleteVacancy } from '../api/dashboard'
import {
  priorityLabels,
  sourceLabels,
  statusLabels,
  statusStyles,
  workFormatLabels,
} from '../lib/vacancy'
import type { Vacancy } from '../types'

interface VacancyDetailPanelProps {
  vacancy: Vacancy
  onClose: () => void
  onEdit: (vacancy: Vacancy) => void
  onViewActivities: (vacancy: Vacancy) => void
  onDeleted: (vacancy: Vacancy) => void
}

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-zinc-800">{value}</dd>
    </div>
  )
}

export function VacancyDetailPanel({
  vacancy,
  onClose,
  onEdit,
  onViewActivities,
  onDeleted,
}: VacancyDetailPanelProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isDeleting) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDeleting, onClose])

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Удалить вакансию «${vacancy.position}» в ${vacancy.company}?`,
    )
    if (!confirmed) {
      return
    }

    setIsDeleting(true)
    setError(null)
    try {
      await deleteVacancy(vacancy.id)
      onDeleted(vacancy)
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Не удалось удалить вакансию',
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 bg-zinc-950/35"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isDeleting) {
          onClose()
        }
      }}
    >
      <aside
        className="ml-auto flex h-full w-full max-w-2xl flex-col border-l border-zinc-200 bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vacancy-detail-title"
      >
        <header className="flex items-start justify-between gap-4 border-b border-zinc-200 px-5 py-4">
          <div className="min-w-0">
            <p className="text-sm text-zinc-500">{vacancy.company}</p>
            <h2
              id="vacancy-detail-title"
              className="truncate text-lg font-semibold text-zinc-900"
            >
              {vacancy.position}
            </h2>
            <span
              className={`mt-2 inline-flex rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusStyles[vacancy.status]}`}
            >
              {statusLabels[vacancy.status]}
            </span>
          </div>
          <button
            type="button"
            className="icon-button shrink-0"
            onClick={onClose}
            disabled={isDeleting}
            aria-label="Закрыть карточку вакансии"
            title="Закрыть"
          >
            <X size={17} />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <dl className="grid gap-5 rounded-lg border border-zinc-200 bg-zinc-50 p-4 sm:grid-cols-2">
            <DetailItem label="Приоритет" value={priorityLabels[vacancy.priority]} />
            <DetailItem label="Формат" value={workFormatLabels[vacancy.work_format]} />
            <DetailItem label="Источник" value={sourceLabels[vacancy.source]} />
            <DetailItem label="Зарплата" value={vacancy.salary ?? 'Не указана'} />
            <DetailItem label="Локация" value={vacancy.location ?? 'Не указана'} />
            <DetailItem
              label="Обновлено"
              value={dateFormatter.format(new Date(vacancy.updated_at))}
            />
          </dl>

          {vacancy.url && (
            <section>
              <h3 className="text-sm font-semibold text-zinc-900">Ссылка на вакансию</h3>
              <a
                className="mt-2 inline-flex max-w-full items-center gap-2 break-all text-sm text-teal-700 hover:underline"
                href={vacancy.url}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink className="shrink-0" size={16} aria-hidden="true" />
                {vacancy.url}
              </a>
            </section>
          )}

          <section>
            <h3 className="text-sm font-semibold text-zinc-900">Навыки</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {vacancy.skills.length > 0 ? (
                vacancy.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-md bg-teal-50 px-2.5 py-1 text-sm text-teal-800"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-sm text-zinc-500">Не указаны</p>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-zinc-900">Следующий шаг</h3>
            <p className="mt-2 flex items-start gap-2 whitespace-pre-wrap text-sm leading-6 text-zinc-700">
              <ListTodo className="mt-1 shrink-0 text-zinc-400" size={15} aria-hidden="true" />
              {vacancy.next_action ?? 'Не назначен'}
            </p>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-zinc-900">Заметки</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-700">
              {vacancy.notes ?? 'Заметок пока нет'}
            </p>
          </section>

          {error && (
            <div
              className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800"
              role="alert"
            >
              {error}
            </div>
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 px-5 py-4">
          <button
            type="button"
            className="inline-flex h-9 items-center gap-2 rounded-md border border-rose-200 bg-white px-3 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 size={16} aria-hidden="true" />
            {isDeleting ? 'Удаление...' : 'Удалить вакансию'}
          </button>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              onClick={() => onViewActivities(vacancy)}
              disabled={isDeleting}
            >
              <History size={16} aria-hidden="true" />
              История
            </button>
            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-md bg-teal-700 px-3 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
              onClick={() => onEdit(vacancy)}
              disabled={isDeleting}
            >
              <Pencil size={16} aria-hidden="true" />
              Редактировать
            </button>
          </div>
        </footer>
      </aside>
    </div>
  )
}
