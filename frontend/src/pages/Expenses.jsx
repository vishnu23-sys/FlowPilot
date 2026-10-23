import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useQueryClient } from '@tanstack/react-query'
import { Plus, Search, X, ListFilter, ArrowUpDown, CalendarDays, Trash2, Receipt, Check } from 'lucide-react'
import * as Popover from '@radix-ui/react-popover'
import PageHeader from '../components/ui/PageHeader'
import Panel from '../components/ui/Panel'
import Button from '../components/ui/Button'
import { Checkbox, Menu, MenuTrigger, MenuContent, MenuItem } from '../components/ui/Controls'
import { RowsSkeleton } from '../components/ui/Skeleton'
import { EmptyState, QueryView } from '../components/ui/States'
import ExpenseRow from '../features/expenses/ExpenseRow'
import { DATE_PRESETS, SORTS, filterExpenses, groupByDay, readFilters, sortExpenses, summarize, writeFilters } from '../features/expenses/filters'
import { keys, useExpenses } from '../api/queries'
import { useCurrency } from '../context/AuthContext'
import { CATEGORIES, categoryColor } from '../lib/categories'
import { formatDayLabel, formatMoney } from '../lib/format'
import { usePageEntrance } from '../lib/entrance'
import { useSheets } from '../lib/sheets'
import { deleteWithUndo } from '../lib/undo'
import { dur, ease, spring, staggerItem } from '../lib/motion'

const PAGE = 50

function CategoryFilter({ value, onChange }) {
  const toggle = (id) => onChange(value.includes(id) ? value.filter((c) => c !== id) : [...value, id])
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Button size="md" aria-label="Filter by category">
          <ListFilter size={14} aria-hidden="true" />
          Category
          {value.length > 0 && <span className="num text-2xs rounded bg-accent text-on-accent px-1">{value.length}</span>}
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="start" sideOffset={6} className="z-[60] w-56 rounded-[10px] border border-line bg-raised p-1 shadow-pop">
          {CATEGORIES.map((c) => (
            <label key={c.id} className="flex items-center gap-2.5 h-8 px-2 rounded-md text-sm cursor-pointer hover:bg-fg/[0.05]">
              <Checkbox checked={value.includes(c.id)} onCheckedChange={() => toggle(c.id)} label={c.id} />
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: categoryColor(c.id) }} aria-hidden="true" />
              {c.id}
            </label>
          ))}
          {value.length > 0 && (
            <button type="button" onClick={() => onChange([])} className="mt-1 w-full h-8 rounded-md text-sm text-muted hover:text-fg hover:bg-fg/[0.05]">
              Clear categories
            </button>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

function OptionMenu({ icon: Icon, label, options, value, onChange }) {
  const current = options.find((o) => o.value === value)
  return (
    <Menu>
      <MenuTrigger asChild>
        <Button aria-label={label}>
          <Icon size={14} aria-hidden="true" />
          {current?.label}
        </Button>
      </MenuTrigger>
      <MenuContent align="start">
        {options.map((o) => (
          <MenuItem key={o.value} onSelect={() => onChange(o.value)} icon={o.value === value ? Check : undefined}>
            <span className={o.value === value ? '' : 'pl-[22px]'}>{o.label}</span>
          </MenuItem>
        ))}
      </MenuContent>
    </Menu>
  )
}

function Chip({ children, onRemove, color }) {
  return (
    <motion.button
      layout
      type="button"
      onClick={onRemove}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: dur.fast }}
      className="inline-flex items-center gap-1.5 h-7 pl-2.5 pr-1.5 rounded-full border border-line bg-panel text-xs text-fg hover:border-line-strong"
    >
      {color && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />}
      {children}
      <X size={12} className="text-muted" aria-label="Remove filter" />
    </motion.button>
  )
}

