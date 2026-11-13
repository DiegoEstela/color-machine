import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ART_SCENES, CONTEXT, TOUR } from '../../../features/onboarding/steps.js'
import { OnboardingArt } from '../index.js'

describe('OnboardingArt', () => {
  it('es decorativa: oculta para lectores de pantalla', () => {
    const { container } = render(<OnboardingArt scene="mix" />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelectorAll('svg').length).toBeGreaterThan(2)
  })
  it('una escena desconocida no rompe', () => {
    const { container } = render(<OnboardingArt scene="nada" />)
    expect(container.querySelector('svg')).not.toBeNull()
  })
  it('hay una escena dibujada para cada ilustración que piden las tarjetas y la ayuda', () => {
    const wanted = new Set([...TOUR.map((c) => c.art), ...Object.values(CONTEXT).map((c) => c.art)])
    for (const art of wanted) expect(ART_SCENES).toContain(art)
    for (const scene of ART_SCENES) {
      const { container, unmount } = render(<OnboardingArt scene={scene} />)
      expect(container.firstChild).toHaveAttribute('data-known', 'true')
      unmount()
    }
  })
})
