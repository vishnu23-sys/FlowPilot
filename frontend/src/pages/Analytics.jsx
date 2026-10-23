import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { ResponsiveContainer, BarChart, Bar, ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Panel from '../components/ui/Panel'
import Segmented from '../components/ui/Segmented'
import RollingNumber from '../components/ui/RollingNumber'
import { Skeleton } from '../components/ui/Skeleton'
import { ErrorState } from '../components/ui/States'
import { axisProps, gridProps, makeTooltip, AreaGradient, chartAnimation } from '../components/charts/chartTheme'
import { useAnalytics } from '../api/queries'
import { useCurrency } from '../context/AuthContext'
import { CATEGORIES, categoryColor } from '../lib/categories'
import { formatCompact, formatMoney, formatPercent } from '../lib/format'
import { usePageEntrance } from '../lib/entrance'
import { spring, staggerItem } from '../lib/motion'
import Reveal from '../components/charts/Reveal'

const RANGES = [
  { value: 'weekly', label: 'Week', period: 'day', previous: 'the week before' },
  { value: 'monthly', label: '6 months', period: 'month', previous: 'the 6 months before' },
  { value: 'yearly', label: 'Year', period: 'month', previous: 'the year before' },
]

function Change({ pct, invert = true }) {
  if (pct == null) return <span className="text-muted">new</span>
  if (Math.abs(pct) < 0.5) return <span className="inline-flex items-center gap-0.5 text-muted"><Minus size={12} aria-hidden="true" />flat</span>
  const up = pct > 0
  const bad = invert ? up : !up
  const Icon = up ? ArrowUpRight : ArrowDownRight
  return (
    <span className={`inline-flex items-center gap-0.5 num ${bad ? 'text-danger' : 'text-success'}`}>
      <Icon size={12} aria-hidden="true" />{formatPercent(Math.abs(pct))}
    </span>
  )
}

function Hero({ data, range, currency }) {
  const t = data.totals
  const meta = RANGES.find((r) => r.value === range)
  return (
    <motion.div variants={staggerItem} data-glow className="grid sm:grid-cols-3 rounded-panel border border-line bg-panel divide-y sm:divide-y-0 sm:divide-x divide-line mb-4">
      <div className="p-5 md:p-6">
        <p className="text-sm text-muted">Spent</p>
        <p className="serif text-[52px] leading-none mt-2"><RollingNumber value={formatMoney(t.current, currency, { decimals: 0 })} /></p>
        <p className="text-xs text-muted mt-3"><Change pct={t.change_pct} /> against {meta.previous}</p>
      </div>
      <div className="p-5 md:p-6">
        <p className="text-sm text-muted">Average per {meta.period}</p>
        <p className="serif text-[52px] leading-none mt-2"><RollingNumber value={formatMoney(t.average_per_period, currency, { decimals: 0 })} /></p>
        <p className="text-xs text-muted mt-3">across <span className="num text-fg">{data.trend.length}</span> {meta.period}s</p>
      </div>
      <div className="p-5 md:p-6">
        <p className="text-sm text-muted">Transactions</p>
        <p className="serif text-[52px] leading-none mt-2"><RollingNumber value={String(t.transactions)} /></p>
        <p className="text-xs text-muted mt-3">
          {t.transactions ? <>about <span className="num text-fg">{formatMoney(t.current / t.transactions, currency)}</span> each</> : 'None in this range'}
        </p>
      </div>
    </motion.div>
  )
}

function StackedTrend({ data, currency }) {
  const cats = CATEGORIES.map((c) => c.id).filter((id) => data.trend.some((p) => p.by_category[id]))
  const rows = data.trend.map((p) => ({ period: p.period, ...Object.fromEntries(cats.map((c) => [c, p.by_category[c] || 0])) }))
  const Tip = useMemo(() => makeTooltip({ format: (v) => formatMoney(v, currency) }), [currency])
  return (
    <Panel className="lg:col-span-2" title="Spending by category over time">
      <Reveal className="h-[280px] -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="period" {...axisProps} tickFormatter={(p) => p.split(' ')[0]} interval="preserveStartEnd" minTickGap={12} />
            <YAxis {...axisProps} width={52} tickFormatter={(v) => formatCompact(v, currency)} />
            <Tooltip content={<Tip />} cursor={{ fill: 'rgb(var(--fg) / 0.04)' }} />
            {cats.map((c, i) => (
              <Bar key={c} dataKey={c} stackId="s" fill={categoryColor(c)} maxBarSize={36}
                radius={i === cats.length - 1 ? [4, 4, 0, 0] : 0} {...chartAnimation} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </Reveal>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-xs text-muted">
        {cats.map((c) => (
          <span key={c} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: categoryColor(c) }} aria-hidden="true" />{c}
          </span>
        ))}
      </div>
    </Panel>
  )
}

function Comparison({ data, range, currency }) {
  const rows = data.comparison.slice(0, 8)
  const max = Math.max(...rows.map((r) => Math.max(r.current, r.previous)), 1)
  return (
    <Panel title={`Against ${RANGES.find((r) => r.value === range).previous}`}>
      {!rows.length ? <p className="text-sm text-muted py-6">Nothing to compare yet.</p> : (
        <ul className="space-y-3 pt-1">
          {rows.map((r) => (
            <li key={r.category}>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: categoryColor(r.category) }} aria-hidden="true" />{r.category}
                </span>
                <span className="flex items-center gap-3 text-xs">
                  <Change pct={r.change_pct} />
                  <span className="num text-fg w-20 text-right">{formatMoney(r.current, currency)}</span>
                </span>
              </div>
              <div className="relative h-1.5 rounded-full bg-fg/[0.06]">
                <motion.span className="absolute inset-y-0 left-0 rounded-full bg-fg/20" initial={false}
                  animate={{ width: `${(r.previous / max) * 100}%` }} transition={spring.bar} />
                <motion.span className="absolute inset-y-0 left-0 rounded-full" style={{ backgroundColor: categoryColor(r.category) }} initial={false}
                  animate={{ width: `${(r.current / max) * 100}%`, opacity: 0.9 }} transition={spring.bar} />
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="text-2xs text-faint mt-4">Colour is this period; grey is the one before.</p>
    </Panel>
  )
}

function Savings({ data, currency }) {
  const Tip = useMemo(() => makeTooltip({
    format: (v) => formatMoney(v, currency),
    labels: { income: 'Income', expenses: 'Spending', savings: 'Kept' },
  }), [currency])
  if (!data.savings_trend.length) {
    return (
      <Panel className="lg:col-span-3" title="Income against spending">
        <p className="text-sm text-muted py-6">Log income or set an expected amount to see what you keep each month.</p>
      </Panel>
    )
  }
  return (
    <Panel className="lg:col-span-3" title="Income against spending">
      <Reveal className="h-[260px] -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data.savings_trend} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <defs><AreaGradient id="kept-fill" color="rgb(var(--success))" from={0.2} /></defs>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="period" {...axisProps} tickFormatter={(p) => p.split(' ')[0]} />
            <YAxis {...axisProps} width={56} tickFormatter={(v) => formatCompact(v, currency)} />
            <Tooltip content={<Tip />} />
            <Area type="monotone" dataKey="savings" stroke="rgb(var(--success))" fill="url(#kept-fill)" strokeWidth={1.5} {...chartAnimation} />
            <Line type="monotone" dataKey="income" stroke="rgb(var(--accent))" strokeWidth={2} dot={false} {...chartAnimation} />
            <Line type="monotone" dataKey="expenses" stroke="rgb(var(--fg) / 0.5)" strokeWidth={2} strokeDasharray="4 4" dot={false} {...chartAnimation} />
          </ComposedChart>
        </ResponsiveContainer>
      </Reveal>
      <div className="flex gap-4 mt-2 text-xs text-muted">
        <span className="flex items-center gap-1.5"><span className="h-0.5 w-3 bg-accent" aria-hidden="true" />Income</span>
        <span className="flex items-center gap-1.5"><span className="h-0.5 w-3 border-t-2 border-dashed border-fg/50" aria-hidden="true" />Spending</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm bg-success/30" aria-hidden="true" />Kept</span>
      </div>
    </Panel>
  )
}

export default function Analytics() {
  const currency = useCurrency()
  const entrance = usePageEntrance()
  const [range, setRange] = useState('monthly')
  const query = useAnalytics(range)
  const data = query.data

  return (
    <motion.div {...entrance}>
      <PageHeader
        context="Patterns over time"
        title="Analytics"
        actions={<Segmented label="Range" options={RANGES} value={range} onChange={setRange} />}
      />
      {query.isError && !data ? <Panel><ErrorState error={query.error} onRetry={() => query.refetch()} /></Panel> : !data ? (
        <div className="space-y-4"><Skeleton className="h-36" /><Skeleton className="h-80" /></div>
      ) : (
        <div className={`transition-opacity duration-200 ${query.isPlaceholderData ? 'opacity-60' : ''}`}>
          <Hero data={data} range={data.range} currency={currency} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <StackedTrend data={data} currency={currency} />
            <Comparison data={data} range={data.range} currency={currency} />
            {data.range !== 'weekly' && <Savings data={data} currency={currency} />}
          </div>
        </div>
      )}
    </motion.div>
  )
}
