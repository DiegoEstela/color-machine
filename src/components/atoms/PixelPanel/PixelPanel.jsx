import styles from './PixelPanel.module.css'

export default function PixelPanel({ tone = 'surface', padding = 'md', children, ...rest }) {
  return (
    <div data-tone={tone} data-padding={padding} className={styles.panel} {...rest}>
      {children}
    </div>
  )
}
