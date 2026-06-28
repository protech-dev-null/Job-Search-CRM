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
  created_at: string
  updated_at: string
}

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
}
