import { useId, useRef } from 'react'
import { motion } from 'framer-motion'
import { spring } from '../../lib/motion'

/**
 * Segmented control with a spring indicator that slides between options.
 * options: [{ value, label, count? }]. Arrow keys move the selection.
 * onChange(value, event) — event is present for clicks (callers can read the click origin).
 */
export default function Segmented({ options, value, onChange, size = 'md', className = '', label, fullWidth = false }) {
  const layoutId = useId()
  const refs = useRef([])
  const index = options.findIndex((o) => o.value === value)

  const onKeyDown = (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const next = (index + (e.key === 'ArrowRight' ? 1 : -1) + options.length) % options.length
    onChange(options[next].value)
    refs.current[next]?.focus()
  }

  const pad = size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3 text-sm'

  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={`relative inline-flex items-center p-0.5 rounded-[9px] bg-canvas/70 border border-line ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {options.map((opt, i) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            ref={(el) => { refs.current[i] = el }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={(e) => onChange(opt.value, e)}
            className={`relative ${pad} ${fullWidth ? 'flex-1' : ''} rounded-[7px] whitespace-nowrap transition-colors duration-150
              ${active ? 'text-fg' : 'text-muted hover:text-fg'}`}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={spring.snappy}
                className="absolute inset-0 rounded-[7px] bg-raised border border-line-strong/60 shadow-[0_1px_2px_rgb(0_0_0/0.15)]"
              />
            )}
            <span className="relative inline-flex items-center gap-1.5">
              {opt.label}
              {opt.count != null && <span className="num text-2xs text-faint">{opt.count}</span>}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/** Direction (+1/-1) of travel between two values in an options list; feeds tab-content variants. */
export function directionOf(options, from, to) {
  const a = options.findIndex((o) => o.value === from)
  const b = options.findIndex((o) => o.value === to)
  return b >= a ? 1 : -1
}
