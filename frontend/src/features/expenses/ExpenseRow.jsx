import { motion } from 'framer-motion'
import { Repeat } from 'lucide-react'
import { CategoryIcon, CategoryPill } from '../../components/ui/Pill'
import { Checkbox } from '../../components/ui/Controls'
import { useIsEditing, useSheets } from '../../lib/sheets'
import { formatMoney } from '../../lib/format'
import { spring } from '../../lib/motion'

/**
 * One expense. Clicking opens the edit sheet; while it's open the row hands its pill and amount
 * to the sheet (shared layoutIds), and takes them back when the sheet closes.
 */
export default function ExpenseRow({ expense, currency, meta, selectable = false, selected = false, onSelect, compact = false }) {
  const { openSheet } = useSheets()
  const editing = useIsEditing('expense', expense.id)
  const amount = formatMoney(expense.amount, currency)

  return (
    <div
      className={`group relative flex items-center gap-3 ${compact ? 'py-2.5' : 'py-3'} px-4 transition-colors
        ${selected ? 'bg-accent/[0.06]' : 'hover:bg-fg/[0.03]'}`}
    >
      {selectable && (
        <Checkbox
          checked={selected}
          onCheckedChange={(v) => onSelect(Boolean(v))}
          label={`Select ${expense.description || expense.category} ${amount}`}
          className={`${selected ? '' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100'} transition-opacity`}
        />
      )}
      <button
        type="button"
        onClick={() => openSheet('expense', expense)}
        className="flex min-w-0 flex-1 items-center gap-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-accent/40 rounded-md"
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
    </div>
  )
}
