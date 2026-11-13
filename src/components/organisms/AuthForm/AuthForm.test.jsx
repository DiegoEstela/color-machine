import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AuthForm } from '../index.js'

const fill = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } })

describe('AuthForm', () => {
  it('muestra errores y no envía si hay datos inválidos', () => {
    const onSubmit = vi.fn()
    render(<AuthForm mode="login" onModeChange={() => {}} onSubmit={onSubmit} />)
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(screen.getByText('Ingresá un email válido.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('envía los valores y muestra el error devuelto', async () => {
    const onSubmit = vi.fn().mockResolvedValue({ error: 'Email o contraseña incorrectos.' })
    render(<AuthForm mode="login" onModeChange={() => {}} onSubmit={onSubmit} />)
    fill('Email', 'a@b.co')
    fill('Contraseña', 'secreta123')
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Email o contraseña incorrectos.'))
    expect(onSubmit).toHaveBeenCalledWith('login', { email: 'a@b.co', password: 'secreta123', confirm: '' })
  })

  it('muestra el aviso devuelto en el registro', async () => {
    const onSubmit = vi.fn().mockResolvedValue({ notice: 'Revisá tu correo' })
    render(<AuthForm mode="signup" onModeChange={() => {}} onSubmit={onSubmit} />)
    fill('Email', 'a@b.co')
    fill('Contraseña', '12345678')
    fill('Repetir contraseña', '12345678')
    fireEvent.click(screen.getByRole('button', { name: 'Registrarme' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Revisá tu correo'))
  })

  it('cambia de modo con los botones', () => {
    const onModeChange = vi.fn()
    render(<AuthForm mode="login" onModeChange={onModeChange} onSubmit={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(onModeChange).toHaveBeenCalledWith('signup')
  })

  it('permite ver y ocultar la contraseña', () => {
    render(<AuthForm mode="login" onModeChange={() => {}} onSubmit={vi.fn()} />)
    const input = screen.getByLabelText('Contraseña')
    expect(input).toHaveAttribute('type', 'password')
    fireEvent.click(screen.getByRole('button', { name: 'Ver' }))
    expect(input).toHaveAttribute('type', 'text')
  })
})
