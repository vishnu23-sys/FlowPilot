import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import toast from 'react-hot-toast'
import { Plus, ChevronLeft, ChevronRight, Pencil, Pause, Play, X, Repeat, CalendarDays } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Panel from '../components/ui/Panel'
import Button from '../components/ui/Button'
import Segmented, { directionOf } from '../components/ui/Segmented'
import RollingNumber from '../components/ui/RollingNumber'
import { Monogram, Badge } from '../components/ui/Pill'
import { Ring } from '../components/ui/Progress'
import { Skeleton } from '../components/ui/Skeleton'
import { EmptyState, QueryView } from '../components/ui/States'
import { monthlyCost, renewalCalendar, upcomingDates } from '../features/subscriptions/schedule'
import apiClient, { errorMessage } from '../api/apiClient'
import { useFinanceMutation, useSubscriptions } from '../api/queries'
import { useCurrency } from '../context/AuthContext'
import { daysBetween, formatMoney, formatRelativeDays, formatShortDate, parseISODate, todayISO } from '../lib/format'
import { usePageEntrance } from '../lib/entrance'
import { useSheets } from '../lib/sheets'
import { dur, ease, spring, staggerItem, tabContentVariants } from '../lib/motion'
import { lift } from '../lib/interactions'

function urgency(iso) {
  const d = daysBetween(todayISO(), iso)
  if (d <= 2) return 'danger'
  if (d <= 7) return 'warning'
  return 'neutral'
}

function Hero({ subs, currency }) {
  const active = subs.filter((s) => s.is_active)
  const monthly = active.reduce((sum, s) => sum + monthlyCost(s), 0)
  return (
    <motion.div variants={staggerItem} data-glow className="grid sm:grid-cols-3 rounded-panel border border-line bg-panel divide-y sm:divide-y-0 sm:divide-x divide-line mb-4">
      <div className="p-5 md:p-6">
        <p className="text-sm text-muted">Every month</p>
        <p className="serif text-[48px] leading-none mt-2"><RollingNumber value={formatMoney(monthly, currency, { decimals: 0 })} /></p>
        <p className="text-xs text-muted mt-3">Yearly plans counted as a twelfth</p>
      </div>
      <div className="p-5 md:p-6">
        <p className="text-sm text-muted">Every year</p>
        <p className="serif text-[48px] leading-none mt-2"><RollingNumber value={formatMoney(monthly * 12, currency, { decimals: 0 })} /></p>
        <p className="text-xs text-muted mt-3">What these cost if nothing changes</p>
      </div>
      <div className="p-5 md:p-6 flex items-center gap-5">
        <Ring value={subs.length ? active.length / subs.length : 0} size={84} stroke={8} label={`${active.length} of ${subs.length} active`}>
          <span className="serif text-[30px]">{active.length}</span>
        </Ring>
        <div className="text-sm">
          <p className="text-muted">Active</p>
          <p className="mt-1"><span className="num">{subs.length - active.length}</span> <span className="text-muted">paused</span></p>
        </div>
      </div>
    </motion.div>
  )
}

function Calendar({ subs, selected, onSelect }) {
  const now = new Date()
  const [view, setView] = useState({ y: now.getFullYear(), m: now.getMonth(), dir: 1 })
  const map = useMemo(() => renewalCalendar(subs, view.y, view.m), [subs, view.y, view.m])
  const first = new Date(view.y, view.m, 1)
  const offset = (first.getDay() + 6) % 7 // Monday first
  const days = new Date(view.y, view.m + 1, 0).getDate()
  const today = todayISO()
  const shift = (step) => setView((v) => {
    const d = new Date(v.y, v.m + step, 1)
    return { y: d.getFullYear(), m: d.getMonth(), dir: step }
  })

  return (
    <Panel
      title={<h2 className="text-sm text-fg">{first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</h2>}
      action={
        <div className="flex gap-1">
          <Button size="icon-sm" variant="ghost" aria-label="Previous month" onClick={() => shift(-1)}><ChevronLeft size={15} /></Button>
          <Button size="icon-sm" variant="ghost" aria-label="Next month" onClick={() => shift(1)}><ChevronRight size={15} /></Button>
        </div>
      }
    >
      <div className="grid grid-cols-7 text-center text-2xs text-muted mb-1">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i} className="py-1">{d}</span>)}
      </div>
      <div className="relative overflow-hidden">
        <AnimatePresence mode="popLayout" custom={view.dir} initial={false}>
          <motion.div key={`${view.y}-${view.m}`} custom={view.dir} variants={tabContentVariants} initial="initial" animate="animate" exit="exit"
            className="grid grid-cols-7 gap-1">
            {Array.from({ length: offset }).map((_, i) => <span key={`b${i}`} />)}
            {Array.from({ length: days }, (_, i) => {
              const iso = `${view.y}-${String(view.m + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`
              const due = map[iso] || []
              const isSel = selected === iso
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={!due.length}
                  onClick={() => onSelect(isSel ? null : iso)}
                  aria-label={`${formatShortDate(iso)}${due.length ? `, ${due.map((s) => s.name).join(', ')} renew` : ''}`}
                  aria-pressed={isSel}
                  className={`relative aspect-square rounded-md text-xs num flex flex-col items-center justify-center gap-0.5 transition-colors
                    ${isSel ? 'bg-accent text-on-accent' : due.length ? 'bg-fg/[0.05] hover:bg-fg/[0.1] text-fg' : 'text-faint'}
                    ${iso === today && !isSel ? 'ring-1 ring-accent/70' : ''}`}
                >
                  {i + 1}
                  {due.length > 0 && (
                    <span className="flex gap-0.5" aria-hidden="true">
                      {due.slice(0, 3).map((s) => <span key={s.id} className={`h-1 w-1 rounded-full ${isSel ? 'bg-on-accent' : 'bg-accent'}`} />)}
                    </span>
                  )}
                </button>
              )
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </Panel>
  )
}

