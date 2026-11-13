import styles from './PixelPanel.module.css'

/**
 * Panel con marco pixel. Con `title` muestra una barra de título (como una ventana de juego);
 * `actions` se muestra a la derecha de esa barra.
 */
export default function PixelPanel({ tone = 'surface', padding = 'md', title, actions, children, ...rest }) {
  return (
    <div data-tone={tone} data-padding={padding} className={styles.panel} {...rest}>
      {title && (
        <div className={styles.titlebar}>
          <span className={styles.title}>{title}</span>
          {actions}
        </div>
      )}
      <div className={styles.body}>{children}</div>
    </div>
  )
}
