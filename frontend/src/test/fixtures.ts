import type { Activity, Stats, Vacancy, VacancyPage } from '../types'

export const vacancyFixture: Vacancy = {
  id: 'vacancy-1',
  company: 'Acme',
  position: 'Backend Engineer',
  url: 'https://example.com/vacancies/1',
  source: 'manual',
  status: 'interesting',
  priority: 'high',
  salary: '200 000 руб.',
  location: 'Москва',
  work_format: 'remote',
  skills: ['Python', 'FastAPI'],
  notes: 'Интересная продуктовая команда',
  next_action: 'Отправить резюме',
  next_action_at: '2026-07-03',
  created_at: '2026-07-01T10:00:00Z',
  updated_at: '2026-07-01T10:00:00Z',
}

export const vacancyPageFixture: VacancyPage = {
  items: [vacancyFixture],
  total: 1,
  page: 1,
  page_size: 8,
  pages: 1,
}

export const statsFixture: Stats = {
  total: 1,
  by_status: {
    interesting: 1,
    applied: 0,
    interview: 0,
    test: 0,
    offer: 0,
    rejected: 0,
    archived: 0,
  },
  by_priority: {
    low: 0,
    medium: 0,
    high: 1,
  },
  top_skills: [{ name: 'Python', count: 1 }],
  due_today: 0,
  overdue_actions: 0,
  applied_to_interview_conversion: null,
  average_days_by_status: {
    interesting: 0,
    applied: 0,
    interview: 0,
    test: 0,
    offer: 0,
    rejected: 0,
    archived: 0,
  },
}

export const activityFixture: Activity = {
  id: 'activity-1',
  vacancy_id: vacancyFixture.id,
  kind: 'note',
  description: 'Отправил резюме',
  from_status: null,
  to_status: null,
  occurred_at: '2026-07-02T12:00:00Z',
  created_at: '2026-07-02T12:00:00Z',
}
