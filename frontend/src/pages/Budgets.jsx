import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import toast from 'react-hot-toast'
import { X, Check, Pencil } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Panel from '../components/ui/Panel'
import Button from '../components/ui/Button'
import RollingNumber from '../components/ui/RollingNumber'
import { CategoryIcon, Badge } from '../components/ui/Pill'
import { ProgressBar } from '../components/ui/Progress'
import ShakeWhen from '../components/ui/ShakeWhen'
import { Tooltip } from '../components/ui/Controls'
import { Skeleton } from '../components/ui/Skeleton'
import { ErrorState } from '../components/ui/States'
import apiClient, { errorMessage } from '../api/apiClient'
import { useBudgets, useFinanceMutation, useSummary } from '../api/queries'
import { useCurrency } from '../context/AuthContext'
import { CATEGORIES, categoryColor } from '../lib/categories'
import { currencySymbol, formatMoney } from '../lib/format'
import { usePageEntrance } from '../lib/entrance'
import { dur, ease, staggerItem } from '../lib/motion'

function daysLeftInMonth(now = new Date()) {
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  return { left: last - now.getDate() + 1, elapsed: now.getDate() / last }
}

function LimitEditor({ initial, currency, onSave, onCancel, saving }) {
  const [value, setValue] = useState(initial ? String(initial) : '')
  const ref = useRef(null)
  useEffect(() => { ref.current?.focus(); ref.current?.select() }, [])
  const submit = (e) => {
    e.preventDefault()
    const n = Number(value)
    if (!Number.isFinite(n) || n <= 0) return toast.error('Enter a limit above 0')
    onSave(n)
  }
  return (
    <form onSubmit={submit} className="flex items-center gap-1.5" onKeyDown={(e) => e.key === 'Escape' && onCancel()}>
      <div className="relative">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted">{currencySymbol(currency).trim()}</span>
        <input
          ref={ref}
          type="number"
          inputMode="decimal"
          min="0"
          step="1"
          aria-label="Monthly limit"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="num h-8 w-28 rounded-control border border-accent/60 bg-canvas pl-6 pr-2 text-sm outline-none ring-2 ring-accent/20"
        />
      </div>
      <Button type="submit" variant="primary" size="icon" aria-label="Save limit" loading={saving}>{!saving && <Check size={14} />}</Button>
      <Button size="icon" variant="ghost" aria-label="Cancel" onClick={onCancel}><X size={14} /></Button>
    </form>
  )
}

function BudgetRow({ category, budget, spent, currency, elapsed }) {
  const [editing, setEditing] = useState(false)
  const save = useFinanceMutation(({ limit }) => apiClient.put(`/api/budgets/${category.id}`, { monthly_limit: limit }))
  const remove = useFinanceMutation(() => apiClient.delete(`/api/budgets/${category.id}`))

  const onSave = (limit) => save.mutate({ limit }, {
    onSuccess: () => { setEditing(false); toast.success(`${category.id} limit set to ${formatMoney(limit, currency)}`) },
    onError: (err) => toast.error(errorMessage(err)),
  })

  const status = budget?.status
  const tone = status === 'over' ? 'rgb(var(--danger))' : status === 'near' ? 'rgb(var(--warning))' : categoryColor(category.id)

  return (
    <motion.li layout="position" transition={{ duration: dur.base, ease }} className="px-4 py-4">
      <div className="flex items-center gap-3">
        <CategoryIcon id={category.id} size={34} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm text-fg">{category.id}</span>
            {status === 'over' && <Badge tone="danger">Over by {formatMoney(-budget.remaining, currency)}</Badge>}
            {status === 'near' && <Badge tone="warning">{formatMoney(budget.remaining, currency)} left</Badge>}
            {status === 'ok' && budget.projected > budget.monthly_limit && <Badge tone="warning">On pace to go over</Badge>}
          </div>
          <p className="text-xs text-muted mt-0.5">
            <span className="num text-fg">{formatMoney(spent, currency)}</span> spent this month
            {budget && <> of <span className="num">{formatMoney(budget.monthly_limit, currency)}</span></>}
          </p>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          {editing ? (
            <motion.div key="edit" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ duration: dur.fast }}>
              <LimitEditor initial={budget?.monthly_limit} currency={currency} onSave={onSave} onCancel={() => setEditing(false)} saving={save.isPending} />
            </motion.div>
          ) : budget ? (
            <motion.div key="view" className="flex items-center gap-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: dur.fast }}>
              <Tooltip content="Edit limit"><Button size="icon" variant="ghost" aria-label={`Edit ${category.id} limit`} onClick={() => setEditing(true)}><Pencil size={14} /></Button></Tooltip>
              <Tooltip content="Remove budget">
                <Button size="icon" variant="ghost" aria-label={`Remove ${category.id} budget`} loading={remove.isPending}
                  onClick={() => remove.mutate(null, { onSuccess: () => toast.success(`${category.id} budget removed`) })}>
                  {!remove.isPending && <X size={14} />}
                </Button>
              </Tooltip>
            </motion.div>
          ) : (
            <motion.div key="add" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: dur.fast }}>
              <Button size="sm" onClick={() => setEditing(true)}>Set limit</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {budget && (
        <div className="mt-3 pl-[46px]">
          <ShakeWhen active={status === 'over'}>
            <ProgressBar value={budget.pct} color={tone} marker={elapsed} label={`${category.id} budget used`} />
          </ShakeWhen>
          <div className="flex justify-between text-2xs text-muted mt-1.5">
            <span className="num">{Math.round(budget.pct * 100)}% used</span>
            <span>Month-end at this pace <span className="num text-fg">{formatMoney(budget.projected, currency)}</span></span>
          </div>
        </div>
      )}
    </motion.li>
  )
}