function Upcoming({ subs, currency, selectedDay, onOpen }) {
  const list = useMemo(() => {
    const active = subs.filter((s) => s.is_active)
    if (selectedDay) {
      const d = parseISODate(selectedDay)
      return active.filter((s) => renewalCalendar([s], d.getFullYear(), d.getMonth())[selectedDay])
    }
    const horizon = 30
    return active
      .filter((s) => daysBetween(todayISO(), s.next_renewal_date) <= horizon && daysBetween(todayISO(), s.next_renewal_date) >= 0)
      .sort((a, b) => a.next_renewal_date.localeCompare(b.next_renewal_date))
  }, [subs, selectedDay])

  return (
    <Panel flush className="lg:col-span-2" title={selectedDay ? `Renewing ${formatShortDate(selectedDay)}` : 'Coming up in the next 30 days'}>
      {!list.length ? <EmptyState compact icon={CalendarDays} title="No renewals coming up" body="Nothing renews in this window." /> : (
        <ul className="divide-y divide-line">
          <AnimatePresence initial={false}>
            {list.map((s) => (
              <motion.li key={s.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                transition={{ duration: dur.base, ease }} className="overflow-hidden">
                <button type="button" onClick={() => onOpen(s)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-fg/[0.03]">
                  <Monogram name={s.name} size={34} />
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm">{s.name}</span>
                    <span className="block text-xs text-muted mt-0.5">{formatShortDate(s.next_renewal_date)}</span>
                  </span>
                  <Badge tone={urgency(s.next_renewal_date)}>{formatRelativeDays(s.next_renewal_date)}</Badge>
                  <span className="num text-sm w-24 text-right">{formatMoney(s.amount, currency)}</span>
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </Panel>
  )
}

function SubCard({ sub, currency, onOpen }) {
  return (
    <motion.button
      layoutId={`sub-card-${sub.id}`}
      type="button"
      onClick={() => onOpen(sub)}
      transition={spring.soft}
      whileHover={lift.hover}
      whileTap={lift.tap}
      data-glow className={`group text-left rounded-panel border border-line bg-panel p-4 hover:border-line-strong transition-colors ${sub.is_active ? '' : 'opacity-60'}`}
    >
      <motion.div layout="position" className="flex items-start justify-between">
        <Monogram name={sub.name} size={38} />
        {!sub.is_active ? <Badge>Paused</Badge> : <Badge tone={urgency(sub.next_renewal_date)}>{formatRelativeDays(sub.next_renewal_date)}</Badge>}
      </motion.div>
      <motion.p layout="position" className="mt-4 text-sm text-fg truncate">{sub.name}</motion.p>
      <motion.p layout="position" className="mt-1 flex items-baseline gap-1">
        <span className="serif text-[28px] leading-none">{formatMoney(sub.amount, currency)}</span>
        <span className="text-xs text-muted">/{sub.billing_cycle === 'yearly' ? 'yr' : 'mo'}</span>
      </motion.p>
    </motion.button>
  )
}

/** The selected card, morphed open in place of the grid. */
function SubDetail({ sub, currency, onClose }) {
  const { openSheet } = useSheets()
  const toggle = useFinanceMutation(() => apiClient.put(`/api/subscriptions/${sub.id}`, { is_active: !sub.is_active }))
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  // Portal: the page sits in an isolated stacking context, so the overlay must render at the body.
  return createPortal(
    <>
      <motion.div className="fixed inset-0 z-40 bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <div className="fixed inset-0 z-50 grid place-items-center p-4 pointer-events-none">
        <motion.div
          layoutId={`sub-card-${sub.id}`}
          transition={spring.soft}
          role="dialog"
          aria-modal="true"
          aria-label={sub.name}
          className="pointer-events-auto w-full max-w-md rounded-[16px] border border-line bg-panel p-6 shadow-pop"
        >
          <motion.div layout="position" className="flex items-start justify-between">
            <Monogram name={sub.name} size={52} />
            <Button size="icon" variant="ghost" aria-label="Close" onClick={onClose} autoFocus><X size={16} /></Button>
          </motion.div>
          <motion.p layout="position" className="mt-4 text-base text-fg">{sub.name}</motion.p>
          <motion.p layout="position" className="mt-1 flex items-baseline gap-1">
            <span className="serif text-[44px] leading-none">{formatMoney(sub.amount, currency)}</span>
            <span className="text-sm text-muted">/{sub.billing_cycle === 'yearly' ? 'year' : 'month'}</span>
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.12 } }} exit={{ opacity: 0 }}>
            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-[10px] bg-canvas/50 border border-line p-3">
                <dt className="text-xs text-muted">Per month</dt>
                <dd className="num mt-1">{formatMoney(monthlyCost(sub), currency)}</dd>
              </div>
              <div className="rounded-[10px] bg-canvas/50 border border-line p-3">
                <dt className="text-xs text-muted">Per year</dt>
                <dd className="num mt-1">{formatMoney(monthlyCost(sub) * 12, currency)}</dd>
              </div>
            </dl>
            {sub.is_active && (
              <div className="mt-4">
                <p className="text-xs text-muted mb-2">Next renewals</p>
                <ol className="space-y-1.5">
                  {upcomingDates(sub).map((d, i) => (
                    <li key={d} className="flex justify-between text-sm">
                      <span className={i ? 'text-muted' : 'text-fg'}>{parseISODate(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      <span className="num text-muted">{i === 0 ? formatRelativeDays(d) : ''}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            <div className="mt-6 flex gap-2">
              <Button className="flex-1" loading={toggle.isPending} onClick={() => toggle.mutate(null, {
                onSuccess: () => toast.success(sub.is_active ? `${sub.name} paused` : `${sub.name} resumed`),
                onError: (err) => toast.error(errorMessage(err)),
              })}>
                {sub.is_active ? <><Pause size={14} aria-hidden="true" /> Pause</> : <><Play size={14} aria-hidden="true" /> Resume</>}
              </Button>
              <Button className="flex-1" onClick={() => { onClose(); openSheet('subscription', sub) }}><Pencil size={14} aria-hidden="true" /> Edit</Button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </>,
    document.body,
  )
}

const FILTERS = [{ value: 'active', label: 'Active' }, { value: 'paused', label: 'Paused' }, { value: 'all', label: 'All' }]

export default function Subscriptions() {
  const currency = useCurrency()
  const entrance = usePageEntrance()
  const { openSheet } = useSheets()
  const query = useSubscriptions()
  const [day, setDay] = useState(null)
  const [openId, setOpenId] = useState(null)
  const [filter, setFilter] = useState({ value: 'active', dir: 1 })

  return (
    <motion.div {...entrance}>
      <PageHeader
        context="Recurring charges"
        title="Subscriptions"
        actions={<Button variant="primary" onClick={() => openSheet('subscription')}><Plus size={14} strokeWidth={2.4} aria-hidden="true" /> New subscription</Button>}
      />
      <QueryView query={query} loading={<Skeleton className="h-[520px]" />}>
        {(subs) => {
          if (!subs.length) {
            return (
              <Panel>
                <EmptyState icon={Repeat} title="Track what renews"
                  body="Add Netflix, Spotify, rent or insurance. You'll see renewals on a calendar and get a heads-up before each charge."
                  action={<Button variant="primary" onClick={() => openSheet('subscription')}><Plus size={14} aria-hidden="true" /> New subscription</Button>} />
              </Panel>
            )
          }
          const shown = subs.filter((s) => filter.value === 'all' || (filter.value === 'active' ? s.is_active : !s.is_active))
          const openSub = subs.find((s) => s.id === openId)
          return (
            <>
              <Hero subs={subs} currency={currency} />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                <Calendar subs={subs} selected={day} onSelect={setDay} />
                <Upcoming subs={subs} currency={currency} selectedDay={day} onOpen={(s) => setOpenId(s.id)} />
              </div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm text-muted">Everything you pay for</h2>
                <Segmented size="sm" label="Show" options={FILTERS} value={filter.value}
                  onChange={(value) => setFilter((f) => ({ value, dir: directionOf(FILTERS, f.value, value) }))} />
              </div>
              <AnimatePresence mode="wait" custom={filter.dir} initial={false}>
                <motion.div key={filter.value} custom={filter.dir} variants={tabContentVariants} initial="initial" animate="animate" exit="exit"
                  className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                  {shown.map((s) => <SubCard key={s.id} sub={s} currency={currency} onOpen={(x) => setOpenId(x.id)} />)}
                  {!shown.length && <p className="col-span-full text-sm text-muted py-8 text-center">Nothing here.</p>}
                </motion.div>
              </AnimatePresence>
              <AnimatePresence>
                {openSub && <SubDetail key={openSub.id} sub={openSub} currency={currency} onClose={() => setOpenId(null)} />}
              </AnimatePresence>
            </>
          )
        }}
      </QueryView>
    </motion.div>
  )
}
