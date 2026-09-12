import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { statsFixture } from '../test/fixtures'
import { WorkflowAnalyticsPanel } from './WorkflowAnalyticsPanel'

describe('WorkflowAnalyticsPanel', () => {
  it('shows the workflow funnel and conversion metrics', () => {
    render(
      <WorkflowAnalyticsPanel
        stats={{
          ...statsFixture,
          by_status: {
            ...statsFixture.by_status,
            applied: 4,
            interview: 2,
          },
          applied_to_interview_conversion: 50,
          average_days_by_status: {
            ...statsFixture.average_days_by_status,
            applied: 3.5,
          },
        }}
        isLoading={false}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Воронка вакансий' })).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(screen.getByText('3.5 дн.')).toBeInTheDocument()
  })
})
