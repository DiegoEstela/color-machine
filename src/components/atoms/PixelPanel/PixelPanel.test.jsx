import { render, screen } from '@testing-library/react'
import { PixelPanel } from '../index.js'

describe('PixelPanel', () => {
  it('sin título solo muestra el contenido', () => {
    const { container } = render(<PixelPanel>contenido</PixelPanel>)
    expect(screen.getByText('contenido')).toBeInTheDocument()
    expect(container.querySelector('[class*="titlebar"]')).toBeNull()
  })
  it('con título muestra la barra de título y las acciones a su lado', () => {
    render(<PixelPanel title="Consejo" actions={<button>X</button>}>contenido</PixelPanel>)
    const bar = screen.getByText('Consejo').closest('[class*="titlebar"]')
    expect(bar).toContainElement(screen.getByRole('button', { name: 'X' }))
    expect(bar).not.toContainElement(screen.getByText('contenido'))
  })
  it('acepta los tonos nuevos y pasa atributos de accesibilidad', () => {
    render(<PixelPanel tone="sky" role="note" aria-label="Nota">hola</PixelPanel>)
    expect(screen.getByRole('note', { name: 'Nota' })).toHaveAttribute('data-tone', 'sky')
  })
})
