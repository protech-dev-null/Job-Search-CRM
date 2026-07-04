import { apiRequest } from './client'
import type {
  Activity,
  ActivityCreateInput,
  ActivityUpdateInput,
} from '../types'

function activityPath(vacancyId: string, activityId?: string): string {
  const basePath = `/api/vacancies/${encodeURIComponent(vacancyId)}/activities`
  return activityId
    ? `${basePath}/${encodeURIComponent(activityId)}`
    : basePath
}

export function getActivities(
  vacancyId: string,
  signal?: AbortSignal,
): Promise<Activity[]> {
  return apiRequest<Activity[]>(activityPath(vacancyId), { signal })
}

export function createActivity(
  vacancyId: string,
  payload: ActivityCreateInput,
): Promise<Activity> {
  return apiRequest<Activity>(activityPath(vacancyId), {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateActivity(
  vacancyId: string,
  activityId: string,
  payload: ActivityUpdateInput,
): Promise<Activity> {
  return apiRequest<Activity>(activityPath(vacancyId, activityId), {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteActivity(
  vacancyId: string,
  activityId: string,
): Promise<void> {
  return apiRequest<void>(activityPath(vacancyId, activityId), {
    method: 'DELETE',
  })
}
