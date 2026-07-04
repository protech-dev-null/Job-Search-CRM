import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { deleteVacancy } from '../api/dashboard'
import { vacancyFixture } from '../test/fixtures'
import { VacancyDetailPanel } from './VacancyDetailPanel'

vi.mock('../api/dashboard', () => ({
  deleteVacancy: vi.fn(),
}))

describe('VacancyDetailPanel', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('показывает полные данные и основные действия вакансии', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    const onViewActivities = vi.fn()

    render(
      <VacancyDetailPanel
        vacancy={vacancyFixture}
        onClose={vi.fn()}
        onEdit={onEdit}
        onViewActivities={onViewActivities}
        onDeleted={vi.fn()}
      />,
    )

    expect(screen.getByRole('dialog', { name: 'Backend Engineer' })).toBeInTheDocument()
    expect(screen.getByText('Высокий')).toBeInTheDocument()
    expect(screen.getByText('Удалённо')).toBeInTheDocument()
    expect(screen.getByText('Python')).toBeInTheDocument()
    expect(screen.getByText('FastAPI')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: vacancyFixture.url ?? '' }),
    ).toHaveAttribute('href', vacancyFixture.url)

    await user.click(screen.getByRole('button', { name: 'История' }))
    expect(onViewActivities).toHaveBeenCalledWith(vacancyFixture)

    await user.click(screen.getByRole('button', { name: 'Редактировать' }))
    expect(onEdit).toHaveBeenCalledWith(vacancyFixture)
  })

  it('удаляет вакансию после подтверждения', async () => {
    const user = userEvent.setup()
    const onDeleted = vi.fn()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.mocked(deleteVacancy).mockResolvedValue(undefined)

    render(
      <VacancyDetailPanel
        vacancy={vacancyFixture}
        onClose={vi.fn()}
        onEdit={vi.fn()}
        onViewActivities={vi.fn()}
        onDeleted={onDeleted}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Удалить вакансию' }))

    await waitFor(() => {
      expect(deleteVacancy).toHaveBeenCalledWith(vacancyFixture.id)
    })
    expect(onDeleted).toHaveBeenCalledWith(vacancyFixture)
  })

  it('показывает ошибку, если удалить вакансию не удалось', async () => {
    const user = userEvent.setup()
    const onDeleted = vi.fn()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.mocked(deleteVacancy).mockRejectedValue(new Error('Сервис недоступен'))

    render(
      <VacancyDetailPanel
        vacancy={vacancyFixture}
        onClose={vi.fn()}
        onEdit={vi.fn()}
        onViewActivities={vi.fn()}
        onDeleted={onDeleted}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Удалить вакансию' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Сервис недоступен')
    expect(onDeleted).not.toHaveBeenCalled()
  })
})
