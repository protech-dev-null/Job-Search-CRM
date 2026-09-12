import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { completeNextAction } from '../api/dashboard'
import { vacancyFixture } from '../test/fixtures'
import { OverdueActionsPanel } from './OverdueActionsPanel'

vi.mock('../api/dashboard', () => ({
  completeNextAction: vi.fn(),
}))

describe('OverdueActionsPanel', () => {
  it('completes an overdue action from the dashboard', async () => {
    const user = userEvent.setup()
    const onCompleted = vi.fn()
    vi.mocked(completeNextAction).mockResolvedValue({
      ...vacancyFixture,
      next_action: null,
      next_action_at: null,
    })

    render(
      <OverdueActionsPanel
        actions={[vacancyFixture]}
        isLoading={false}
        onCompleted={onCompleted}
      />,
    )

    await user.click(
      screen.getByRole('button', { name: 'Завершить: Отправить резюме' }),
    )

    await waitFor(() => {
      expect(completeNextAction).toHaveBeenCalledWith(vacancyFixture.id)
    })
    expect(onCompleted).toHaveBeenCalledWith(
      expect.objectContaining({ next_action: null, next_action_at: null }),
    )
  })
})
