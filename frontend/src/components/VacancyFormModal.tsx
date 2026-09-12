import { Save, X } from 'lucide-react'
import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { createVacancy, updateVacancy } from '../api/dashboard'
import {
  priorityLabels,
  sourceLabels,
  statusLabels,
  workFormatLabels,
} from '../lib/vacancy'
import type {
  Vacancy,
  VacancyCreateInput,
  VacancyPriority,
  VacancySource,
  VacancyStatus,
  WorkFormat,
} from '../types'

interface VacancyFormModalProps {
  vacancy: Vacancy | null
  onClose: () => void
  onSaved: (vacancy: Vacancy) => void
}

interface FormValues {
  company: string
  position: string
  url: string
  source: VacancySource
  status: VacancyStatus
  priority: VacancyPriority
  salary: string
  location: string
  workFormat: WorkFormat
  skills: string
  notes: string
  nextAction: string
  nextActionAt: string
}

const emptyValues: FormValues = {
  company: '',
  position: '',
  url: '',
  source: 'manual',
  status: 'interesting',
  priority: 'medium',
  salary: '',
  location: '',
  workFormat: 'remote',
  skills: '',
  notes: '',
  nextAction: '',
  nextActionAt: '',
}

function getInitialValues(vacancy: Vacancy | null): FormValues {
  if (!vacancy) {
    return emptyValues
  }

  return {
    company: vacancy.company,
    position: vacancy.position,
    url: vacancy.url ?? '',
    source: vacancy.source,
    status: vacancy.status,
    priority: vacancy.priority,
    salary: vacancy.salary ?? '',
    location: vacancy.location ?? '',
    workFormat: vacancy.work_format,
    skills: vacancy.skills.join(', '),
    notes: vacancy.notes ?? '',
    nextAction: vacancy.next_action ?? '',
    nextActionAt: vacancy.next_action_at ?? '',
  }
}

function optionalText(value: string): string | null {
  return value.trim() || null
}

function parseSkills(value: string): string[] {
  return value
    .split(',')
    .map((skill) => skill.trim())
    .filter(Boolean)
}

export function VacancyFormModal({
  vacancy,
  onClose,
  onSaved,
}: VacancyFormModalProps) {
  const [values, setValues] = useState(() => getInitialValues(vacancy))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEditing = vacancy !== null

  const updateField = <Key extends keyof FormValues>(
    field: Key,
    value: FormValues[Key],
  ) => {
    setValues((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const payload: VacancyCreateInput = {
      company: values.company.trim(),
      position: values.position.trim(),
      url: optionalText(values.url),
      source: values.source,
      status: values.status,
      priority: values.priority,
      salary: optionalText(values.salary),
      location: optionalText(values.location),
      work_format: values.workFormat,
      skills: parseSkills(values.skills),
      notes: optionalText(values.notes),
      next_action: optionalText(values.nextAction),
      next_action_at: values.nextAction.trim() ? values.nextActionAt || null : null,
    }

    try {
      const savedVacancy = isEditing
        ? await updateVacancy(vacancy.id, payload)
        : await createVacancy(payload)
      onSaved(savedVacancy)
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Не удалось сохранить вакансию',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key === 'Escape' && !isSubmitting) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-zinc-950/35 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) {
          onClose()
        }
      }}
    >
      <section
        className="flex max-h-[calc(100vh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vacancy-form-title"
      >
        <header className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <div>
            <h2 id="vacancy-form-title" className="font-semibold text-zinc-900">
              {isEditing ? 'Редактировать вакансию' : 'Новая вакансия'}
            </h2>
            {isEditing && <p className="mt-0.5 text-sm text-zinc-500">{vacancy.company}</p>}
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Закрыть форму"
            title="Закрыть"
          >
            <X size={17} />
          </button>
        </header>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={handleSubmit}
          onKeyDown={handleKeyDown}
        >
          <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-5 sm:grid-cols-2">
            <label className="form-field">
              <span>Компания</span>
              <input
                className="control"
                value={values.company}
                onChange={(event) => updateField('company', event.target.value)}
                maxLength={120}
                required
                autoFocus
              />
            </label>

            <label className="form-field">
              <span>Позиция</span>
              <input
                className="control"
                value={values.position}
                onChange={(event) => updateField('position', event.target.value)}
                maxLength={160}
                required
              />
            </label>

            <label className="form-field">
              <span>Источник</span>
              <select
                className="control"
                value={values.source}
                onChange={(event) =>
                  updateField('source', event.target.value as VacancySource)
                }
              >
                {Object.entries(sourceLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>Статус</span>
              <select
                className="control"
                value={values.status}
                onChange={(event) =>
                  updateField('status', event.target.value as VacancyStatus)
                }
              >
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>Приоритет</span>
              <select
                className="control"
                value={values.priority}
                onChange={(event) =>
                  updateField('priority', event.target.value as VacancyPriority)
                }
              >
                {Object.entries(priorityLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>Формат работы</span>
              <select
                className="control"
                value={values.workFormat}
                onChange={(event) =>
                  updateField('workFormat', event.target.value as WorkFormat)
                }
              >
                {Object.entries(workFormatLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>Локация</span>
              <input
                className="control"
                value={values.location}
                onChange={(event) => updateField('location', event.target.value)}
                maxLength={120}
              />
            </label>

            <label className="form-field">
              <span>Зарплата</span>
              <input
                className="control"
                value={values.salary}
                onChange={(event) => updateField('salary', event.target.value)}
                maxLength={120}
              />
            </label>

            <label className="form-field sm:col-span-2">
              <span>Ссылка</span>
              <input
                className="control"
                type="url"
                value={values.url}
                onChange={(event) => updateField('url', event.target.value)}
                maxLength={500}
                placeholder="https://"
              />
            </label>

            <label className="form-field sm:col-span-2">
              <span>Навыки</span>
              <input
                className="control"
                value={values.skills}
                onChange={(event) => updateField('skills', event.target.value)}
                placeholder="React, TypeScript, Python"
              />
            </label>

            <label className="form-field sm:col-span-2">
              <span>Следующий шаг</span>
              <input
                className="control"
                value={values.nextAction}
                onChange={(event) => updateField('nextAction', event.target.value)}
                maxLength={240}
              />
            </label>

            <label className="form-field">
              <span>Дата следующего действия</span>
              <input
                className="control"
                type="date"
                value={values.nextActionAt}
                onChange={(event) =>
                  updateField('nextActionAt', event.target.value)
                }
                disabled={!values.nextAction.trim()}
              />
            </label>

            <label className="form-field sm:col-span-2">
              <span>Заметки</span>
              <textarea
                className="min-h-24 resize-y rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-700 focus:ring-3 focus:ring-teal-600/10"
                value={values.notes}
                onChange={(event) => updateField('notes', event.target.value)}
              />
            </label>

            {error && (
              <div
                className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 sm:col-span-2"
                role="alert"
              >
                {error}
              </div>
            )}
          </div>

          <footer className="flex justify-end gap-2 border-t border-zinc-200 px-5 py-4">
            <button
              type="button"
              className="h-9 rounded-md border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="inline-flex h-9 items-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-medium text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSubmitting}
            >
              <Save size={16} aria-hidden="true" />
              {isSubmitting ? 'Сохранение...' : 'Сохранить'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}
