import { motion } from 'motion/react'
import { CATEGORIES, INCOME_SOURCES, categoryColor, sourceColor } from '../../lib/categories'
import { toISODate } from '../../lib/format'
import { spring } from '../../lib/motion'

/** Grid of selectable tiles (categories or income sources). Arrow keys move between tiles. */
function TileGrid({ items, value, onChange, colorOf, label }) {
  const onKeyDown = (e) => {
    const i = items.findIndex((it) => it.id === value)
    const step = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 5, ArrowUp: -5 }[e.key]
    if (step == null) return
    e.preventDefault()
    const next = items[(i + step + items.length) % items.length]
    onChange(next.id)
    e.currentTarget.querySelector(`[data-id="${next.id}"]`)?.focus()
  }
  return (
    <div role="radiogroup" aria-label={label} onKeyDown={onKeyDown} className="grid grid-cols-5 gap-1.5">
      {items.map((item) => {
        const Icon = item.icon
        const active = item.id === value
        return (
          <button
            key={item.id}
            type="button"
            role="radio"
            aria-checked={active}
            data-id={item.id}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(item.id)}
            className={`relative flex flex-col items-center gap-1 rounded-[9px] border py-2 px-1 text-2xs transition-colors
              ${active ? 'border-transparent text-fg' : 'border-line text-muted hover:text-fg hover:border-line-strong'}`}
          >
            {active && (
              <motion.span
                layoutId={`tile-${label}`}
                transition={spring.snappy}
                className="absolute inset-0 rounded-[9px] border"
                style={{ backgroundColor: colorOf(item.id, 0.12), borderColor: colorOf(item.id, 0.55) }}
              />
            )}
            <Icon size={16} strokeWidth={1.8} className="relative" style={{ color: active ? colorOf(item.id) : undefined }} aria-hidden="true" />
            <span className="relative truncate max-w-full">{item.id}</span>
          </button>
        )
      })}
    </div>
  )
}

export function CategoryGrid({ value, onChange }) {
  return <TileGrid items={CATEGORIES} value={value} onChange={onChange} colorOf={categoryColor} label="Category" />
}

export function SourceGrid({ value, onChange }) {
  return <TileGrid items={INCOME_SOURCES} value={value} onChange={onChange} colorOf={sourceColor} label="Source" />
}

/** Date input with quick "Today / Yesterday" chips. */
export function DateQuickPick({ value, onChange, id, ...props }) {
  const today = toISODate(new Date())
  const y = new Date()
  y.setDate(y.getDate() - 1)
  const yesterday = toISODate(y)
  const chip = (iso, label) => (
    <button
      type="button"
      onClick={() => onChange(iso)}
      className={`h-7 px-2.5 rounded-full text-xs border transition-colors
        ${value === iso ? 'border-accent/60 bg-accent/10 text-fg' : 'border-line text-muted hover:text-fg'}`}
    >
      {label}
    </button>
  )
  return (
    <div className="flex items-center gap-2">
      <input
        id={id}
        type="date"
        value={value}
        max="2100-12-31"
        onChange={(e) => onChange(e.target.value)}
        className="h-9 flex-1 min-w-0 rounded-control border border-line bg-canvas/60 px-3 text-sm text-fg outline-none
          hover:border-line-strong focus:border-accent/70 focus:ring-2 focus:ring-accent/20"
        {...props}
      />
      {chip(today, 'Today')}
      {chip(yesterday, 'Yesterday')}
    </div>
  )
}

/** Validates a positive amount; returns an error string or null. */
export function amountError(value) {
  if (value === '' || value == null) return 'Enter an amount'
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return 'Amount must be more than 0'
  return null
}
