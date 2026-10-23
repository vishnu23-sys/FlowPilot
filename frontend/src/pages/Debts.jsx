import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import toast from 'react-hot-toast'
import { Plus, ChevronDown, HandCoins, CheckCircle2 } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Panel from '../components/ui/Panel'
import Button from '../components/ui/Button'
import Segmented, { directionOf } from '../components/ui/Segmented'
import RollingNumber from '../components/ui/RollingNumber'
import { Checkbox } from '../components/ui/Controls'
import { Skeleton } from '../components/ui/Skeleton'
import { EmptyState, QueryView } from '../components/ui/States'
import apiClient, { errorMessage } from '../api/apiClient'
import { useDebts, useFinanceMutation } from '../api/queries'
import { useCurrency } from '../context/AuthContext'
import { formatMoney, formatShortDate, initials } from '../lib/format'
import { usePageEntrance } from '../lib/entrance'
import { useSheets } from '../lib/sheets'
import { dur, ease, staggerItem, tabContentVariants } from '../lib/motion'

function DebtLine({ debt, currency }) {
  const { openSheet } = useSheets()
  const settle = useFinanceMutation((is_settled) => apiClient.put(`/api/debts/${debt.id}`, { is_settled }))
  const [optimistic, setOptimistic] = useState(null)
  const settled = optimistic ?? debt.is_settled

  const onToggle = (value) => {
    setOptimistic(value)
    settle.mutate(value, {
      onSuccess: () => toast.success(value ? `Settled with ${debt.person_name}` : 'Marked as unsettled'),
      onError: (err) => { setOptimistic(null); toast.error(errorMessage(err)) },
      onSettled: () => setTimeout(() => setOptimistic(null), 400),
    })
  }

  return (
    <div className="flex items-center gap-3 py-2.5">
      <Checkbox checked={settled} onCheckedChange={(v) => onToggle(Boolean(v))} label={`Mark ${debt.description || 'debt'} as settled`} />
      <button type="button" onClick={() => openSheet('debt', debt)} className="flex flex-1 min-w-0 items-center gap-3 text-left">
        <span className="flex-1 min-w-0 text-sm">
          <span className={`relative inline-block transition-colors duration-300 ${settled ? 'text-muted' : 'text-fg'}`}>
            {debt.description || 'No note'}
            <motion.span
              aria-hidden="true"
              className="absolute inset-x-0 top-1/2 h-px bg-muted origin-left"
              initial={false}
              animate={{ scaleX: settled ? 1 : 0 }}
              transition={{ duration: dur.slow, ease }}
            />
          </span>
          <span className="block text-xs text-faint mt-0.5">{formatShortDate(debt.created_at.slice(0, 10))}</span>
        </span>
        <span className={`inline-flex items-center gap-1.5 num text-sm transition-colors duration-300 ${settled ? 'text-success' : 'text-fg'}`}>
          <AnimatePresence initial={false}>
            {settled && (
              <motion.span
                key="tick"
                initial={{ scale: 0, rotate: -30, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 520, damping: 18, delay: 0.25 }}
                className="grid place-items-center"
              >
                <CheckCircle2 size={14} aria-label="Settled" />
              </motion.span>
            )}
          </AnimatePresence>
          {formatMoney(debt.amount, currency)}
        </span>
      </button>
    </div>
  )
}

function PersonCard({ person, debts, currency }) {
  const total = debts.filter((d) => !d.is_settled).reduce((s, d) => s + d.amount, 0)
  return (
    <motion.div layout="position" variants={staggerItem} data-glow className="rounded-panel border border-line bg-panel p-4">
      <div className="flex items-center gap-3 pb-2 border-b border-line">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-fg/[0.07] text-xs font-semibold">{initials(person)}</span>
        <span className="flex-1 text-sm text-fg">{person}</span>
        <span className="serif text-[24px] leading-none">{formatMoney(total, currency)}</span>
      </div>
      <div className="divide-y divide-line">
        {debts.map((d) => <DebtLine key={d.id} debt={d} currency={currency} />)}
      </div>
    </motion.div>
  )
}

function groupByPerson(debts) {
  const map = new Map()
  for (const d of debts) {
    const key = d.person_name.trim()
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(d)
  }
  return [...map.entries()].sort((a, b) => b[1].reduce((s, d) => s + d.amount, 0) - a[1].reduce((s, d) => s + d.amount, 0))
}

const TABS = [{ value: 'owed_to_me', label: 'They owe me' }, { value: 'i_owe', label: 'I owe' }]

