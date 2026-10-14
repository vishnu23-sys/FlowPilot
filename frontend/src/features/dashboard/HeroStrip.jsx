import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import RollingNumber from '../../components/ui/RollingNumber'
import { Skeleton } from '../../components/ui/Skeleton'
import { ProgressBar } from '../../components/ui/Progress'
import { formatMoney, formatPercent } from '../../lib/format'
import { staggerItem } from '../../lib/motion'
import { useSheets } from '../../lib/sheets'

function Figure({ label, children, foot, to }) {
  const inner = (
    <>
      <p className="text-sm text-muted">{label}</p>
      <div className="mt-2 serif text-[44px] md:text-[52px] text-fg leading-none">{children}</div>
      <div className="mt-3 min-h-[20px] text-xs text-muted">{foot}</div>
    </>
  )
  return to ? (
    <Link to={to} className="block p-5 md:p-6 hover:bg-fg/[0.025] transition-colors outline-none focus-visible:bg-fg/[0.04]">
      {inner}
    </Link>
  ) : (
    <div className="p-5 md:p-6">{inner}</div>
  )
}

function Delta({ current, previous }) {
  if (!previous) return <span>No spending logged last month</span>
  const pct = ((current - previous) / previous) * 100
  const up = pct > 0
  const Icon = up ? ArrowUpRight : ArrowDownRight
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`inline-flex items-center gap-0.5 num ${up ? 'text-danger' : 'text-success'}`}>
        <Icon size={13} aria-hidden="true" />{formatPercent(Math.abs(pct))}
      </span>
      {up ? 'more' : 'less'} than this point last month
    </span>
  )
}

/** The dashboard's one bold moment: three serif figures in a single ruled strip. */
export default function HeroStrip({ summary, income, health, currency, loading }) {
  const { openSheet } = useSheets()
  if (loading) {
    return (
      <div className="grid sm:grid-cols-3 gap-px rounded-panel border border-line bg-line overflow-hidden mb-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-panel p-6 space-y-3"><Skeleton className="h-3 w-24" /><Skeleton className="h-11 w-40" /><Skeleton className="h-3 w-32" /></div>
        ))}
      </div>
    )
  }

  const spent = summary?.monthly_total || 0
  const prevAtSameDay = summary?.previous_daily?.[Math.min(new Date().getDate(), summary.previous_daily.length) - 1]?.total || 0
  const left = income != null ? income - spent : null

  return (
    <motion.div variants={staggerItem} className="grid sm:grid-cols-3 rounded-panel border border-line bg-panel overflow-hidden mb-4 divide-y sm:divide-y-0 sm:divide-x divide-line">
      <Figure label="Spent this month" to="/analytics" foot={<Delta current={spent} previous={prevAtSameDay} />}>
        <RollingNumber value={formatMoney(spent, currency, { decimals: 0 })} />
      </Figure>

      {left != null ? (
        <Figure
          label={left >= 0 ? 'Left to spend' : 'Over income by'}
          to="/income"
          foot={
            <div className="space-y-2">
              <ProgressBar value={income ? spent / income : 0} color={left >= 0 ? 'rgb(var(--accent))' : 'rgb(var(--danger))'} label="Share of income spent" height={4} />
              <span>of {formatMoney(income, currency)} income this month</span>
            </div>
          }
        >
          <span className={left < 0 ? 'text-danger' : ''}>
            <RollingNumber value={formatMoney(Math.abs(left), currency, { decimals: 0 })} />
          </span>
        </Figure>
      ) : (
        <div className="p-5 md:p-6">
          <p className="text-sm text-muted">Left to spend</p>
          <p className="mt-2 text-sm text-fg max-w-[240px]">Add your income to see what's left this month.</p>
          <button type="button" onClick={() => openSheet('income')} className="mt-3 text-sm text-accent hover:underline underline-offset-4">
            Log income
          </button>
        </div>
      )}

      <Figure label="Financial health" to="/analytics" foot={health ? <span>{health.label}</span> : null}>
        {health ? (
          <span className="inline-flex items-baseline gap-1">
            <span className="text-accent"><RollingNumber value={String(health.score)} /></span>
            <span className="font-sans text-base text-muted">/ 100</span>
          </span>
        ) : <span className="text-muted">—</span>}
      </Figure>
    </motion.div>
  )
}
