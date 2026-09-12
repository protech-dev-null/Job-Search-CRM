export type VacancySource = 'hh' | 'linkedin' | 'telegram' | 'manual' | 'other'

export type VacancyStatus =
  | 'interesting'
  | 'applied'
  | 'interview'
  | 'test'
  | 'offer'
  | 'rejected'
  | 'archived'

export type VacancyPriority = 'low' | 'medium' | 'high'

export type WorkFormat = 'remote' | 'office' | 'hybrid'

export type VacancySortField =
  | 'created_at'
  | 'updated_at'
  | 'company'
  | 'next_action_at'

export type SortDirection = 'asc' | 'desc'

export type ActivityKind =
  | 'status_change'
  | 'note'
  | 'contact'
  | 'interview'
  | 'task'
  | 'other'

export interface Activity {
  id: string
  vacancy_id: string
  kind: ActivityKind
  description: string
  from_status: VacancyStatus | null
  to_status: VacancyStatus | null
  occurred_at: string
  created_at: string
}

export interface ActivityCreateInput {
  kind: ActivityKind
  description: string
  occurred_at?: string
}

export type ActivityUpdateInput = Partial<ActivityCreateInput>

export interface Vacancy {
  id: string
  company: string
  position: string
  url: string | null
  source: VacancySource
  status: VacancyStatus
  priority: VacancyPriority
  salary: string | null
  location: string | null
  work_format: WorkFormat
  skills: string[]
  notes: string | null
  next_action: string | null
  next_action_at: string | null
  created_at: string
  updated_at: string
}

export interface VacancyCreateInput {
  company: string
  position: string
  url: string | null
  source: VacancySource
  status: VacancyStatus
  priority: VacancyPriority
  salary: string | null
  location: string | null
  work_format: WorkFormat
  skills: string[]
  notes: string | null
  next_action: string | null
  next_action_at: string | null
}

export type VacancyUpdateInput = Partial<VacancyCreateInput>

export interface VacancyPage {
  items: Vacancy[]
  total: number
  page: number
  page_size: number
  pages: number
}

export interface SkillStat {
  name: string
  count: number
}

export interface Stats {
  total: number
  by_status: Record<VacancyStatus, number>
  by_priority: Record<VacancyPriority, number>
  top_skills: SkillStat[]
  due_today: number
  overdue_actions: number
  applied_to_interview_conversion: number | null
  average_days_by_status: Record<VacancyStatus, number>
}
