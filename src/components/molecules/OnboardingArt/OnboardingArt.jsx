import { PixelIcon, PixelJar, PixelLogo, PixelSparkle, PixelText } from '../../atoms/index.js'
import styles from './OnboardingArt.module.css'

const RED = '#e4002b'
const YELLOW = '#fcd116'
const BLUE = '#1d3fbb'
const PURPLE = '#7a3f9d'
const GREEN = '#2e8b3d'
const ORANGE = '#e8884a'

const Plus = () => <PixelIcon name="plus" size={20} />
const Equals = () => <PixelText as="span" size="lg" aria-hidden="true">=</PixelText>

/** Mini escenas pixel para cada tarjeta (con átomos que ya existen; sin imágenes). */
const SCENES = {
  welcome: () => (
    <>
      <PixelSparkle size={18} tone="pink" delay={0} />
      <PixelLogo size={84} />
      <PixelSparkle size={14} tone="blue" delay={500} />
    </>
  ),
  color: () => (
    <>
      <PixelIcon name="wheel" size={52} />
      <PixelIcon name="camera" size={52} />
      <PixelJar color={ORANGE} size="mid" />
    </>
  ),
  paints: () => (
    <>
      <PixelJar color={RED} size="mid" />
      <PixelJar color={YELLOW} size="mid" />
      <PixelJar color={BLUE} size="mid" />
    </>
  ),
  mix: () => (
    <>
      <PixelJar color={RED} size="mid" />
      <Plus />
      <PixelJar color={BLUE} size="mid" />
      <Equals />
      <PixelJar color={PURPLE} size="mid" />
    </>
  ),
  plan: () => (
    <>
      <PixelJar color={YELLOW} size="mid" />
      <Plus />
      <PixelJar color={BLUE} size="mid" />
      <Equals />
      <PixelJar color={GREEN} size="mid" />
      <PixelSparkle size={14} tone="yellow" delay={300} />
    </>
  ),
  recipes: () => (
    <>
      <PixelIcon name="book" size={52} />
      <PixelJar color={PURPLE} size="mid" />
      <PixelIcon name="tune" size={52} />
    </>
  ),
  menu: () => (
    <>
      <PixelIcon name="menu" size={52} />
      <PixelJar color={RED} size="mid" />
      <PixelIcon name="user" size={52} />
    </>
  ),
  install: () => (
    <>
      <PixelLogo size={64} />
      <PixelSparkle size={16} tone="mint" delay={200} />
      <PixelIcon name="save" size={44} />
    </>
  ),
}

/** Ilustración decorativa de una tarjeta del onboarding. `scene` es una clave de `SCENES`. */
export default function OnboardingArt({ scene }) {
  const Scene = SCENES[scene] ?? SCENES.welcome
  return (
    <div className={styles.art} aria-hidden="true" data-scene={scene} data-known={Boolean(SCENES[scene])}>
      <Scene />
    </div>
  )
}
