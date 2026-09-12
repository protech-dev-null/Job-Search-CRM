import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import {
  downloadVacanciesCsv,
  getDueActions,
  getStats,
  getVacancies,
} from './api/dashboard'
import { getActivities } from './api/activities'
import { statsFixture, vacancyPageFixture } from './test/fixtures'

vi.mock('./api/dashboard', () => ({
  createVacancy: vi.fn(),
  deleteVacancy: vi.fn(),
  downloadVacanciesCsv: vi.fn(),
  getDueActions: vi.fn(),
  getStats: vi.fn(),
  getVacancies: vi.fn(),
  transitionVacancy: vi.fn(),
  updateVacancy: vi.fn(),
}))

vi.mock('./api/activities', () => ({
  createActivity: vi.fn(),
  deleteActivity: vi.fn(),
  getActivities: vi.fn(),
  updateActivity: vi.fn(),
}))

describe('App', () => {
  beforeEach(() => {
    vi.mocked(getStats).mockResolvedValue(statsFixture)
    vi.mocked(getVacancies).mockResolvedValue(vacancyPageFixture)
    vi.mocked(getDueActions).mockResolvedValue([])
    vi.mocked(downloadVacanciesCsv).mockResolvedValue(undefined)
    vi.mocked(getActivities).mockResolvedValue([])
  })

  it('показывает статистику и загруженные вакансии', async () => {
    render(<App />)

    expect(await screen.findByText('Backend Engineer')).toBeInTheDocument()
    expect(screen.getByText('Acme')).toBeInTheDocument()
    expect(screen.getByText('Python')).toBeInTheDocument()
    expect(screen.getByText('1 вакансий')).toBeInTheDocument()
  })

  it('открывает полную карточку выбранной вакансии', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(
      await screen.findByRole('button', {
        name: 'Открыть карточку Backend Engineer в Acme',
      }),
    )

    const dialog = screen.getByRole('dialog', { name: 'Backend Engineer' })
    expect(within(dialog).getByText('200 000 руб.')).toBeInTheDocument()
    expect(within(dialog).getByText('Отправить резюме')).toBeInTheDocument()
    expect(
      within(dialog).getByText('Интересная продуктовая команда'),
    ).toBeInTheDocument()
  })

  it('открывает историю отдельно от карточки вакансии', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(
      await screen.findByRole('button', {
        name: 'Открыть карточку Backend Engineer в Acme',
      }),
    )
    const detailDialog = screen.getByRole('dialog', {
      name: 'Backend Engineer',
    })

    await user.click(within(detailDialog).getByRole('button', { name: 'История' }))

    expect(
      await screen.findByRole('dialog', { name: 'История: Backend Engineer' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('dialog', { name: 'Backend Engineer' }),
    ).not.toBeInTheDocument()
  })

  it('передаёт сортировку в запрос и экспортирует текущую выборку', async () => {
    const user = userEvent.setup()
    render(<App />)

    await screen.findByText('Backend Engineer')
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Сортировка вакансий' }),
      'company:asc',
    )

    expect(await screen.findByText('Backend Engineer')).toBeInTheDocument()
    expect(getVacancies).toHaveBeenLastCalledWith(
      expect.objectContaining({ sortBy: 'company', sortDirection: 'asc' }),
      expect.any(AbortSignal),
    )

    await user.click(screen.getByRole('button', { name: 'Экспорт CSV' }))

    expect(downloadVacanciesCsv).toHaveBeenCalledWith({
      search: undefined,
      status: undefined,
      sortBy: 'company',
      sortDirection: 'asc',
    })
  })
})
