import { useDeferredValue, useEffect, useState } from 'react'
import {
  BarChart3,
  BriefcaseBusiness,
  Download,
  LayoutDashboard,
  Plus,
  RefreshCw,
  Search,
  X,
} from 'lucide-react'
import {
  downloadVacanciesCsv,
  getDueActions,
  getStats,
  getVacancies,
} from './api/dashboard'
import { ActivityPanel } from './components/ActivityPanel'
import { OverdueActionsPanel } from './components/OverdueActionsPanel'
import { StatSummary } from './components/StatSummary'
import { WorkflowAnalyticsPanel } from './components/WorkflowAnalyticsPanel'
import { VacancyDetailPanel } from './components/VacancyDetailPanel'
import { VacancyFormModal } from './components/VacancyFormModal'
import { VacancyTable } from './components/VacancyTable'
import { statusLabels } from './lib/vacancy'
import type {
  SortDirection,
  Stats,
  Vacancy,
  VacancyPage,
  VacancySortField,
  VacancyStatus,
} from './types'

const emptyVacancyPage: VacancyPage = {
  items: [],
  total: 0,
  page: 1,
  page_size: 8,
  pages: 0,
}

function App() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [vacancies, setVacancies] = useState<VacancyPage>(emptyVacancyPage)
  const [overdueActions, setOverdueActions] = useState<Vacancy[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<VacancyStatus | ''>('')
  const [sortBy, setSortBy] = useState<VacancySortField>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [page, setPage] = useState(1)
  const [refreshVersion, setRefreshVersion] = useState(0)
  const [isStatsLoading, setIsStatsLoading] = useState(true)
  const [isVacanciesLoading, setIsVacanciesLoading] = useState(true)
  const [isOverdueActionsLoading, setIsOverdueActionsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formVacancy, setFormVacancy] = useState<
    Vacancy | null | undefined
  >(undefined)
  const [detailVacancy, setDetailVacancy] = useState<Vacancy | null>(null)
  const [activityVacancy, setActivityVacancy] = useState<Vacancy | null>(null)
  const deferredSearch = useDeferredValue(search.trim())

  useEffect(() => {
    const controller = new AbortController()
    setIsStatsLoading(true)

    getStats(controller.signal)
      .then(setStats)
      .catch((requestError: Error) => {
        if (requestError.name !== 'AbortError') {
          setError('Не удалось загрузить статистику. Проверьте запуск backend.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsStatsLoading(false)
        }
      })

    return () => controller.abort()
  }, [refreshVersion])

  useEffect(() => {
    const controller = new AbortController()
    setIsVacanciesLoading(true)
    setError(null)

    getVacancies(
      {
        page,
        pageSize: emptyVacancyPage.page_size,
        search: deferredSearch || undefined,
        status: status || undefined,
        sortBy,
        sortDirection,
      },
      controller.signal,
    )
      .then(setVacancies)
      .catch((requestError: Error) => {
        if (requestError.name !== 'AbortError') {
          setError('Не удалось загрузить вакансии. Проверьте запуск backend.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsVacanciesLoading(false)
        }
      })

    return () => controller.abort()
  }, [deferredSearch, page, refreshVersion, sortBy, sortDirection, status])

  useEffect(() => {
    const controller = new AbortController()
    setIsOverdueActionsLoading(true)

    getDueActions(controller.signal)
      .then(setOverdueActions)
      .catch((requestError: Error) => {
        if (requestError.name !== 'AbortError') {
          setError('Не удалось загрузить просроченные действия.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsOverdueActionsLoading(false)
        }
      })

    return () => controller.abort()
  }, [refreshVersion])

  const changeSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const changeStatus = (value: VacancyStatus | '') => {
    setStatus(value)
    setPage(1)
  }

  const changeSorting = (value: string) => {
    const [nextSortBy, nextSortDirection] = value.split(':') as [
      VacancySortField,
      SortDirection,
    ]
    setSortBy(nextSortBy)
    setSortDirection(nextSortDirection)
    setPage(1)
  }

  const handleExport = async () => {
    try {
      await downloadVacanciesCsv({
        search: deferredSearch || undefined,
        status: status || undefined,
        sortBy,
        sortDirection,
      })
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Не удалось экспортировать вакансии.',
      )
    }
  }

  const handleVacancySaved = (savedVacancy: Vacancy) => {
    if (formVacancy === null) {
      setPage(1)
    }
    setDetailVacancy((current) =>
      current?.id === savedVacancy.id ? savedVacancy : current,
    )
    setFormVacancy(undefined)
    setRefreshVersion((value) => value + 1)
  }

  const handleEditVacancy = (vacancy: Vacancy) => {
    setDetailVacancy(null)
    setFormVacancy(vacancy)
  }

  const handleViewActivities = (vacancy: Vacancy) => {
    /** Open the timeline separately instead of stacking it on vacancy details. */
    setDetailVacancy(null)
    setActivityVacancy(vacancy)
  }

  const handleVacancyDeleted = (vacancy: Vacancy) => {
    setDetailVacancy(null)
    setActivityVacancy((current) =>
      current?.id === vacancy.id ? null : current,
    )
    if (page > 1 && vacancies.items.length === 1) {
      setPage((current) => current - 1)
    }
    setRefreshVersion((value) => value + 1)
  }

  const handleNextActionCompleted = (vacancy: Vacancy) => {
    setDetailVacancy((current) =>
      current?.id === vacancy.id ? vacancy : current,
    )
    setRefreshVersion((value) => value + 1)
  }

  const handleVacancyTransitioned = (vacancy: Vacancy) => {
    setDetailVacancy((current) =>
      current?.id === vacancy.id ? vacancy : current,
    )
    setRefreshVersion((value) => value + 1)
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-zinc-200 bg-white lg:block">
        <div className="flex h-16 items-center gap-3 border-b border-zinc-200 px-5">
          <span className="grid size-9 place-items-center rounded-md bg-teal-700 text-white">
            <BriefcaseBusiness size={19} aria-hidden="true" />
          </span>
          <div>
            <p className="font-semibold">Job Search CRM</p>
            <p className="text-xs text-zinc-500">Личный кабинет</p>
          </div>
        </div>
        <nav className="space-y-1 p-3 text-sm">
          <a className="nav-link nav-link-active" href="#top">
            <LayoutDashboard size={17} /> Обзор
          </a>
          <a className="nav-link" href="#vacancies">
            <BriefcaseBusiness size={17} /> Вакансии
          </a>
          <a className="nav-link" href="#analytics">
            <BarChart3 size={17} /> Аналитика
          </a>
        </nav>
      </aside>

      <main id="top" className="lg:pl-60">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-zinc-200 bg-white/95 px-4 backdrop-blur sm:px-6">
          <div>
            <h1 className="text-base font-semibold sm:text-lg">Обзор поиска работы</h1>
            <p className="hidden text-sm text-zinc-500 sm:block">
              Текущая воронка и активные вакансии
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="icon-button"
              onClick={() => setRefreshVersion((value) => value + 1)}
              aria-label="Обновить данные"
              title="Обновить данные"
            >
              <RefreshCw size={17} />
            </button>
            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-md bg-teal-700 px-3 text-sm font-medium text-white hover:bg-teal-800"
              onClick={() => setFormVacancy(null)}
            >
              <Plus size={17} aria-hidden="true" />
              <span className="hidden sm:inline">Новая вакансия</span>
              <span className="sm:hidden">Добавить</span>
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6">
          {error && (
            <div
              className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
              role="alert"
            >
              {error}
            </div>
          )}

          <StatSummary stats={stats} isLoading={isStatsLoading} />

          <WorkflowAnalyticsPanel stats={stats} isLoading={isStatsLoading} />

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
            <div id="vacancies" className="min-w-0 space-y-3">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <h2 className="font-semibold">Последние вакансии</h2>
                  <p className="mt-0.5 text-sm text-zinc-500">
                    Поиск, сортировка и экспорт вакансий
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                  <label className="relative">
                    <span className="sr-only">Поиск вакансий</span>
                    <Search
                      className="pointer-events-none absolute left-3 top-2.5 text-zinc-400"
                      size={17}
                      aria-hidden="true"
                    />
                    <input
                      className="control w-full pl-9 pr-9 sm:w-64"
                      type="search"
                      value={search}
                      onChange={(event) => changeSearch(event.target.value)}
                      placeholder="Компания, позиция, город"
                    />
                    {search && (
                      <button
                        type="button"
                        className="icon-button absolute right-1 top-1 size-7"
                        onClick={() => changeSearch('')}
                        aria-label="Очистить поиск"
                        title="Очистить поиск"
                      >
                        <X size={15} aria-hidden="true" />
                      </button>
                    )}
                  </label>
                  <label>
                    <span className="sr-only">Статус вакансии</span>
                    <select
                      className="control w-full sm:w-36"
                      value={status}
                      onChange={(event) =>
                        changeStatus(event.target.value as VacancyStatus | '')
                      }
                    >
                      <option value="">Все статусы</option>
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="sr-only">Сортировка вакансий</span>
                    <select
                      className="control w-full sm:w-48"
                      value={`${sortBy}:${sortDirection}`}
                      onChange={(event) => changeSorting(event.target.value)}
                    >
                      <option value="created_at:desc">Сначала новые</option>
                      <option value="created_at:asc">Сначала старые</option>
                      <option value="updated_at:desc">Недавно обновлённые</option>
                      <option value="company:asc">Компания: А-Я</option>
                      <option value="next_action_at:asc">Ближайшее действие</option>
                    </select>
                  </label>
                  <button
                    type="button"
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={handleExport}
                    disabled={isVacanciesLoading}
                  >
                    <Download size={16} aria-hidden="true" />
                    Экспорт CSV
                  </button>
                </div>
              </div>
              <VacancyTable
                data={vacancies}
                isLoading={isVacanciesLoading}
                onPageChange={setPage}
                onView={setDetailVacancy}
                onEdit={handleEditVacancy}
                onViewActivities={handleViewActivities}
              />
            </div>

            <aside className="space-y-5">
              <OverdueActionsPanel
                actions={overdueActions}
                isLoading={isOverdueActionsLoading}
                onCompleted={handleNextActionCompleted}
              />
              <section className="rounded-lg border border-zinc-200 bg-white p-4">
                <h2 className="font-semibold">Популярные навыки</h2>
                <div className="mt-4 space-y-3">
                  {isStatsLoading &&
                    Array.from({ length: 5 }, (_, index) => (
                      <div key={index} className="h-7 animate-pulse rounded bg-zinc-100" />
                    ))}
                  {!isStatsLoading && stats?.top_skills.length === 0 && (
                    <p className="text-sm text-zinc-500">Данных пока нет</p>
                  )}
                  {!isStatsLoading &&
                    stats?.top_skills.map((skill) => (
                      <div
                        key={skill.name}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <span className="truncate text-zinc-700">{skill.name}</span>
                        <span className="min-w-7 rounded-md bg-teal-50 px-2 py-1 text-center font-medium text-teal-800">
                          {skill.count}
                        </span>
                      </div>
                    ))}
                </div>
              </section>
            </aside>
          </section>
        </div>
      </main>

      {formVacancy !== undefined && (
        <VacancyFormModal
          key={formVacancy?.id ?? 'new'}
          vacancy={formVacancy}
          onClose={() => setFormVacancy(undefined)}
          onSaved={handleVacancySaved}
        />
      )}

      {detailVacancy && (
        <VacancyDetailPanel
          key={detailVacancy.id}
          vacancy={detailVacancy}
          onClose={() => setDetailVacancy(null)}
          onEdit={handleEditVacancy}
          onViewActivities={handleViewActivities}
          onDeleted={handleVacancyDeleted}
          onTransitioned={handleVacancyTransitioned}
        />
      )}

      {activityVacancy && (
        <ActivityPanel
          key={activityVacancy.id}
          vacancy={activityVacancy}
          onClose={() => setActivityVacancy(null)}
        />
      )}
    </div>
  )
}

export default App
