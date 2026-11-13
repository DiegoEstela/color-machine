import PixelIcon from '../PixelIcon/PixelIcon.jsx'
import styles from './PixelButton.module.css'

export default function PixelButton({
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  icon,
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
      {icon && <PixelIcon name={icon} size={16} />}
      {children}
    </button>
  )
}
