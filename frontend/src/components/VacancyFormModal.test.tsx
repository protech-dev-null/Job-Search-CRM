import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createVacancy, updateVacancy } from '../api/dashboard'
import { vacancyFixture } from '../test/fixtures'
import { VacancyFormModal } from './VacancyFormModal'

vi.mock('../api/dashboard', () => ({
  createVacancy: vi.fn(),
  updateVacancy: vi.fn(),
}))

describe('VacancyFormModal', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('создаёт вакансию из заполненной формы', async () => {
    const user = userEvent.setup()
    const onSaved = vi.fn()
    vi.mocked(createVacancy).mockResolvedValue(vacancyFixture)

    render(
      <VacancyFormModal vacancy={null} onClose={vi.fn()} onSaved={onSaved} />,
    )

    await user.type(screen.getByLabelText('Компания'), 'Acme')
    await user.type(screen.getByLabelText('Позиция'), 'Backend Engineer')
    await user.type(screen.getByLabelText('Навыки'), 'Python, FastAPI')
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))

    await waitFor(() => {
      expect(createVacancy).toHaveBeenCalledWith(
        expect.objectContaining({
          company: 'Acme',
          position: 'Backend Engineer',
          source: 'manual',
          status: 'interesting',
          priority: 'medium',
          work_format: 'remote',
          skills: ['Python', 'FastAPI'],
        }),
      )
    })
    expect(onSaved).toHaveBeenCalledWith(vacancyFixture)
  })

  it('сохраняет изменения существующей вакансии', async () => {
    const user = userEvent.setup()
    const updatedVacancy = { ...vacancyFixture, company: 'Acme Labs' }
    vi.mocked(updateVacancy).mockResolvedValue(updatedVacancy)

    render(
      <VacancyFormModal
        vacancy={vacancyFixture}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    )

    const companyInput = screen.getByLabelText('Компания')
    await user.clear(companyInput)
    await user.type(companyInput, 'Acme Labs')
    await user.click(screen.getByRole('button', { name: 'Сохранить' }))

    await waitFor(() => {
      expect(updateVacancy).toHaveBeenCalledWith(
        vacancyFixture.id,
        expect.objectContaining({ company: 'Acme Labs' }),
      )
    })
  })
})
