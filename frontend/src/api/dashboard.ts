import { apiRequest, apiUrl } from './client'
import type {
  Stats,
  Vacancy,
  VacancyCreateInput,
  VacancyPage,
  SortDirection,
  VacancySortField,
  VacancyStatus,
  VacancyUpdateInput,
} from '../types'

export interface VacancyListParams {
  page: number
  pageSize: number
  search?: string
  status?: VacancyStatus
  sortBy?: VacancySortField
  sortDirection?: SortDirection
}

export function getStats(signal?: AbortSignal): Promise<Stats> {
  return apiRequest<Stats>('/api/stats', { signal })
}

export function getVacancies(
  params: VacancyListParams,
  signal?: AbortSignal,
): Promise<VacancyPage> {
  const query = new URLSearchParams({
    page: String(params.page),
    page_size: String(params.pageSize),
  })

  if (params.search) {
    query.set('search', params.search)
  }
  if (params.status) {
    query.set('status', params.status)
  }
  if (params.sortBy) {
    query.set('sort_by', params.sortBy)
  }
  if (params.sortDirection) {
    query.set('sort_direction', params.sortDirection)
  }

  return apiRequest<VacancyPage>(`/api/vacancies?${query}`, { signal })
}

export function downloadVacanciesCsv(
  params: Pick<
    VacancyListParams,
    'search' | 'status' | 'sortBy' | 'sortDirection'
  >,
): void {
  const query = new URLSearchParams()
  if (params.search) {
    query.set('search', params.search)
  }
  if (params.status) {
    query.set('status', params.status)
  }
  if (params.sortBy) {
    query.set('sort_by', params.sortBy)
  }
  if (params.sortDirection) {
    query.set('sort_direction', params.sortDirection)
  }

  const link = document.createElement('a')
  link.href = apiUrl(`/api/vacancies/export.csv?${query}`)
  link.download = 'vacancies.csv'
  document.body.append(link)
  link.click()
  link.remove()
}

export function getDueActions(signal?: AbortSignal): Promise<Vacancy[]> {
  return apiRequest<Vacancy[]>('/api/vacancies/due-actions', { signal })
}

export function createVacancy(payload: VacancyCreateInput): Promise<Vacancy> {
  return apiRequest<Vacancy>('/api/vacancies', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateVacancy(
  vacancyId: string,
  payload: VacancyUpdateInput,
): Promise<Vacancy> {
  return apiRequest<Vacancy>(`/api/vacancies/${encodeURIComponent(vacancyId)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteVacancy(vacancyId: string): Promise<void> {
  return apiRequest<void>(
    `/api/vacancies/${encodeURIComponent(vacancyId)}`,
    { method: 'DELETE' },
  )
}

export function completeNextAction(vacancyId: string): Promise<Vacancy> {
  return apiRequest<Vacancy>(
    `/api/vacancies/${encodeURIComponent(vacancyId)}/complete-next-action`,
    { method: 'POST' },
  )
}

export function transitionVacancy(
  vacancyId: string,
  status: VacancyStatus,
): Promise<Vacancy> {
  return apiRequest<Vacancy>(
    `/api/vacancies/${encodeURIComponent(vacancyId)}/transition`,
    {
      method: 'POST',
      body: JSON.stringify({ status }),
    },
  )
}
