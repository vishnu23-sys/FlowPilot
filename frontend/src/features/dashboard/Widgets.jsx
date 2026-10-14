import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Banknote, Target, Repeat, ChevronLeft, ChevronRight, Lightbulb, PiggyBank, Receipt, CheckCircle2 } from 'lucide-react'
import Panel from '../../components/ui/Panel'
import { ProgressBar, Gauge } from '../../components/ui/Progress'
import { EmptyState } from '../../components/ui/States'
import { Skeleton, RowsSkeleton } from '../../components/ui/Skeleton'
import { AttentionList } from '../../components/shell/Topbar'
import ExpenseRow from '../expenses/ExpenseRow'
import { categoryColor } from '../../lib/categories'
import { formatDayLabel, formatMoney, formatPercent } from '../../lib/format'
import { spring, staggerItem, tabContentVariants } from '../../lib/motion'
import { useSheets } from '../../lib/sheets'

export function QuickActions() {
  const { openSheet } = useSheets()
  const navigate = useNavigate()
  const actions = [
    { label: 'New expense', icon: Plus, run: () => openSheet('expense'), hint: 'N' },
    { label: 'Log income', icon: Banknote, run: () => openSheet('income') },
    { label: 'Add to a goal', icon: Target, run: () => navigate('/goals') },
    { label: 'New subscription', icon: Repeat, run: () => openSheet('subscription') },
  ]
  return (
    <motion.div variants={staggerItem} className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
      {actions.map(({ label, icon: Icon, run, hint }) => (
        <button
          key={label}
          type="button"
          onClick={run}
          className="group flex items-center gap-3 rounded-[10px] border border-dashed border-line-strong px-3 py-2.5 text-sm text-muted
            hover:border-solid hover:border-accent/50 hover:text-fg hover:bg-accent/[0.04] transition-colors text-left"
        >
          <span className="grid h-7 w-7 place-items-center rounded-md bg-fg/[0.06] text-fg group-hover:bg-accent group-hover:text-on-accent transition-colors">
            <Icon size={14} strokeWidth={2} aria-hidden="true" />
          </span>
          <span className="flex-1">{label}</span>
          {hint && <span className="hidden lg:inline text-2xs font-mono text-faint">{hint}</span>}
        </button>
      ))}
    </motion.div>
  )
}

export function AttentionPanel({ query }) {
  const navigate = useNavigate()
  return (
    <Panel title="Needs attention" flush action={query.data?.count ? <span className="num text-xs text-muted">{query.data.count}</span> : null}>
      {query.isPending ? <RowsSkeleton rows={4} /> : (
        <div className="max-h-[262px] overflow-y-auto">
          {query.data?.items?.length ? (
            <AttentionList items={query.data.items.slice(0, 6)} onPick={(item) => navigate(item.link)} />
          ) : (
            <EmptyState compact icon={CheckCircle2} title="Nothing needs you" body="Over-budget categories, renewals and debts show up here." />
          )}
        </div>
      )}
    </Panel>
  )
}

export function RecentPanel({ summary, currency, loading }) {
  const { openSheet } = useSheets()
  const rows = summary?.recent_transactions || []
  return (
    <Panel
      className="lg:col-span-2"
      title="Recent"
      flush
      action={<Link to="/expenses" className="text-xs text-muted hover:text-fg transition-colors">All expenses</Link>}
    >
      {loading ? <RowsSkeleton rows={5} /> : rows.length ? (
        <div className="divide-y divide-line pb-1">
          {rows.map((e) => <ExpenseRow key={e.id} expense={e} currency={currency} meta={formatDayLabel(e.date)} compact />)}
        </div>
      ) : (
        <EmptyState compact icon={Receipt} title="Log your first expense" body="Everything you add shows up here and in your charts."
          action={<button type="button" onClick={() => openSheet('expense')} className="text-sm text-accent hover:underline underline-offset-4">New expense</button>} />
      )}
    </Panel>
  )
}

