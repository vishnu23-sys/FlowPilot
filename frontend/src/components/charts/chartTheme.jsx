/** One chart theme for every Recharts chart: axes, grid, tooltip. Colours come from CSS tokens. */

export const axisProps = {
  stroke: 'rgb(var(--line))',
  tick: { fill: 'rgb(var(--muted))', fontSize: 11, fontFamily: 'Geist Mono Variable, monospace' },
  tickLine: false,
  axisLine: false,
}

export const gridProps = {
  stroke: 'rgb(var(--line))',
  strokeDasharray: '2 4',
  vertical: false,
}

export const chartAnimation = { isAnimationActive: true, animationDuration: 650, animationEasing: 'ease-out' }

/** Tooltip card. `rows` are [{ label, value, color, dashed? }]. */
export function TooltipCard({ title, rows }) {
  return (
    <div className="min-w-[160px] rounded-[10px] border border-line bg-raised px-3 py-2 shadow-pop">
      {title && <p className="text-xs text-muted mb-1.5">{title}</p>}
      <div className="space-y-1">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-2 text-xs">
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={r.dashed ? { border: `1.5px dashed ${r.color}` } : { backgroundColor: r.color }}
              aria-hidden="true"
            />
            <span className="text-muted flex-1">{r.label}</span>
            <span className="num text-fg">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Recharts `content` adapter: maps payload entries through `format`. */
export function makeTooltip({ format, title, labels = {}, dashed = [] }) {
  return function ChartTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null
    return (
      <TooltipCard
        title={title ? title(label, payload) : label}
        rows={payload
          .filter((p) => p.value != null)
          .map((p) => ({
            label: labels[p.dataKey] || p.name || p.dataKey,
            value: format(p.value, p),
            color: p.color || p.stroke || p.fill,
            dashed: dashed.includes(p.dataKey),
          }))}
      />
    )
  }
}

/** Vertical fade for area fills. */
export function AreaGradient({ id, color, from = 0.28, to = 0 }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={color} stopOpacity={from} />
      <stop offset="100%" stopColor={color} stopOpacity={to} />
    </linearGradient>
  )
}