export default function Debts() {
  const currency = useCurrency()
  const entrance = usePageEntrance()
  const { openSheet } = useSheets()
  const query = useDebts()
  const [tab, setTab] = useState({ value: 'owed_to_me', dir: 1 })
  const [showSettled, setShowSettled] = useState(false)

  const data = query.data || []
  const open = data.filter((d) => !d.is_settled)
  const owed = open.filter((d) => d.type === 'owed_to_me').reduce((s, d) => s + d.amount, 0)
  const owe = open.filter((d) => d.type === 'i_owe').reduce((s, d) => s + d.amount, 0)
  const net = owed - owe

  const people = useMemo(() => groupByPerson(open.filter((d) => d.type === tab.value)), [open, tab.value])
  const settled = data.filter((d) => d.is_settled && d.type === tab.value)
  const options = TABS.map((t) => ({ ...t, count: open.filter((d) => d.type === t.value).length }))

  return (
    <motion.div {...entrance}>
      <PageHeader
        context="Money between you and friends"
        title="Debts"
        actions={<Button variant="primary" onClick={() => openSheet('debt', { type: tab.value })}><Plus size={14} strokeWidth={2.4} aria-hidden="true" /> Record a debt</Button>}
      />
      <QueryView query={query} loading={<Skeleton className="h-[420px]" />}>
        {() => !data.length ? (
          <Panel>
            <EmptyState icon={HandCoins} title="Keep track of who owes what"
              body="Split a dinner, lend for a cab, borrow for tickets. Settle each one when the money moves."
              action={<Button variant="primary" onClick={() => openSheet('debt')}><Plus size={14} aria-hidden="true" /> Record a debt</Button>} />
          </Panel>
        ) : (
          <>
            <motion.div variants={staggerItem} data-glow className="grid sm:grid-cols-3 rounded-panel border border-line bg-panel divide-y sm:divide-y-0 sm:divide-x divide-line mb-6">
              <div className="p-5 md:p-6">
                <p className="text-sm text-muted">{net >= 0 ? "You're owed, net" : 'You owe, net'}</p>
                <p className={`serif text-[48px] leading-none mt-2 ${net >= 0 ? 'text-success' : 'text-danger'}`}>
                  <RollingNumber value={formatMoney(Math.abs(net), currency, { decimals: 0 })} />
                </p>
              </div>
              <div className="p-5 md:p-6">
                <p className="text-sm text-muted">Others owe you</p>
                <p className="serif text-[48px] leading-none mt-2"><RollingNumber value={formatMoney(owed, currency, { decimals: 0 })} /></p>
              </div>
              <div className="p-5 md:p-6">
                <p className="text-sm text-muted">You owe others</p>
                <p className="serif text-[48px] leading-none mt-2"><RollingNumber value={formatMoney(owe, currency, { decimals: 0 })} /></p>
              </div>
            </motion.div>

            <div className="mb-4">
              <Segmented label="Direction" options={options} value={tab.value}
                onChange={(value) => setTab((t) => ({ value, dir: directionOf(TABS, t.value, value) }))} />
            </div>

            <div className="relative">
              <AnimatePresence mode="wait" custom={tab.dir} initial={false}>
                <motion.div key={tab.value} custom={tab.dir} variants={tabContentVariants} initial="initial" animate="animate" exit="exit">
                  {people.length ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {people.map(([person, list]) => <PersonCard key={person} person={person} debts={list} currency={currency} />)}
                    </div>
                  ) : (
                    <Panel><EmptyState compact icon={HandCoins} title={tab.value === 'i_owe' ? "You don't owe anyone" : 'Nobody owes you right now'} /></Panel>
                  )}

                  {settled.length > 0 && (
                    <div className="mt-6">
                      <button type="button" onClick={() => setShowSettled((s) => !s)} aria-expanded={showSettled}
                        className="flex items-center gap-2 text-sm text-muted hover:text-fg">
                        <motion.span animate={{ rotate: showSettled ? 0 : -90 }} transition={{ duration: dur.base }}><ChevronDown size={15} /></motion.span>
                        Settled <span className="num text-xs">{settled.length}</span>
                      </button>
                      <AnimatePresence initial={false}>
                        {showSettled && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: dur.base, ease }} className="overflow-hidden">
                            <div className="mt-3 rounded-panel border border-line bg-panel px-4 divide-y divide-line">
                              {settled.map((d) => (
                                <div key={d.id} className="flex items-center gap-3">
                                  <span className="text-xs text-muted w-24 truncate">{d.person_name}</span>
                                  <div className="flex-1"><DebtLine debt={d} currency={currency} /></div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </>
        )}
      </QueryView>
    </motion.div>
  )
}