function BulkBar({ count, onClear, onDelete }) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={spring.soft}
          className="fixed bottom-5 left-1/2 z-30 -translate-x-1/2 flex items-center gap-2 rounded-[12px] border border-line bg-raised pl-4 pr-2 py-2 shadow-pop"
          role="region"
          aria-label="Bulk actions"
        >
          <span className="text-sm"><span className="num">{count}</span> selected</span>
          <Button variant="ghost" size="sm" onClick={onClear}>Clear</Button>
          <Button variant="danger" size="sm" onClick={onDelete}><Trash2 size={13} aria-hidden="true" /> Delete</Button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function ExpenseList({ expenses, filters, currency, selected, setSelected, onSwipeDelete }) {
  const [limit, setLimit] = useState(PAGE)
  const sentinel = useRef(null)
  const filtered = useMemo(() => sortExpenses(filterExpenses(expenses, filters), filters.sort), [expenses, filters])
  const visible = filtered.slice(0, limit)
  const byDate = filters.sort.startsWith('date')
  const groups = byDate ? groupByDay(visible) : [{ date: null, total: 0, items: visible }]
  const stats = summarize(filtered)

  useEffect(() => setLimit(PAGE), [filters])
  useEffect(() => {
    const el = sentinel.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => entry.isIntersecting && setLimit((l) => l + PAGE), { rootMargin: '400px' })
    io.observe(el)
    return () => io.disconnect()
  }, [visible.length, filtered.length])

  const allVisibleSelected = visible.length > 0 && visible.every((e) => selected.has(e.id))
  const toggleAll = () => setSelected(allVisibleSelected ? new Set() : new Set(visible.map((e) => e.id)))
  const toggle = (id, on) => setSelected((s) => {
    const next = new Set(s)
    if (on) next.add(id)
    else next.delete(id)
    return next
  })

  if (!filtered.length) {
    return (
      <Panel>
        <EmptyState icon={Search} title="No expenses match" body="Try a different search, or clear some filters." />
      </Panel>
    )
  }

  return (
    <>
      <motion.div variants={staggerItem} className="flex flex-wrap items-baseline justify-between gap-2 mb-2 px-1 text-sm text-muted">
        <p>
          <span className="num text-fg">{stats.count}</span> {stats.count === 1 ? 'expense' : 'expenses'} totalling{' '}
          <span className="num text-fg">{formatMoney(stats.total, currency)}</span>, about{' '}
          <span className="num text-fg">{formatMoney(stats.average, currency)}</span> each
        </p>
        <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
          <Checkbox
            checked={allVisibleSelected ? true : selected.size ? 'indeterminate' : false}
            onCheckedChange={toggleAll}
            label="Select all shown"
          />
          Select all shown
        </label>
      </motion.div>

      <Panel flush bodyClassName="overflow-clip rounded-panel">
        {/* One flat list (day headers + rows) so a row keeps its identity across sorts and glides to its new place. */}
        <AnimatePresence initial={false}>
          {groups.flatMap((g) => [
            g.date && (
              <motion.div
                key={`day-${g.date}`}
                layout="position"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: dur.base, ease }}
                className="sticky top-[52px] z-[2] flex items-center justify-between border-b border-line bg-raised px-4 py-2 text-xs"
              >
                <span className="text-fg font-medium">{formatDayLabel(g.date)}</span>
                <span className="num text-muted">{formatMoney(g.total, currency)}</span>
              </motion.div>
            ),
            ...g.items.map((e) => (
              <motion.div
                key={e.id}
                layout="position"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: dur.base, ease, layout: { type: 'spring', stiffness: 340, damping: 34 } }}
                className="border-b border-line last:border-b-0 overflow-hidden"
              >
                <ExpenseRow
                  expense={e}
                  currency={currency}
                  meta={[byDate ? null : formatDayLabel(e.date), e.payment_method].filter(Boolean).join(', ')}
                  selectable
                  selected={selected.has(e.id)}
                  onSelect={(on) => toggle(e.id, on)}
                  onSwipeDelete={onSwipeDelete}
                />
              </motion.div>
            )),
          ].filter(Boolean))}
        </AnimatePresence>
      </Panel>
      {visible.length < filtered.length && (
        <div ref={sentinel} className="py-6 text-center">
          <Button size="sm" onClick={() => setLimit((l) => l + PAGE)}>Show more</Button>
        </div>
      )}
    </>
  )
}

