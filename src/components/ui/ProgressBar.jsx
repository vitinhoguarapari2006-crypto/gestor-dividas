export default function ProgressBar({ value, max, className = '' }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0

  const color =
    pct === 100
      ? '#22C55E'
      : pct >= 60
      ? '#FF6B00'
      : pct >= 30
      ? '#FF6B00'
      : '#FF6B00'

  return (
    <div className={`h-1.5 bg-surface-border rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: pct === 100 ? '#22C55E' : '#FF6B00' }}
      />
    </div>
  )
}