export default function Budgets() {
  const currency = useCurrency()
  const entrance = usePageEntrance()
  const budgets = useBudgets()
  const summary = useSummary()
  const { left, elapsed } = daysLeftInMonth()

  const byCat = Object.fromEntries((budgets.data?.budgets || []).map((b) => [b.category, b]))
  const spentByCat = Object.fromEntries((summary.data?.by_category || []).map((c) => [c.category, c.total]))
  const rows = CATEGORIES
    .map((c) => ({ category: c, budget: byCat[c.id], spent: byCat[c.id]?.spent ?? spentByCat[c.id] ?? 0 }))
    .sort((a, b) => (b.budget ? 1 : 0) - (a.budget ? 1 : 0) || (b.budget?.pct || 0) - (a.budget?.pct || 0) || b.spent - a.spent)

  const totalLimit = budgets.data?.total_limit || 0
  const totalSpent = budgets.data?.total_spent || 0
  const remaining = totalLimit - totalSpent
  const perDay = remaining > 0 ? remaining / left : 0

  return (
    <motion.div {...entrance}>
      <PageHeader context="Monthly limits by category" title="Budgets" />

      {budgets.isError && !budgets.data ? <Panel><ErrorState error={budgets.error} onRetry={() => budgets.refetch()} /></Panel> : budgets.isPending || summary.isPending ? (
        <Skeleton className="h-[480px]" />
      ) : (
        <>
          {totalLimit > 0 && (
            <motion.div variants={staggerItem} data-glow className="grid sm:grid-cols-3 rounded-panel border border-line bg-panel divide-y sm:divide-y-0 sm:divide-x divide-line mb-4">
              <div className="p-5 md:p-6">
                <p className="text-sm text-muted">{remaining >= 0 ? 'Left across budgets' : 'Over across budgets'}</p>
                <p className={`serif text-[48px] leading-none mt-2 ${remaining < 0 ? 'text-danger' : ''}`}>
                  <RollingNumber value={formatMoney(Math.abs(remaining), currency, { decimals: 0 })} />
                </p>
                <div className="mt-3"><ProgressBar value={totalSpent / totalLimit} marker={elapsed} label="All budgets used" height={4}
                  color={remaining < 0 ? 'rgb(var(--danger))' : 'rgb(var(--accent))'} /></div>
              </div>
              <div className="p-5 md:p-6">
                <p className="text-sm text-muted">Safe to spend per day</p>
                <p className="serif text-[48px] leading-none mt-2"><RollingNumber value={formatMoney(perDay, currency, { decimals: 0 })} /></p>
                <p className="text-xs text-muted mt-3">for the next <span className="num text-fg">{left}</span> {left === 1 ? 'day' : 'days'} in budgeted categories</p>
              </div>
              <div className="p-5 md:p-6">
                <p className="text-sm text-muted">Budgeted this month</p>
                <p className="serif text-[48px] leading-none mt-2 text-muted">{formatMoney(totalLimit, currency)}</p>
                <p className="text-xs text-muted mt-3"><span className="num text-fg">{Object.keys(byCat).length}</span> of {CATEGORIES.length} categories have a limit</p>
              </div>
            </motion.div>
          )}

          <Panel flush title={totalLimit ? 'Categories' : 'Pick a category to limit'} action={<span className="text-xs text-muted">The tick marks today in the month</span>}>
            <ul className="divide-y divide-line">
              {rows.map((r) => <BudgetRow key={r.category.id} {...r} currency={currency} elapsed={elapsed} />)}
            </ul>
          </Panel>
        </>
      )}
    </motion.div>
  )
}
