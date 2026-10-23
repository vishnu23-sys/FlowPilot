import { useMemo, useState } from 'react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceDot } from 'recharts'
import Panel from '../../components/ui/Panel'
import Segmented from '../../components/ui/Segmented'
import { Skeleton } from '../../components/ui/Skeleton'
import { axisProps, gridProps, makeTooltip, AreaGradient, chartAnimation } from '../../components/charts/chartTheme'
import { useAnalytics } from '../../api/queries'
import { formatCompact, formatMoney } from '../../lib/format'

const RANGES = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
]

function monthSeries(summary) {
  const cur = summary?.daily || []
  const prev = summary?.previous_daily || []
  const now = new Date()
  const monthShort = now.toLocaleDateString('en-GB', { month: 'short' })
  const days = Math.max(prev.length, new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate())
  return Array.from({ length: days }, (_, i) => ({
    label: `${i + 1} ${monthShort}`,
    current: cur[i]?.total ?? null,
    previous: prev[i]?.total ?? null,
  }))
}

/** Pinned label on the latest point, like a price tag on the line. */
function Callout({ viewBox, value }) {
  if (!viewBox) return null
  const { x, y } = viewBox
  const w = Math.max(64, value.length * 7.4 + 16)
  const left = Math.max(4, x - w / 2)
  return (
    <g>
      <rect x={left} y={y - 34} width={w} height={22} rx={6} fill="rgb(var(--fg))" />
      <text x={left + w / 2} y={y - 19} textAnchor="middle" fontSize={11} fontFamily="Geist Mono Variable, monospace" fill="rgb(var(--canvas))">
        {value}
      </text>
    </g>
  )
}

export default function SpendCurve({ summary, currency, loading }) {
  const [range, setRange] = useState('month')
  const weekly = useAnalytics('weekly')
  const yearly = useAnalytics('yearly')

  const data = useMemo(() => {
    if (range === 'month') return monthSeries(summary)
    const src = range === 'week' ? weekly.data : yearly.data
    return (src?.trend || []).map((p) => ({ label: p.period, current: p.total, previous: null }))
  }, [range, summary, weekly.data, yearly.data])

  const last = [...data].reverse().find((d) => d.current != null)
  const pending = loading || (range === 'week' && weekly.isPending) || (range === 'year' && yearly.isPending)
  const Tip = useMemo(() => makeTooltip({
    format: (v) => formatMoney(v, currency),
    labels: { current: range === 'month' ? 'This month' : 'Spent', previous: 'Last month' },
    dashed: ['previous'],
  }), [currency, range])

  return (
    <Panel
      className="lg:col-span-2"
      title={
        <div>
          <h2 className="text-sm text-muted">Spending</h2>
          <p className="text-xs text-faint mt-0.5">
            {range === 'month' ? 'Running total, this month against last' : range === 'week' ? 'Each day, last 7 days' : 'Each month, last 12 months'}
          </p>
        </div>
      }
      action={<Segmented size="sm" label="Spending range" options={RANGES} value={range} onChange={setRange} />}
    >
      <div className="h-[240px] -ml-2">
        {pending ? <Skeleton className="h-full w-full" /> : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 40, right: 24, left: 0, bottom: 0 }}>
              <defs><AreaGradient id="spend-fill" color="rgb(var(--accent))" from={0.22} /></defs>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" minTickGap={28} />
              <YAxis {...axisProps} width={52} tickFormatter={(v) => formatCompact(v, currency)} />
              <Tooltip content={<Tip />} cursor={{ stroke: 'rgb(var(--line-strong))', strokeDasharray: '3 3' }} />
              {range === 'month' && (
                <Area type="monotone" dataKey="previous" stroke="rgb(var(--muted))" strokeDasharray="4 4" strokeWidth={1.5}
                  fill="none" dot={false} activeDot={false} connectNulls {...chartAnimation} />
              )}
              <Area type="monotone" dataKey="current" stroke="rgb(var(--accent))" strokeWidth={2}
                fill="url(#spend-fill)" dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: 'rgb(var(--panel))' }} {...chartAnimation} />
              {last && (
                <ReferenceDot
                  x={last.label} y={last.current} r={4.5}
                  fill="rgb(var(--panel))" stroke="rgb(var(--accent))" strokeWidth={2}
                  label={<Callout value={formatMoney(last.current, currency)} />}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </Panel>
  )
}
