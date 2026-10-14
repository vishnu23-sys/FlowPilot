import { motion } from 'framer-motion'
import { spring } from '../../lib/motion'

/** Horizontal bar that springs to its value. `value` is 0..1 (overflow shown as full + tone). */
export function ProgressBar({ value, color = 'rgb(var(--accent))', height = 6, track = 'rgb(var(--fg) / 0.07)', marker, label }) {
  const pct = Math.max(0, Math.min(value, 1)) * 100
  return (
    <div
      className="relative w-full rounded-full overflow-hidden"
      style={{ height, background: track }}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      aria-label={label}
    >
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={spring.bar}
      />
      {marker != null && (
        <span className="absolute inset-y-0 w-px bg-fg/40" style={{ left: `${Math.min(marker, 1) * 100}%` }} aria-hidden="true" />
      )}
    </div>
  )
}

/** Circular progress ring with content in the middle. */
export function Ring({ value, size = 64, stroke = 6, color = 'rgb(var(--accent))', children, label }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(value, 1))
  return (
    <div className="relative inline-grid place-items-center shrink-0" style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--fg) / 0.08)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={spring.bar}
        />
      </svg>
      {children && <div className="absolute inset-0 grid place-items-center">{children}</div>}
    </div>
  )
}

/** Semicircle gauge with tick marks for the health score. */
export function Gauge({ value, max = 100, size = 200, color = 'rgb(var(--accent))' }) {
  const stroke = 12
  const r = (size - stroke) / 2
  const cx = size / 2
  const cy = size / 2
  const arc = `M ${stroke / 2} ${cy} A ${r} ${r} 0 0 1 ${size - stroke / 2} ${cy}`
  const pct = Math.max(0, Math.min(value / max, 1))
  const ticks = Array.from({ length: 21 }, (_, i) => {
    const a = Math.PI - (i / 20) * Math.PI
    const inner = r - stroke - 4
    const outer = r - stroke - (i % 5 === 0 ? 12 : 8)
    return { x1: cx + inner * Math.cos(a), y1: cy - inner * Math.sin(a), x2: cx + outer * Math.cos(a), y2: cy - outer * Math.sin(a), major: i % 5 === 0 }
  })
  return (
    <svg viewBox={`0 0 ${size} ${size / 2 + 4}`} className="w-full max-w-[220px]" role="img" aria-label={`${value} out of ${max}`}>
      <path d={arc} fill="none" stroke="rgb(var(--fg) / 0.08)" strokeWidth={stroke} strokeLinecap="round" />
      <motion.path
        d={arc} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" pathLength={1}
        strokeDasharray="1 1"
        initial={{ strokeDashoffset: 1 }}
        animate={{ strokeDashoffset: 1 - pct }}
        transition={{ ...spring.bar, delay: 0.1 }}
      />
      {ticks.map(({ major, ...line }, i) => (
        <line key={i} {...line} stroke={`rgb(var(--fg) / ${major ? 0.28 : 0.12})`} strokeWidth={1} />
      ))}
    </svg>
  )
}
