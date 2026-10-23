import { useEffect, useRef, useState } from 'react'
import { animate, motion, useMotionValue, useTransform } from 'motion/react'
import { Repeat, Trash2 } from 'lucide-react'
import { CategoryIcon, CategoryPill } from '../../components/ui/Pill'
import { Checkbox } from '../../components/ui/Controls'
import { useIsEditing, useSheets } from '../../lib/sheets'
import { formatMoney } from '../../lib/format'
import { spring } from '../../lib/motion'
import { freshExpenses, useSignal } from '../../lib/interactions'
import { usePreferences } from '../../lib/preferences'

const SWIPE_THRESHOLD = 0.35

/**
 * One expense. Clicking opens the edit sheet; while it's open the row hands its pill and amount
 * to the sheet (shared layoutIds), and takes them back when the sheet closes.
 * With onSwipeDelete, dragging the row left past a third of its width deletes it.
 * A row for an expense added moments ago flashes once so you can see where it landed.
 */
export default function ExpenseRow({ expense, currency, meta, selectable = false, selected = false, onSelect, compact = false, onSwipeDelete }) {
  const { openSheet } = useSheets()
  const { reduceMotion } = usePreferences()
  const editing = useIsEditing('expense', expense.id)
  const fresh = useSignal(freshExpenses, expense.id)
  const amount = formatMoney(expense.amount, currency)

  const rowRef = useRef(null)
  const dragged = useRef(false)
  const x = useMotionValue(0)
  const revealOpacity = useTransform(x, [-120, -24, 0], [1, 0.4, 0])

  const [flash, setFlash] = useState(fresh)
  useEffect(() => {
    if (!fresh) return undefined
    setFlash(true)
    const id = setTimeout(() => setFlash(false), 60)
    return () => clearTimeout(id)
  }, [fresh])

  const onDragEnd = (_, info) => {
    const width = rowRef.current?.offsetWidth || 400
    if (info.offset.x < -width * SWIPE_THRESHOLD || info.velocity.x < -900) {
      animate(x, -width, { duration: 0.18, ease: 'easeIn' }).then(() => onSwipeDelete(expense))
    } else {
      animate(x, 0, { type: 'spring', stiffness: 500, damping: 32 })
    }
    // Let the click that ends a drag fall through without opening the editor.
    setTimeout(() => { dragged.current = false }, 0)
  }

  const swipeable = Boolean(onSwipeDelete) && !editing

  return (
    <div ref={rowRef} className="relative overflow-hidden">
      {swipeable && (
        <motion.div
          aria-hidden="true"
          style={{ opacity: revealOpacity }}
          className="absolute inset-0 flex items-center justify-end gap-2 bg-danger pr-5 text-sm font-medium text-canvas"
        >
          <Trash2 size={15} /> Delete
        </motion.div>
      )}
      <motion.div
        style={{ x }}
        drag={swipeable ? 'x' : false}
        dragDirectionLock
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.9, right: 0.05 }}
        dragMomentum={false}
        onDragStart={() => { dragged.current = true }}
        onDragEnd={onDragEnd}
        className={`group relative flex items-center gap-3 ${compact ? 'py-2.5' : 'py-3'} px-4 transition-colors touch-pan-y
          ${selected ? 'bg-[color-mix(in_srgb,rgb(var(--accent))_6%,rgb(var(--panel)))]' : 'bg-panel hover:bg-raised'}`}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-accent/15"
          style={{ opacity: flash ? 1 : 0, transition: flash || reduceMotion ? 'none' : 'opacity 1.4s ease 0.35s' }}
        />
        {selectable && (
          <Checkbox
            checked={selected}
            onCheckedChange={(v) => onSelect(Boolean(v))}
            label={`Select ${expense.description || expense.category} ${amount}`}
            className={`relative ${selected ? '' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100'} transition-opacity`}
          />
        )}
        <button
          type="button"
          onClick={() => { if (!dragged.current) openSheet('expense', expense) }}
          className="relative flex min-w-0 flex-1 items-center gap-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-accent/40 rounded-md"
          aria-label={`Edit ${expense.description || expense.category}, ${amount}`}
        >
          <CategoryIcon id={expense.category} size={compact ? 30 : 34} />
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 text-sm text-fg truncate">
              <span className="truncate">{expense.description || expense.category}</span>
              {expense.is_recurring && <Repeat size={11} className="text-faint shrink-0" aria-label="Repeats monthly" />}
            </span>
            <span className="mt-0.5 flex items-center gap-2 text-xs text-muted">
              {editing
                ? <span className="h-[22px] w-16" aria-hidden="true" />
                : <CategoryPill id={expense.category} layoutId={`exp-pill-${expense.id}`} />}
              {meta && <span className="truncate">{meta}</span>}
            </span>
          </span>
          {editing ? (
            <span className="num text-sm opacity-0" aria-hidden="true">{amount}</span>
          ) : (
            <motion.span layoutId={`exp-amt-${expense.id}`} transition={spring.soft} className="num text-sm text-fg whitespace-nowrap">
              −{amount}
            </motion.span>
          )}
        </button>
      </motion.div>
    </div>
  )
}
