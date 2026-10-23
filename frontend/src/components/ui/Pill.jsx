import { forwardRef } from 'react'
import { motion } from 'motion/react'
import { category, categoryColor, incomeSource, sourceColor } from '../../lib/categories'

/** Category tag: tinted background, category-coloured text. Optional layoutId for morphs. */
export const CategoryPill = forwardRef(function CategoryPill({ id, layoutId, size = 'sm', className = '' }, ref) {
  return (
    <motion.span
      ref={ref}
      layoutId={layoutId}
      className={`inline-flex items-center gap-1.5 rounded-full whitespace-nowrap font-medium
        ${size === 'sm' ? 'h-[22px] px-2 text-2xs' : 'h-7 px-2.5 text-xs'} ${className}`}
      style={{ backgroundColor: categoryColor(id, 0.14), color: categoryColor(id) }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: categoryColor(id) }} aria-hidden="true" />
      {id}
    </motion.span>
  )
})

/** Round icon tile for a category, used as a row avatar. */
export function CategoryIcon({ id, size = 32 }) {
  const Icon = category(id).icon
  return (
    <span
      className="inline-flex items-center justify-center rounded-full shrink-0"
      style={{ width: size, height: size, backgroundColor: categoryColor(id, 0.14), color: categoryColor(id) }}
      aria-hidden="true"
    >
      <Icon size={Math.round(size * 0.45)} strokeWidth={1.8} />
    </span>
  )
}

export function SourceIcon({ id, size = 32 }) {
  const Icon = incomeSource(id).icon
  return (
    <span
      className="inline-flex items-center justify-center rounded-full shrink-0"
      style={{ width: size, height: size, backgroundColor: sourceColor(id, 0.14), color: sourceColor(id) }}
      aria-hidden="true"
    >
      <Icon size={Math.round(size * 0.45)} strokeWidth={1.8} />
    </span>
  )
}

const TONES = {
  neutral: 'bg-fg/[0.06] text-muted',
  accent: 'bg-accent/15 text-accent',
  danger: 'bg-danger/15 text-danger',
  warning: 'bg-warning/15 text-warning',
  success: 'bg-success/15 text-success',
}

export function Badge({ tone = 'neutral', children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 h-5 px-1.5 rounded-md text-2xs font-medium whitespace-nowrap ${TONES[tone]} ${className}`}>
      {children}
    </span>
  )
}

/** Letter tile for services without logos (subscriptions). Colour is derived from the name. */
export function Monogram({ name, size = 36, className = '' }) {
  const tokens = ['food', 'transport', 'shopping', 'entertainment', 'bills', 'health', 'education', 'travel', 'investments']
  const hash = [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)
  const token = tokens[hash % tokens.length]
  const letters = name.replace(/[^A-Za-z0-9 ]/g, '').split(/\s+/).filter(Boolean)
  const text = letters.length > 1 ? letters[0][0] + letters[1][0] : (letters[0] || '?').slice(0, 2)
  return (
    <span
      className={`inline-flex items-center justify-center rounded-[10px] shrink-0 font-semibold uppercase tracking-tight ${className}`}
      style={{
        width: size, height: size, fontSize: size * 0.36,
        backgroundColor: `rgb(var(--cat-${token}) / 0.16)`, color: `rgb(var(--cat-${token}))`,
      }}
      aria-hidden="true"
    >
      {text}
    </span>
  )
}
