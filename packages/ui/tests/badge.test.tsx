import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Badge } from '../src/components/badge'
import { badgeStyles } from '../src/components/badge.css'

describe('Badge', () => {
  it('renders its children', () => {
    render(<Badge>3 issues</Badge>)

    expect(screen.getByText('3 issues')).toBeInTheDocument()
  })

  it('applies the tone class', () => {
    render(<Badge tone="danger">critical</Badge>)

    expect(screen.getByText('critical')).toHaveClass(badgeStyles({ tone: 'danger' }))
  })

  it('defaults to the neutral tone', () => {
    render(<Badge>text</Badge>)

    expect(screen.getByText('text')).toHaveClass(badgeStyles({ tone: 'neutral' }))
  })

  it('appends an extra class for positioning', () => {
    render(
      <Badge tone="success" className="extra">
        passed
      </Badge>
    )
    const el = screen.getByText('passed')

    expect(el).toHaveClass('extra')
    expect(el).toHaveClass(badgeStyles({ tone: 'success' }))
  })
})
