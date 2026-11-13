import { render, screen } from '@testing-library/react'
import { ColorPreview } from '../index.js'

describe('ColorPreview', () => {
  it('sin color muestra un aviso', () => {
    render(<ColorPreview color={null} />)
    expect(screen.getByText('Elegí un color')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
  it('con color muestra el swatch con nombre accesible', () => {
    render(<ColorPreview color="#e63946" />)
    expect(screen.getByRole('img', { name: 'Color objetivo #e63946' })).toBeInTheDocument()
  })
  it('muestra la miniatura del recorte si existe', () => {
    render(<ColorPreview color="#e63946" thumbnail="data:image/png;base64,AAA" />)
    expect(screen.getByAltText('Recorte de la foto')).toHaveAttribute('src', 'data:image/png;base64,AAA')
  })
})
