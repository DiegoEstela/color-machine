import styles from './PixelButton.module.css'

export default function PixelButton({
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  children,
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      data-variant={variant}
      data-size={size}
      className={styles.button}
      {...rest}
    >
      {children}
    </button>
  )
}
