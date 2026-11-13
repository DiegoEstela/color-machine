import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ImproveAdvice } from '../index.js'

const negro = { id: 'base-negro', name: 'Negro', hex: '#141414' }
const plan = { roles: [negro], recipe: { parts: [{ name: 'Rojo', parts: 1 }, { name: 'Amarillo', parts: 3 }, { name: 'Negro', parts: 4 }] }, quality: 'Muy parecido', enough: true, deltaE: 3.3 }
const base = {
  gap: { sentences: ['Tu mezcla es un poco más clara que tu color.', 'Y tira a azul.'] },
  plan, space: 3, onAdd: () => {}, onAddAll: () => {}, onUsePrecision: () => {},
}

describe('ImproveAdvice: necesita ayuda (ΔE ≥ 5)', () => {
  it('viene abierto: cómo está, qué agregar con la receta nueva y los botones', () => {
    render(<ImproveAdvice needsHelp {...base} />)
    expect(screen.getByRole('note', { name: 'Con estas pinturas no se llega del todo' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Para acercarte más' })).toBeInTheDocument()
    expect(screen.getByText(/más clara que tu color\. Y tira a azul\./)).toBeInTheDocument()
    expect(screen.getByText(/te falta: Negro\. Con eso queda muy parecido: 1 Rojo · 3 Amarillo · 4 Negro/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sumar Negro/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Ver cómo/ })).not.toBeInTheDocument() // no se pliega
  })
  it('sin plan muestra el respaldo', () => {
    render(<ImproveAdvice needsHelp {...base} plan={null} fallback={<p>Buscando qué colores te faltan...</p>} />)
    expect(screen.getByText('Buscando qué colores te faltan...')).toBeInTheDocument()
  })
})

describe('ImproveAdvice: se puede mejorar (ΔE entre 2 y 5)', () => {
  it('viene plegado en una línea y se abre y se cierra con un toque', () => {
    render(<ImproveAdvice {...base} />)
    const toggle = screen.getByRole('button', { name: /Podría estar más cerca/ })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText(/te falta: Negro/)).not.toBeInTheDocument()
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(/te falta: Negro/)).toBeInTheDocument()
    fireEvent.click(toggle)
    expect(screen.queryByText(/te falta: Negro/)).not.toBeInTheDocument()
  })
  it('es una nota con nombre accesible propio', () => {
    render(<ImproveAdvice {...base} />)
    expect(screen.getByRole('note', { name: 'Podría estar más cerca' })).toBeInTheDocument()
  })
})

describe('ImproveAdvice: qué cambiar y consejo', () => {
  const full = { ...base, needsHelp: true, precision: { label: 'Preciso', quality: 'Muy parecido', summary: '2 Rojo · 5 Amarillo · 2 Azul · 6 Negro' }, toneAdvice: 'Tira a azul: probá menos Azul o más Amarillo.', tip: { text: 'Un marrón se hace con rojo, amarillo y azul.' } }

  it('ofrece usar una precisión mayor con lo que lograría', () => {
    const onUsePrecision = vi.fn()
    render(<ImproveAdvice {...full} onUsePrecision={onUsePrecision} />)
    expect(screen.getByText(/Con Preciso queda muy parecido: 2 Rojo/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Usar Preciso' }))
    expect(onUsePrecision).toHaveBeenCalledTimes(1)
  })
  it('muestra hacia dónde corregir con las pinturas de la receta y el consejo del tipo de color', () => {
    render(<ImproveAdvice {...full} />)
    expect(screen.getByText('Tira a azul: probá menos Azul o más Amarillo.')).toBeInTheDocument()
    expect(screen.getByRole('note', { name: 'Consejo para este tipo de color' })).toHaveTextContent('Un marrón se hace con rojo')
  })
  it('sin precisión ni corrección de tono no hay sección "Qué cambiar"', () => {
    render(<ImproveAdvice {...base} needsHelp />)
    expect(screen.queryByRole('region', { name: 'Qué cambiar' })).not.toBeInTheDocument()
  })
})
