import { useState } from 'react'
import {
  PixelButton, PixelText, PixelPanel, ColorSwatch, PixelInput, PixelIcon, PixelBar, PixelLogo, PixelSparkle, PixelJar,
  PixelMeter, ICON_NAMES,
} from '../../components/atoms/index.js'
import { OptionGroup, StepIndicator } from '../../components/molecules/index.js'
import styles from './Catalog.module.css'

const SAMPLE_COLORS = ['#e63946', '#f4a261', '#2a9d8f', '#457b9d', '#9b5de5']

export default function Catalog() {
  const [selected, setSelected] = useState(SAMPLE_COLORS[0])
  const [name, setName] = useState('')
  const [option, setOption] = useState('normal')

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

      <PixelPanel title="Marca y destellos" tone="pink">
        <section className={styles.section}>
          <div className={styles.row}>
            <PixelLogo size={64} />
            <PixelSparkle size={24} tone="yellow" />
            <PixelSparkle size={24} tone="pink" delay={300} />
            <PixelSparkle size={24} tone="blue" delay={600} />
            <PixelSparkle size={24} tone="mint" delay={900} />
          </div>
        </section>
      </PixelPanel>

      <PixelPanel title="Frascos y medidor" tone="sky">
        <section className={styles.section}>
          <div className={styles.row}>
            {SAMPLE_COLORS.map((c) => <PixelJar key={c} color={c} size="lg" label="Pintura" />)}
          </div>
          {[1, 2, 3, 4].map((n) => <PixelMeter key={n} level={n} label={`Nivel ${n}`} />)}
        </section>
      </PixelPanel>

      <PixelPanel title="Pasos y opciones" tone="peach">
        <section className={styles.section}>
          <StepIndicator step={2} total={3} />
          <OptionGroup
            label="¿Qué tan exacta querés la receta?"
            value={option}
            onChange={setOption}
            options={[
              { id: 'simple', label: 'Simple', hint: 'hasta 6 partes', description: 'Recetas cortas y fáciles de medir.' },
              { id: 'normal', label: 'Normal', hint: 'hasta 10 partes', description: 'Equilibrio entre facilidad y parecido.' },
              { id: 'preciso', label: 'Preciso', hint: 'hasta 16 partes', description: 'El color más parecido posible.' },
            ]}
          />
        </section>
      </PixelPanel>
    </main>
  )
}
