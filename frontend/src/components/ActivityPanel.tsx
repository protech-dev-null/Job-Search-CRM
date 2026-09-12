import {
  CalendarCheck,
  History,
  ListTodo,
  MessageSquareText,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  Save,
  Trash2,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import {
  createActivity,
  deleteActivity,
  getActivities,
  updateActivity,
} from '../api/activities'
import type { Activity, ActivityKind, Vacancy } from '../types'

interface ActivityPanelProps {
  vacancy: Vacancy
  onClose: () => void
}

interface ActivityKindMeta {
  label: string
  icon: LucideIcon
  style: string
}

const activityKindMeta: Record<ActivityKind, ActivityKindMeta> = {
  status_change: {
    label: 'Смена статуса',
    icon: History,
    style: 'bg-indigo-50 text-indigo-700',
  },
  note: {
    label: 'Заметка',
    icon: MessageSquareText,
    style: 'bg-sky-50 text-sky-700',
  },
  contact: {
    label: 'Контакт',
    icon: Phone,
    style: 'bg-emerald-50 text-emerald-700',
  },
  interview: {
    label: 'Интервью',
    icon: CalendarCheck,
    style: 'bg-amber-50 text-amber-800',
  },
  task: {
    label: 'Задача',
    icon: ListTodo,
    style: 'bg-violet-50 text-violet-700',
  },
  other: {
    label: 'Другое',
    icon: MoreHorizontal,
    style: 'bg-zinc-100 text-zinc-700',
  },
}

const manualActivityKinds: Exclude<ActivityKind, 'status_change'>[] = [
  'note',
  'contact',
  'interview',
  'task',
  'other',
]

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function toLocalDateTimeInput(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value
  const localTime = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return localTime.toISOString().slice(0, 16)
}

function sortActivities(activities: Activity[]): Activity[] {
  return [...activities].sort(
    (left, right) =>
      new Date(right.occurred_at).getTime() -
      new Date(left.occurred_at).getTime(),
  )
}

export function ActivityPanel({ vacancy, onClose }: ActivityPanelProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [kind, setKind] = useState<ActivityKind>('note')
  const [description, setDescription] = useState('')
  const [occurredAt, setOccurredAt] = useState(() =>
    toLocalDateTimeInput(new Date()),
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    setIsLoading(true)
    setError(null)

    getActivities(vacancy.id, controller.signal)
      .then(setActivities)
      .catch((requestError: Error) => {
        if (requestError.name !== 'AbortError') {
          setError(requestError.message)
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      })

    return () => controller.abort()
  }, [vacancy.id])

  const resetForm = () => {
    setEditingActivity(null)
    setKind('note')
    setDescription('')
    setOccurredAt(toLocalDateTimeInput(new Date()))
    setIsFormOpen(false)
    setError(null)
  }

  const startEditing = (activity: Activity) => {
    setEditingActivity(activity)
    setKind(activity.kind)
    setDescription(activity.description)
    setOccurredAt(toLocalDateTimeInput(activity.occurred_at))
    setIsFormOpen(true)
    setError(null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const payload = {
      kind,
      description: description.trim(),
      occurred_at: new Date(occurredAt).toISOString(),
    }

    try {
      const savedActivity = editingActivity
        ? await updateActivity(vacancy.id, editingActivity.id, payload)
        : await createActivity(vacancy.id, payload)
      setActivities((current) =>
        sortActivities([
          savedActivity,
          ...current.filter((activity) => activity.id !== savedActivity.id),
        ]),
      )
      resetForm()
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Не удалось сохранить событие',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (activity: Activity) => {
    if (!window.confirm('Удалить это событие из истории?')) {
      return
    }

    setDeletingId(activity.id)
    setError(null)
    try {
      await deleteActivity(vacancy.id, activity.id)
      setActivities((current) =>
        current.filter((item) => item.id !== activity.id),
      )
      if (editingActivity?.id === activity.id) {
        resetForm()
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Не удалось удалить событие',
      )
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-zinc-950/35"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <aside
        className="ml-auto flex h-full w-full max-w-xl flex-col border-l border-zinc-200 bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="activity-panel-title"
      >
        <header className="flex items-start justify-between gap-4 border-b border-zinc-200 px-5 py-4">
          <div className="min-w-0">
            <p className="text-sm text-zinc-500">{vacancy.company}</p>
            <h2
              id="activity-panel-title"
              className="truncate font-semibold text-zinc-900"
            >
              История: {vacancy.position}
            </h2>
          </div>
          <button
            type="button"
            className="icon-button shrink-0"
            onClick={onClose}
            aria-label="Закрыть историю"
            title="Закрыть"
          >
            <X size={17} />
          </button>
        </header>

        <div className="border-b border-zinc-200 px-5 py-4">
          {!isFormOpen ? (
            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-md bg-teal-700 px-3 text-sm font-medium text-white hover:bg-teal-800"
              onClick={() => setIsFormOpen(true)}
            >
              <Plus size={16} aria-hidden="true" />
              Добавить событие
            </button>
          ) : (
            <form className="space-y-3" onSubmit={handleSubmit}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-800">
                  {editingActivity ? 'Редактировать событие' : 'Новое событие'}
                </h3>
                <button
                  type="button"
                  className="text-sm text-zinc-500 hover:text-zinc-900"
                  onClick={resetForm}
                  disabled={isSubmitting}
                >
                  Отмена
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="form-field">
                  <span>Тип</span>
                  <select
                    className="control"
                    value={kind}
                    onChange={(event) => setKind(event.target.value as ActivityKind)}
                  >
                    {manualActivityKinds.map((value) => (
                      <option key={value} value={value}>
                        {activityKindMeta[value].label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-field">
                  <span>Дата и время</span>
                  <input
                    className="control"
                    type="datetime-local"
                    value={occurredAt}
                    onChange={(event) => setOccurredAt(event.target.value)}
                    required
                  />
                </label>
              </div>
              <label className="form-field">
                <span>Описание</span>
                <textarea
                  className="min-h-24 resize-y rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-700 focus:ring-3 focus:ring-teal-600/10"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  maxLength={2000}
                  required
                  autoFocus
                />
              </label>
              <button
                type="submit"
                className="inline-flex h-9 items-center gap-2 rounded-md bg-teal-700 px-3 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
                disabled={isSubmitting}
              >
                <Save size={16} aria-hidden="true" />
                {isSubmitting ? 'Сохранение...' : 'Сохранить событие'}
              </button>
            </form>
          )}

          {error && (
            <div
              className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800"
              role="alert"
            >
              {error}
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {isLoading && (
            <div className="space-y-5">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="flex animate-pulse gap-3">
                  <div className="size-9 shrink-0 rounded-md bg-zinc-100" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-4 w-32 rounded bg-zinc-100" />
                    <div className="h-5 w-full rounded bg-zinc-100" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && activities.length === 0 && (
            <div className="py-14 text-center">
              <History className="mx-auto text-zinc-300" size={30} />
              <p className="mt-3 font-medium text-zinc-700">История пока пуста</p>
            </div>
          )}

          {!isLoading && activities.length > 0 && (
            <ol className="space-y-5">
              {activities.map((activity) => {
                const meta = activityKindMeta[activity.kind]
                const Icon = meta.icon
                const isAutomaticStatusChange =
                  activity.kind === 'status_change'
                return (
                  <li key={activity.id} className="flex gap-3">
                    <span
                      className={`grid size-9 shrink-0 place-items-center rounded-md ${meta.style}`}
                    >
                      <Icon size={17} aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1 border-b border-zinc-100 pb-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-zinc-800">
                            {meta.label}
                          </p>
                          <time className="text-xs text-zinc-500">
                            {dateFormatter.format(new Date(activity.occurred_at))}
                          </time>
                        </div>
                        {!isAutomaticStatusChange && (
                          <div className="flex shrink-0 gap-1">
                            <button
                              type="button"
                              className="icon-button"
                              onClick={() => startEditing(activity)}
                              aria-label="Редактировать событие"
                              title="Редактировать"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              className="icon-button text-rose-600"
                              onClick={() => handleDelete(activity)}
                              disabled={deletingId === activity.id}
                              aria-label="Удалить событие"
                              title="Удалить"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-700">
                        {activity.description}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      </aside>
    </div>
  )
}
