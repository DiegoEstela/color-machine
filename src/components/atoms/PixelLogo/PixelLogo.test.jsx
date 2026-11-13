import { render, screen } from '@testing-library/react'
import { PixelLogo, PixelSparkle } from '../index.js'

describe('PixelLogo y PixelSparkle', () => {
  it('el logo es decorativo salvo que tenga título', () => {
    const { container, rerender } = render(<PixelLogo />)
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    rerender(<PixelLogo title="Color Machine" />)
    expect(screen.getByRole('img', { name: 'Color Machine' })).toBeInTheDocument()
  })
  it('el destello siempre es decorativo y puede quedarse quieto', () => {
    const { container } = render(<PixelSparkle still tone="pink" />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).toHaveAttribute('data-still')
    expect(svg).toHaveAttribute('data-tone', 'pink')
  })
})
