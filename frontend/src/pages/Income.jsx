import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { Plus, Banknote, Repeat } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Panel from '../components/ui/Panel'
import Button from '../components/ui/Button'
import RollingNumber from '../components/ui/RollingNumber'
import { SourceIcon } from '../components/ui/Pill'
import { Skeleton, RowsSkeleton } from '../components/ui/Skeleton'
import { EmptyState, QueryView } from '../components/ui/States'
import { axisProps, gridProps, makeTooltip, chartAnimation } from '../components/charts/chartTheme'
import { useAnalytics, useIncome, useIncomeSummary, useSummary } from '../api/queries'
import { useAuth, useCurrency } from '../context/AuthContext'
import { sourceColor } from '../lib/categories'
import { formatCompact, formatDayLabel, formatMoney, formatPercent, parseISODate } from '../lib/format'
import { usePageEntrance } from '../lib/entrance'
import { useSheets } from '../lib/sheets'
import { staggerItem } from '../lib/motion'

function Hero({ summary, spent, expected, currency, loading }) {
  if (loading) return <Skeleton className="h-36 mb-4" />
  const thisMonth = summary.monthly_total
  const income = thisMonth > 0 ? thisMonth : expected || 0
  const saved = income - spent
  const rate = income > 0 ? (saved / income) * 100 : null
  return (
    <motion.div variants={staggerItem} className="grid sm:grid-cols-3 rounded-panel border border-line bg-panel divide-y sm:divide-y-0 sm:divide-x divide-line mb-4">
      <div className="p-5 md:p-6">
        <p className="text-sm text-muted">Received this month</p>
        <p className="serif text-[48px] leading-none mt-2"><RollingNumber value={formatMoney(thisMonth, currency, { decimals: 0 })} /></p>
        <p className="text-xs text-muted mt-3">
          {summary.previous_month_total > 0 ? <>Last month <span className="num text-fg">{formatMoney(summary.previous_month_total, currency)}</span></> : 'Nothing logged last month'}
        </p>
      </div>
      <div className="p-5 md:p-6">
        <p className="text-sm text-muted">Kept so far</p>
        <p className={`serif text-[48px] leading-none mt-2 ${saved < 0 ? 'text-danger' : ''}`}>
          <RollingNumber value={formatMoney(saved, currency, { decimals: 0 })} />
        </p>
        <p className="text-xs text-muted mt-3">
          {rate != null ? <><span className="num text-fg">{formatPercent(rate)}</span> of income after <span className="num">{formatMoney(spent, currency)}</span> spent</> : 'Log income to see your savings rate'}
        </p>
      </div>
      <div className="p-5 md:p-6">
        <p className="text-sm text-muted">Expected each month</p>
        <p className="serif text-[48px] leading-none mt-2 text-muted">{expected ? formatMoney(expected, currency) : '—'}</p>
        <p className="text-xs text-muted mt-3">
          Used when a month has no logged income. <Link to="/settings" className="text-accent hover:underline underline-offset-2">Change</Link>
        </p>
      </div>
    </motion.div>
  )
}

function IncomeVsSpending({ income, spending, currency }) {
  const data = useMemo(() => (income?.monthly || []).map((m) => ({
    label: m.period.split(' ')[0],
    income: m.total,
    spending: spending?.trend?.find((t) => t.period === m.period)?.total ?? 0,
  })), [income, spending])
  const Tip = useMemo(() => makeTooltip({ format: (v) => formatMoney(v, currency), labels: { income: 'Income', spending: 'Spending' } }), [currency])
  return (
    <Panel className="lg:col-span-2" title="In and out, last 6 months">
      <div className="h-[240px] -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="label" {...axisProps} />
            <YAxis {...axisProps} width={52} tickFormatter={(v) => formatCompact(v, currency)} />
            <Tooltip content={<Tip />} cursor={{ fill: 'rgb(var(--fg) / 0.04)' }} />
            <Bar dataKey="income" fill="rgb(var(--accent))" radius={[4, 4, 0, 0]} maxBarSize={22} {...chartAnimation} />
            <Bar dataKey="spending" fill="rgb(var(--fg) / 0.22)" radius={[4, 4, 0, 0]} maxBarSize={22} {...chartAnimation} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-4 text-xs text-muted mt-2">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-accent" aria-hidden="true" />Income</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-fg/25" aria-hidden="true" />Spending</span>
      </div>
    </Panel>
  )
}

