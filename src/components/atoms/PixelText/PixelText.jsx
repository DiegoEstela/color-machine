import styles from './PixelText.module.css'

/** variant="pixel" usa la fuente pixel (títulos, etiquetas cortas); "body" para lectura. */
export default function PixelText({
  as: Tag = 'p',
  size = 'md',
  tone = 'default',
  variant = 'pixel',
  className,
  children,
  ...rest
}) {
  return (
    <Tag
      data-size={size}
      data-tone={tone}
      data-variant={variant}
      className={className ? `${styles.text} ${className}` : styles.text}
      {...rest}
    >
      {children}
    </Tag>
  )
}