/** One stacked bar for the month's split, then a ranked list. */
export function CategoryBreakdown({ summary, currency, loading }) {
  const cats = summary?.by_category || []
  const total = cats.reduce((s, c) => s + c.total, 0)
  return (
    <Panel title="Where it went">
      {loading ? <Skeleton className="h-40" /> : !cats.length ? (
        <p className="text-sm text-muted py-6">Your category split appears after the first expense this month.</p>
      ) : (
        <>
          <div className="flex h-2.5 w-full gap-[2px] overflow-hidden rounded-full" role="img" aria-label="Spending split by category">
            {cats.map((c, i) => (
              <motion.span
                key={c.category}
                className="h-full first:rounded-l-full last:rounded-r-full"
                style={{ backgroundColor: categoryColor(c.category) }}
                initial={{ flexGrow: 0 }}
                animate={{ flexGrow: c.total }}
                transition={{ ...spring.bar, delay: i * 0.03 }}
              />
            ))}
          </div>
          <ul className="mt-4 space-y-2.5">
            {cats.slice(0, 6).map((c) => (
              <li key={c.category} className="flex items-center gap-2.5 text-sm">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: categoryColor(c.category) }} aria-hidden="true" />
                <span className="flex-1 text-fg">{c.category}</span>
                <span className="num text-xs text-muted w-10 text-right">{formatPercent((c.total / total) * 100)}</span>
                <span className="num text-sm w-24 text-right">{formatMoney(c.total, currency)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Panel>
  )
}

export function BudgetsPanel({ query, currency }) {
  const items = query.data?.budgets || []
  return (
    <Panel title="Budgets" action={<Link to="/budgets" className="text-xs text-muted hover:text-fg transition-colors">Manage</Link>}>
      {query.isPending ? <Skeleton className="h-40" /> : !items.length ? (
        <EmptyState compact icon={PiggyBank} title="Set a monthly limit" body="Budgets warn you before a category runs over."
          action={<Link to="/budgets" className="text-sm text-accent hover:underline underline-offset-4">Create a budget</Link>} />
      ) : (
        <ul className="space-y-4 pt-1">
          {items.slice(0, 4).map((b) => {
            const tone = b.status === 'over' ? 'rgb(var(--danger))' : b.status === 'near' ? 'rgb(var(--warning))' : categoryColor(b.category)
            return (
              <li key={b.category}>
                <div className="flex items-baseline justify-between text-sm mb-1.5">
                  <span className="text-fg">{b.category}</span>
                  <span className="num text-xs">
                    <span className={b.status === 'over' ? 'text-danger' : 'text-fg'}>{formatMoney(b.spent, currency)}</span>
                    <span className="text-muted"> / {formatMoney(b.monthly_limit, currency)}</span>
                  </span>
                </div>
                <ProgressBar value={b.pct} color={tone} label={`${b.category} budget used`} marker={monthElapsed()} />
              </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}

export function HealthPanel({ query }) {
  const h = query.data
  return (
    <Panel title="Health score">
      {query.isPending ? <Skeleton className="h-52" /> : !h ? null : (
        <>
          <div className="relative flex flex-col items-center">
            <Gauge value={h.score} />
            <div className="absolute bottom-0 text-center">
              <p className="serif text-[40px] leading-none">{h.score}</p>
              <p className="text-xs text-muted mt-1">{h.label}</p>
            </div>
          </div>
          <ul className="mt-5 space-y-2.5">
            {h.components.map((c) => (
              <li key={c.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted">{c.label}</span>
                  <span className="num text-fg">{c.score}<span className="text-faint">/{c.max}</span></span>
                </div>
                <ProgressBar value={c.score / c.max} height={4} label={c.label} />
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-fg leading-relaxed border-t border-line pt-3">{h.recommendations[0]}</p>
        </>
      )}
    </Panel>
  )
}

function monthElapsed(now = new Date()) {
  return now.getDate() / new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
}

const INSIGHT_TONE = { positive: 'text-success', warning: 'text-warning', neutral: 'text-muted' }

/** One insight at a time; arrows slide in the direction of travel. */
export function InsightsPanel({ query }) {
  const [state, setState] = useState({ index: 0, dir: 1 })
  const items = query.data || []
  const go = (step) => setState((s) => ({ index: (s.index + step + items.length) % items.length, dir: step }))
  const current = items[state.index % Math.max(items.length, 1)]

  return (
    <Panel
      title={<h2 className="flex items-center gap-2 text-sm text-muted"><Lightbulb size={14} aria-hidden="true" /> Insights</h2>}
      action={items.length > 1 && (
        <div className="flex items-center gap-1">
          <span className="num text-xs text-muted mr-1">{state.index + 1}/{items.length}</span>
          <button type="button" onClick={() => go(-1)} aria-label="Previous insight" className="grid h-7 w-7 place-items-center rounded-md text-muted hover:text-fg hover:bg-fg/[0.06]"><ChevronLeft size={15} /></button>
          <button type="button" onClick={() => go(1)} aria-label="Next insight" className="grid h-7 w-7 place-items-center rounded-md text-muted hover:text-fg hover:bg-fg/[0.06]"><ChevronRight size={15} /></button>
        </div>
      )}
    >
      {query.isPending ? <Skeleton className="h-32" /> : current ? (
        <div className="relative min-h-[150px] overflow-hidden" aria-live="polite">
          <AnimatePresence mode="popLayout" custom={state.dir} initial={false}>
            <motion.div key={state.index} custom={state.dir} variants={tabContentVariants} initial="initial" animate="animate" exit="exit">
              <p className={`text-xs mb-3 ${INSIGHT_TONE[current.type]}`}>
                {current.type === 'warning' ? 'Worth a look' : current.type === 'positive' ? 'Going well' : 'Pattern'}
              </p>
              <p className="serif text-[26px] leading-[1.2] text-fg">{current.text}</p>
            </motion.div>
          </AnimatePresence>
          <div className="absolute bottom-0 left-0 flex gap-1.5" aria-hidden="true">
            {items.map((_, i) => (
              <span key={i} className={`h-1 rounded-full transition-all duration-300 ${i === state.index ? 'w-5 bg-accent' : 'w-1.5 bg-fg/15'}`} />
            ))}
          </div>
        </div>
      ) : null}
    </Panel>
  )
}
