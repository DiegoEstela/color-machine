import { useState } from 'react'
import {
  PixelButton, PixelText, PixelPanel, ColorSwatch, PixelInput, PixelIcon, PixelBar, ICON_NAMES,
} from '../../components/atoms/index.js'
import styles from './Catalog.module.css'

const SAMPLE_COLORS = ['#e63946', '#f4a261', '#2a9d8f', '#457b9d', '#9b5de5']

export default function Catalog() {
  const [selected, setSelected] = useState(SAMPLE_COLORS[0])
  const [name, setName] = useState('')

  return (
    <main className={styles.page}>
      <PixelText as="h1" size="lg">Color Machine</PixelText>
      <PixelText variant="body" tone="soft">Catálogo de átomos</PixelText>

      <PixelPanel>
        <section className={styles.section}>
          <PixelText as="h2" size="sm">Botones</PixelText>
          <div className={styles.row}>
            <PixelButton>Primario</PixelButton>
            <PixelButton variant="secondary">Secundario</PixelButton>
            <PixelButton variant="danger">Borrar</PixelButton>
            <PixelButton disabled>Inactivo</PixelButton>
            <PixelButton size="lg"><PixelIcon name="camera" /> Foto</PixelButton>
          </div>
        </section>
      </PixelPanel>

      <PixelPanel tone="lavender">
        <section className={styles.section}>
          <PixelText as="h2" size="sm">Colores (tocá uno)</PixelText>
          <div className={styles.row}>
            {SAMPLE_COLORS.map((c) => (
              <ColorSwatch key={c} color={c} selected={c === selected} onClick={() => setSelected(c)} />
            ))}
          </div>
          <ColorSwatch color={selected} size="xl" label="Color elegido" />
          <PixelBar value={3} max={8} color={selected} label="Proporción" />
        </section>
      </PixelPanel>

      <PixelPanel tone="yellow">
        <section className={styles.section}>
          <PixelText as="h2" size="sm">Campos</PixelText>
          <PixelInput label="Nombre del color" value={name} onChange={(e) => setName(e.target.value)} placeholder="Violeta suave" />
          <PixelInput label="Con error" defaultValue="x" error="Mínimo 2 letras" />
        </section>
      </PixelPanel>

      <PixelPanel tone="mint">
        <section className={styles.section}>
          <PixelText as="h2" size="sm">Íconos</PixelText>
          <div className={styles.row}>
            {ICON_NAMES.map((n) => <PixelIcon key={n} name={n} size={32} title={n} />)}
          </div>
          <PixelText variant="body" tone="soft">Texto de lectura con fuente del sistema para que sea cómodo en párrafos largos.</PixelText>
        </section>
      </PixelPanel>
    </main>
  )
}
