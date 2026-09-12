import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { getOverdueActions, getStats, getVacancies } from './api/dashboard'
import { statsFixture, vacancyPageFixture } from './test/fixtures'

vi.mock('./api/dashboard', () => ({
  createVacancy: vi.fn(),
  deleteVacancy: vi.fn(),
  getOverdueActions: vi.fn(),
  getStats: vi.fn(),
  getVacancies: vi.fn(),
  updateVacancy: vi.fn(),
}))

describe('App', () => {
  beforeEach(() => {
    vi.mocked(getStats).mockResolvedValue(statsFixture)
    vi.mocked(getVacancies).mockResolvedValue(vacancyPageFixture)
    vi.mocked(getOverdueActions).mockResolvedValue([])
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
})
