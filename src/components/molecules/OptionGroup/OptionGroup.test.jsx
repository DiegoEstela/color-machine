import { useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { OptionGroup } from '../index.js'

const OPTIONS = [
  { id: 'a', label: 'Simple', hint: 'hasta 6 partes', description: 'Recetas cortas.' },
  { id: 'b', label: 'Normal', hint: 'hasta 10 partes', description: 'Equilibrio.' },
  { id: 'c', label: 'Preciso', hint: 'hasta 16 partes', description: 'Más parecido.' },
]

function Harness(props) {
  const [value, setValue] = useState('b')
  return <OptionGroup label="Exactitud" options={OPTIONS} value={value} onChange={setValue} {...props} />
}

describe('OptionGroup', () => {
  it('es un radiogroup con título y una opción marcada', () => {
    render(<Harness />)
    expect(screen.getByRole('radiogroup', { name: 'Exactitud' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Normal/ })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: /Simple/ })).toHaveAttribute('aria-checked', 'false')
  })
  it('muestra el subtítulo de cada opción', () => {
    render(<Harness />)
    expect(screen.getByRole('radio', { name: /Simple.*hasta 6 partes/ })).toBeInTheDocument()
  })
  it('explica la opción elegida y cambia la frase al elegir otra', () => {
    render(<Harness />)
    expect(screen.getByText('Equilibrio.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('radio', { name: /Preciso/ }))
    expect(screen.getByText('Más parecido.')).toBeInTheDocument()
    expect(screen.queryByText('Equilibrio.')).not.toBeInTheDocument()
  })
  it('se navega con las flechas y da la vuelta', () => {
    render(<Harness />)
    const normal = screen.getByRole('radio', { name: /Normal/ })
    fireEvent.keyDown(normal, { key: 'ArrowRight' })
    expect(screen.getByRole('radio', { name: /Preciso/ })).toHaveAttribute('aria-checked', 'true')
    fireEvent.keyDown(screen.getByRole('radio', { name: /Preciso/ }), { key: 'ArrowRight' })
    expect(screen.getByRole('radio', { name: /Simple/ })).toHaveAttribute('aria-checked', 'true')
    fireEvent.keyDown(screen.getByRole('radio', { name: /Simple/ }), { key: 'ArrowLeft' })
    expect(screen.getByRole('radio', { name: /Preciso/ })).toHaveAttribute('aria-checked', 'true')
  })
  it('solo la opción elegida entra en el orden de tabulación', () => {
    render(<Harness />)
    expect(screen.getByRole('radio', { name: /Normal/ })).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('radio', { name: /Simple/ })).toHaveAttribute('tabindex', '-1')
  })
  it('en modo compacto no muestra subtítulos ni frase, pero conserva el nombre accesible', () => {
    render(<Harness compact />)
    expect(screen.queryByText('hasta 6 partes')).not.toBeInTheDocument()
    expect(screen.queryByText('Equilibrio.')).not.toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: 'Exactitud' })).toBeInTheDocument()
  })
  it('permite fijar cuántas opciones van por fila', () => {
    render(<Harness columns={2} />)
    expect(screen.getByRole('radiogroup').style.getPropertyValue('--columns')).toBe('2')
  })
  it('por defecto pone todas las opciones en una fila', () => {
    render(<Harness />)
    expect(screen.getByRole('radiogroup').style.getPropertyValue('--columns')).toBe('3')
  })
  it('muestra una acción a la derecha del título', () => {
    render(<Harness labelAction={<button>info</button>} />)
    expect(screen.getByRole('button', { name: 'info' })).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: 'Exactitud' })).toBeInTheDocument()
  })
  it('sin descripción en la opción elegida no muestra ninguna frase', () => {
    render(<OptionGroup label="Receta" options={[{ id: 'a', label: 'A', hint: 'h' }, { id: 'b', label: 'B' }]} value="a" onChange={() => {}} />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(document.querySelector('[aria-live]')).toBeNull()
  })
})