export default function Expenses() {
  const currency = useCurrency()
  const entrance = usePageEntrance()
  const qc = useQueryClient()
  const { openSheet } = useSheets()
  const query = useExpenses()
  const [params, setParams] = useSearchParams()
  const filters = useMemo(() => readFilters(params), [params])
  const [search, setSearch] = useState(filters.q)
  const [selected, setSelected] = useState(new Set())
  const searchRef = useRef(null)

  const setFilters = (patch) => setParams(writeFilters({ ...filters, ...patch }), { replace: true })

  // Debounce typing into the URL.
  useEffect(() => {
    const id = setTimeout(() => { if (search !== filters.q) setFilters({ q: search }) }, 200)
    return () => clearTimeout(id)
  }, [search]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const deleteSelected = () => {
    const ids = [...selected]
    setSelected(new Set())
    deleteWithUndo({
      qc, queryKey: keys.expenses, ids,
      message: `${ids.length} ${ids.length === 1 ? 'expense' : 'expenses'} deleted`,
      url: '/api/expenses/bulk-delete', method: 'POST', body: { ids },
    })
  }

  const hasFilters = filters.q || filters.categories.length || filters.preset !== 'all'

  return (
    <motion.div {...entrance}>
      <PageHeader
        context="Every rupee out, by day"
        title="Expenses"
        actions={<Button variant="primary" onClick={() => openSheet('expense')}><Plus size={14} strokeWidth={2.4} aria-hidden="true" /> New expense</Button>}
      />

      <motion.div variants={staggerItem} className="flex flex-wrap items-center gap-2 mb-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            ref={searchRef}
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search description, category or amount"
            aria-label="Search expenses"
            className="h-9 w-full rounded-control border border-line bg-panel pl-9 pr-10 text-sm text-fg placeholder:text-faint outline-none
              hover:border-line-strong focus:border-accent/70 focus:ring-2 focus:ring-accent/20"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-2xs font-mono text-faint">/</kbd>
        </div>
        <CategoryFilter value={filters.categories} onChange={(categories) => setFilters({ categories })} />
        <OptionMenu icon={CalendarDays} label="Date range" options={DATE_PRESETS} value={filters.preset} onChange={(preset) => setFilters({ preset })} />
        <OptionMenu icon={ArrowUpDown} label="Sort" options={SORTS} value={filters.sort} onChange={(sort) => setFilters({ sort })} />
      </motion.div>

      <div className="flex flex-wrap items-center gap-1.5 mb-4 min-h-0">
        <AnimatePresence>
          {filters.q && <Chip key="q" onRemove={() => { setSearch(''); setFilters({ q: '' }) }}>“{filters.q}”</Chip>}
          {filters.categories.map((c) => (
            <Chip key={c} color={categoryColor(c)} onRemove={() => setFilters({ categories: filters.categories.filter((x) => x !== c) })}>{c}</Chip>
          ))}
          {filters.preset !== 'all' && (
            <Chip key="preset" onRemove={() => setFilters({ preset: 'all' })}>{DATE_PRESETS.find((p) => p.value === filters.preset)?.label}</Chip>
          )}
          {hasFilters && (
            <motion.button key="clear" layout type="button" onClick={() => { setSearch(''); setParams(new URLSearchParams(), { replace: true }) }}
              className="h-7 px-2 text-xs text-muted hover:text-fg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              Clear all
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <QueryView query={query} loading={<Panel flush><RowsSkeleton rows={8} /></Panel>}>
        {(expenses) => expenses.length === 0 ? (
          <Panel>
            <EmptyState
              icon={Receipt}
              title="Log your first expense"
              body="Press N anywhere, or use the button below. Expenses power your charts, budgets and insights."
              action={<Button variant="primary" onClick={() => openSheet('expense')}><Plus size={14} aria-hidden="true" /> New expense</Button>}
            />
          </Panel>
        ) : (
          <ExpenseList expenses={expenses} filters={filters} currency={currency} selected={selected} setSelected={setSelected}
            onSwipeDelete={(e) => deleteWithUndo({ qc, queryKey: keys.expenses, ids: [e.id], message: 'Expense deleted', url: `/api/expenses/${e.id}` })} />
        )}
      </QueryView>

      <BulkBar count={selected.size} onClear={() => setSelected(new Set())} onDelete={deleteSelected} />
    </motion.div>
  )
}
