import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Plus, Pencil, ChevronDown, Trash2, Target, CalendarClock } from 'lucide-react'
import Panel from '../../components/ui/Panel'
import Button from '../../components/ui/Button'
import RollingNumber from '../../components/ui/RollingNumber'
import { Ring } from '../../components/ui/Progress'
import { Badge } from '../../components/ui/Pill'
import { Tooltip } from '../../components/ui/Controls'
import { EmptyState } from '../../components/ui/States'
import apiClient, { errorMessage } from '../../api/apiClient'
import { useFinanceMutation } from '../../api/queries'
import { GOAL_COLORS } from '../../lib/categories'
import { formatMoney, formatShortDate, parseISODate } from '../../lib/format'
import { useSheets } from '../../lib/sheets'
import { dur, ease, staggerItem } from '../../lib/motion'

function History({ goal, currency }) {
  const remove = useFinanceMutation((id) => apiClient.delete(`/api/goals/${goal.id}/contributions/${id}`))
  if (!goal.contributions.length) return <p className="text-xs text-muted py-2">No money added yet.</p>
  return (
    <ul className="divide-y divide-line">
      {goal.contributions.map((c) => (
        <li key={c.id} className="group flex items-center gap-3 py-2 text-sm">
          <span className="text-muted w-16 text-xs">{formatShortDate(c.date)}</span>
          <span className="flex-1 truncate text-muted">{c.note}</span>
          <span className="num">+{formatMoney(c.amount, currency)}</span>
          <Tooltip content="Remove this entry">
            <button type="button" aria-label={`Remove ${formatMoney(c.amount, currency)} from ${formatShortDate(c.date)}`}
              onClick={() => remove.mutate(c.id, { onSuccess: () => toast.success('Entry removed'), onError: (e) => toast.error(errorMessage(e)) })}
              className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 text-muted hover:text-danger transition-opacity">
              <Trash2 size={13} />
            </button>
          </Tooltip>
        </li>
      ))}
    </ul>
  )
}

function GoalCard({ goal, currency }) {
  const { openSheet } = useSheets()
  const [open, setOpen] = useState(false)
  const color = GOAL_COLORS[goal.color] || GOAL_COLORS.accent
  return (
    <motion.article layout="position" variants={staggerItem} className="rounded-panel border border-line bg-panel p-5 flex flex-col">
      <div className="flex items-start gap-4">
        <Ring value={goal.pct} size={76} stroke={7} color={color} label={`${Math.round(goal.pct * 100)}% funded`}>
          <span className="num text-sm">{Math.round(goal.pct * 100)}%</span>
        </Ring>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base text-fg truncate">{goal.name}</h3>
            <Tooltip content="Edit goal">
              <Button size="icon-sm" variant="ghost" aria-label={`Edit ${goal.name}`} onClick={() => openSheet('goal', goal)}><Pencil size={13} /></Button>
            </Tooltip>
          </div>
          <p className="mt-1 flex items-baseline gap-1.5 flex-wrap">
            <span className="serif text-[30px] leading-none"><RollingNumber value={formatMoney(goal.saved, currency, { decimals: 0 })} /></span>
            <span className="text-sm text-muted">of {formatMoney(goal.target_amount, currency)}</span>
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted">
        {goal.is_complete ? <Badge tone="success">Fully funded</Badge> : goal.overdue ? <Badge tone="danger">Past target date</Badge> : null}
        {goal.target_date && !goal.is_complete && (
          <span className="inline-flex items-center gap-1"><CalendarClock size={12} aria-hidden="true" />
            By {parseISODate(goal.target_date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
          </span>
        )}
        {goal.monthly_needed && !goal.is_complete && (
          <span><span className="num text-fg">{formatMoney(goal.monthly_needed, currency)}</span> a month to get there</span>
        )}
        {!goal.target_date && !goal.is_complete && <span><span className="num text-fg">{formatMoney(goal.remaining, currency)}</span> to go</span>}
      </div>

      <div className="mt-4 flex items-center gap-2">
        {!goal.is_complete && (
          <Button size="sm" variant="primary" onClick={() => openSheet('contribution', goal)}><Plus size={13} strokeWidth={2.4} aria-hidden="true" /> Add money</Button>
        )}
        <Button size="sm" variant="ghost" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          History
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: dur.base }}><ChevronDown size={13} /></motion.span>
        </Button>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: dur.base, ease }} className="overflow-hidden">
            <div className="mt-3 border-t border-line pt-1"><History goal={goal} currency={currency} /></div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  )
}

export default function GoalsTab({ data, currency }) {
  const { openSheet } = useSheets()
  const goals = data.goals
  if (!goals.length) {
    return (
      <Panel>
        <EmptyState icon={Target} title="Save toward something"
          body="An emergency fund, a laptop, a trip. Set a target and a date and FlowPilot works out the monthly amount."
          action={<Button variant="primary" onClick={() => openSheet('goal')}><Plus size={14} aria-hidden="true" /> New goal</Button>} />
      </Panel>
    )
  }
  const pct = data.total_target ? data.total_saved / data.total_target : 0
  return (
    <>
      <motion.div variants={staggerItem} className="flex flex-wrap items-end justify-between gap-4 rounded-panel border border-line bg-panel p-5 md:p-6 mb-4">
        <div>
          <p className="text-sm text-muted">Saved across goals</p>
          <p className="serif text-[52px] leading-none mt-2"><RollingNumber value={formatMoney(data.total_saved, currency, { decimals: 0 })} /></p>
        </div>
        <div className="flex-1 min-w-[220px] max-w-md">
          <div className="flex justify-between text-xs text-muted mb-2">
            <span><span className="num text-fg">{Math.round(pct * 100)}%</span> of {formatMoney(data.total_target, currency)}</span>
            <span>{goals.filter((g) => g.is_complete).length} of {goals.length} funded</span>
          </div>
          <div className="flex h-2.5 gap-[2px] rounded-full overflow-hidden bg-fg/[0.07]">
            {goals.map((g) => (
              <motion.span key={g.id} style={{ backgroundColor: GOAL_COLORS[g.color] || GOAL_COLORS.accent }}
                initial={{ width: 0 }} animate={{ width: `${(g.saved / data.total_target) * 100}%` }}
                transition={{ type: 'spring', stiffness: 140, damping: 22 }} />
            ))}
          </div>
        </div>
      </motion.div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {goals.map((g) => <GoalCard key={g.id} goal={g} currency={currency} />)}
        <motion.button variants={staggerItem} type="button" onClick={() => openSheet('goal')}
          className="min-h-[200px] rounded-panel border border-dashed border-line-strong text-muted hover:text-fg hover:border-accent/50 hover:bg-accent/[0.03] transition-colors flex flex-col items-center justify-center gap-2">
          <Plus size={18} aria-hidden="true" />
          <span className="text-sm">New goal</span>
        </motion.button>
      </div>
    </>
  )
}
