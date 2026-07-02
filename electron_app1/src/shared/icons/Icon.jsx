export default function Icon({
  viewBox,
  width = 20,
  height = 20,
  weight = 2,
  children,
  className = '',
}) {
  return (
    <svg
      className={`icon ${className}`.trim()}
      viewBox={viewBox}
      width={width}
      height={height}
      aria-hidden="true"
      style={{ '--icon-weight': weight }}
    >
      {children}
    </svg>
  )
}
