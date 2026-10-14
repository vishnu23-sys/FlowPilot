import { useEffect, useState } from 'react'

const DIGITS = '0123456789'

/**
 * Renders a formatted string where each digit rolls vertically to its new value.
 * Non-digit characters (currency, separators) render statically. Columns are keyed from the
 * right so units stay units when the number grows a digit. Each column is sized by an invisible
 * copy of its target digit, so proportional (serif) figures keep their natural spacing.
 */
export default function RollingNumber({ value, className = '', ariaLabel }) {
  const [shown, setShown] = useState(() => value.replace(/\d/g, '0'))

  useEffect(() => {
    // A timeout rather than requestAnimationFrame: rAF is paused in background tabs, which would
    // leave the number stuck at zeros if it mounted while hidden.
    const id = setTimeout(() => setShown(value), 30)
    return () => clearTimeout(id)
  }, [value])

  const chars = shown.split('')
  return (
    <span className={`inline-flex items-baseline ${className}`}>
      <span className="sr-only">{ariaLabel ?? value}</span>
      {chars.map((ch, i) => {
        const key = chars.length - i
        if (!DIGITS.includes(ch)) {
          return <span key={`s${key}`} aria-hidden="true">{ch}</span>
        }
        return (
          <span key={`d${key}`} aria-hidden="true" className="relative inline-block overflow-hidden h-[1.1em] leading-[1.1em] align-baseline">
            <span className="invisible">{ch}</span>
            <span
              className="roll-track absolute inset-x-[-0.2em] top-0 flex flex-col items-center transition-transform duration-700 ease-out"
              style={{ transform: `translateY(-${Number(ch) * 10}%)` }}
            >
              {DIGITS.split('').map((d) => <span key={d} className="h-[1.1em]">{d}</span>)}
            </span>
          </span>
        )
      })}
    </span>
  )
}
