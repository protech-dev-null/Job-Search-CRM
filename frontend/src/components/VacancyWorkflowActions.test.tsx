import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { transitionVacancy } from '../api/dashboard'
import { vacancyFixture } from '../test/fixtures'
import { VacancyWorkflowActions } from './VacancyWorkflowActions'

vi.mock('../api/dashboard', () => ({
  transitionVacancy: vi.fn(),
}))

describe('VacancyWorkflowActions', () => {
  it('moves an interesting vacancy to applied status', async () => {
    const user = userEvent.setup()
    const onTransitioned = vi.fn()
    const transitionedVacancy = { ...vacancyFixture, status: 'applied' as const }
    vi.mocked(transitionVacancy).mockResolvedValue(transitionedVacancy)

    render(
      <VacancyWorkflowActions
        vacancy={vacancyFixture}
        onTransitioned={onTransitioned}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Откликнуться' }))

    await waitFor(() => {
      expect(transitionVacancy).toHaveBeenCalledWith(vacancyFixture.id, 'applied')
    })
    expect(onTransitioned).toHaveBeenCalledWith(transitionedVacancy)
  })
})
