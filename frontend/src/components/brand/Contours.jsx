import { useMemo } from 'react'

/** Deterministic topographic contour lines: noisy concentric rings around a few peaks. */
function ringPath(cx, cy, r, phase, wobble) {
  const steps = 96
  const pts = []
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2
    const k = 1 + wobble * (0.55 * Math.sin(3 * t + phase) + 0.3 * Math.sin(5 * t - phase * 1.7) + 0.15 * Math.sin(9 * t + phase * 0.5))
    pts.push([cx + Math.cos(t) * r * k, cy + Math.sin(t) * r * k * 0.82])
  }
  return `M${pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join('L')}Z`
}

const PEAKS = [
  { cx: 860, cy: 120, rings: 16, gap: 34, phase: 0.4 },
  { cx: 120, cy: 640, rings: 12, gap: 30, phase: 2.1 },
  { cx: 1180, cy: 760, rings: 9, gap: 28, phase: 4.2 },
]

export default function Contours({ className = '', opacity = 1 }) {
  const paths = useMemo(() => PEAKS.flatMap((p) => Array.from({ length: p.rings }, (_, i) => ({
    d: ringPath(p.cx, p.cy, 18 + i * p.gap, p.phase + i * 0.18, 0.06 + i * 0.006),
    major: i % 4 === 3,
  }))), [])
  return (
    <svg
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      viewBox="0 0 1280 860"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      style={{ opacity }}
    >
      {paths.map((p, i) => (
        <path key={i} d={p.d} fill="none" stroke="rgb(var(--fg))" strokeOpacity={p.major ? 0.085 : 0.04} strokeWidth={p.major ? 1 : 0.75} vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  )
}
