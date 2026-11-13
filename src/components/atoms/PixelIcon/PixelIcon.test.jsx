import { render, screen } from '@testing-library/react'
import { PixelIcon, ICON_NAMES } from '../index.js'

describe('PixelIcon', () => {
  it('es decorativo sin title', () => {
    const { container } = render(<PixelIcon name="camera" />)
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })
  it('tiene rol img con title', () => {
    render(<PixelIcon name="check" title="Listo" />)
    expect(screen.getByRole('img', { name: 'Listo' })).toBeInTheDocument()
  })
  it('todos los íconos son cuadrículas de 8x8', () => {
    for (const name of ICON_NAMES) {
      const { container, unmount } = render(<PixelIcon name={name} />)
      expect(container.querySelectorAll('rect').length).toBeGreaterThan(0)
      unmount()
    }
  })
  it('no renderiza nada con un nombre desconocido', () => {
    const { container } = render(<PixelIcon name="nope" />)
    expect(container).toBeEmptyDOMElement()
  })
})
