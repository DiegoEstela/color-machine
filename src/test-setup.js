import '@testing-library/jest-dom/vitest'

// jsdom no implementa canvas: evita el aviso y deja que cada test lo simule si lo necesita.
HTMLCanvasElement.prototype.getContext = () => null
