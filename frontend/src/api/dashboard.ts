import { apiRequest } from './client'
import type {
  Stats,
  Vacancy,
  VacancyCreateInput,
  VacancyPage,
  VacancyStatus,
  VacancyUpdateInput,
} from '../types'

interface VacancyListParams {
  page: number
  pageSize: number
  search?: string
  status?: VacancyStatus
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

  return apiRequest<VacancyPage>(`/api/vacancies?${query}`, { signal })
}

export function getOverdueActions(signal?: AbortSignal): Promise<Vacancy[]> {
  return apiRequest<Vacancy[]>('/api/vacancies/overdue-actions', { signal })
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
