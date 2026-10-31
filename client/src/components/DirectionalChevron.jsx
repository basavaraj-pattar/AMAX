export default function DirectionalChevron({ direction = 'right', size = 16, strokeWidth = 4.2, className = '' }) {
  const path = direction === 'left' ? 'M16 4 8 12l8 8' : 'M8 4l8 8-8 8'
  return (
    <svg
      aria-hidden="true"
      className={`directional-chevron ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
    >
      <path d={path}/>
    </svg>
  )
}
