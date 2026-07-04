import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { getStats, getVacancies } from './api/dashboard'
import { statsFixture, vacancyPageFixture } from './test/fixtures'

vi.mock('./api/dashboard', () => ({
  createVacancy: vi.fn(),
  getStats: vi.fn(),
  getVacancies: vi.fn(),
  updateVacancy: vi.fn(),
}))

describe('App', () => {
  beforeEach(() => {
    vi.mocked(getStats).mockResolvedValue(statsFixture)
    vi.mocked(getVacancies).mockResolvedValue(vacancyPageFixture)
  })

  it('показывает статистику и загруженные вакансии', async () => {
    render(<App />)

    expect(await screen.findByText('Backend Engineer')).toBeInTheDocument()
    expect(screen.getByText('Acme')).toBeInTheDocument()
    expect(screen.getByText('Python')).toBeInTheDocument()
    expect(screen.getByText('1 вакансий')).toBeInTheDocument()
  })
})
