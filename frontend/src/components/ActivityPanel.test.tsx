import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createActivity,
  deleteActivity,
  getActivities,
  updateActivity,
} from '../api/activities'
import { activityFixture, vacancyFixture } from '../test/fixtures'
import { ActivityPanel } from './ActivityPanel'

vi.mock('../api/activities', () => ({
  createActivity: vi.fn(),
  deleteActivity: vi.fn(),
  getActivities: vi.fn(),
  updateActivity: vi.fn(),
}))

describe('ActivityPanel', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('добавляет новое событие в историю вакансии', async () => {
    const user = userEvent.setup()
    vi.mocked(getActivities).mockResolvedValue([])
    vi.mocked(createActivity).mockResolvedValue(activityFixture)

    render(<ActivityPanel vacancy={vacancyFixture} onClose={vi.fn()} />)

    expect(await screen.findByText('История пока пуста')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Добавить событие' }))
    await user.type(screen.getByLabelText('Описание'), 'Отправил резюме')
    await user.click(
      screen.getByRole('button', { name: 'Сохранить событие' }),
    )

    await waitFor(() => {
      expect(createActivity).toHaveBeenCalledWith(
        vacancyFixture.id,
        expect.objectContaining({
          kind: 'note',
          description: 'Отправил резюме',
          occurred_at: expect.any(String),
        }),
      )
    })
    expect(await screen.findByText('Отправил резюме')).toBeInTheDocument()
  })

  it('редактирует и удаляет существующее событие', async () => {
    const user = userEvent.setup()
    const updatedActivity = {
      ...activityFixture,
      description: 'Резюме принято рекрутером',
    }
    vi.mocked(getActivities).mockResolvedValue([activityFixture])
    vi.mocked(updateActivity).mockResolvedValue(updatedActivity)
    vi.mocked(deleteActivity).mockResolvedValue(undefined)
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(<ActivityPanel vacancy={vacancyFixture} onClose={vi.fn()} />)

    expect(await screen.findByText('Отправил резюме')).toBeInTheDocument()
    await user.click(
      screen.getByRole('button', { name: 'Редактировать событие' }),
    )
    const descriptionInput = screen.getByLabelText('Описание')
    await user.clear(descriptionInput)
    await user.type(descriptionInput, 'Резюме принято рекрутером')
    await user.click(
      screen.getByRole('button', { name: 'Сохранить событие' }),
    )

    expect(
      await screen.findByText('Резюме принято рекрутером'),
    ).toBeInTheDocument()
    expect(updateActivity).toHaveBeenCalledWith(
      vacancyFixture.id,
      activityFixture.id,
      expect.objectContaining({ description: 'Резюме принято рекрутером' }),
    )

    await user.click(screen.getByRole('button', { name: 'Удалить событие' }))

    await waitFor(() => {
      expect(deleteActivity).toHaveBeenCalledWith(
        vacancyFixture.id,
        activityFixture.id,
      )
    })
    expect(
      screen.queryByText('Резюме принято рекрутером'),
    ).not.toBeInTheDocument()
  })
})