function Sources({ summary, currency }) {
  const items = summary?.by_source || []
  const total = items.reduce((s, i) => s + i.total, 0)
  return (
    <Panel title="Sources this month">
      {!items.length ? <p className="text-sm text-muted py-6">Sources appear once you log income this month.</p> : (
        <ul className="space-y-3 pt-1">
          {items.map((s) => (
            <li key={s.source} className="flex items-center gap-3">
              <SourceIcon id={s.source} size={30} />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-sm"><span>{s.source}</span><span className="num">{formatMoney(s.total, currency)}</span></div>
                <div className="mt-1.5 h-1 rounded-full bg-fg/[0.07] overflow-hidden">
                  <motion.div className="h-full rounded-full" style={{ backgroundColor: sourceColor(s.source) }}
                    initial={{ width: 0 }} animate={{ width: `${(s.total / total) * 100}%` }} transition={{ type: 'spring', stiffness: 140, damping: 22 }} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

function Entries({ entries, currency }) {
  const { openSheet } = useSheets()
  const months = useMemo(() => {
    const groups = []
    for (const e of entries) {
      const key = e.date.slice(0, 7)
      let g = groups.find((x) => x.key === key)
      if (!g) groups.push((g = { key, total: 0, items: [] }))
      g.items.push(e)
      g.total += e.amount
    }
    return groups
  }, [entries])

  return (
    <Panel flush className="lg:col-span-3" title="Entries">
      {months.map((m) => (
        <section key={m.key} aria-label={m.key}>
          <div className="flex justify-between border-y border-line bg-canvas/40 px-4 py-2 text-xs">
            <span>{parseISODate(`${m.key}-01`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</span>
            <span className="num text-muted">{formatMoney(m.total, currency)}</span>
          </div>
          <ul className="divide-y divide-line">
            {m.items.map((e) => (
              <li key={e.id}>
                <button type="button" onClick={() => openSheet('income', e)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-fg/[0.03] transition-colors">
                  <SourceIcon id={e.source} size={34} />
                  <span className="flex-1 min-w-0">
                    <span className="flex items-center gap-1.5 text-sm truncate">
                      {e.description || e.source}
                      {e.is_recurring && <Repeat size={11} className="text-faint" aria-label="Arrives every month" />}
                    </span>
                    <span className="block text-xs text-muted mt-0.5">{e.source}, {formatDayLabel(e.date)}</span>
                  </span>
                  <span className="num text-sm text-success">+{formatMoney(e.amount, currency)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </Panel>
  )
}

export default function Income() {
  const { user } = useAuth()
  const currency = useCurrency()
  const entrance = usePageEntrance()
  const { openSheet } = useSheets()
  const income = useIncome()
  const summary = useIncomeSummary()
  const spending = useAnalytics('monthly')
  const expenseSummary = useSummary()

  return (
    <motion.div {...entrance}>
      <PageHeader
        context="What came in"
        title="Income"
        actions={<Button variant="primary" onClick={() => openSheet('income')}><Plus size={14} strokeWidth={2.4} aria-hidden="true" /> Log income</Button>}
      />
      <Hero
        summary={summary.data}
        spent={expenseSummary.data?.monthly_total || 0}
        expected={user?.monthly_income}
        currency={currency}
        loading={summary.isPending || expenseSummary.isPending}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {summary.data && <IncomeVsSpending income={summary.data} spending={spending.data} currency={currency} />}
        {summary.data && <Sources summary={summary.data} currency={currency} />}
        <QueryView query={income} loading={<Panel flush className="lg:col-span-3"><RowsSkeleton /></Panel>}>
          {(entries) => entries.length ? <Entries entries={entries} currency={currency} /> : (
            <Panel className="lg:col-span-3">
              <EmptyState icon={Banknote} title="Log what you earn"
                body="Salary, freelance work, refunds. Logged income gives you real savings and health numbers."
                action={<Button variant="primary" onClick={() => openSheet('income')}><Plus size={14} aria-hidden="true" /> Log income</Button>} />
            </Panel>
          )}
        </QueryView>
      </div>
    </motion.div>
  )
}
