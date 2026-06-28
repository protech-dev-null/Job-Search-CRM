import { apiRequest } from './client'
import type { Stats, VacancyPage, VacancyStatus } from '../types'

interface VacancyListParams {
  page: number
  pageSize: number
  search?: string
  status?: VacancyStatus
}

export function getStats(signal?: AbortSignal): Promise<Stats> {
  return apiRequest<Stats>('/api/stats', signal)
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

  return apiRequest<VacancyPage>(`/api/vacancies?${query}`, signal)
}
