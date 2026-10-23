import { useRef } from 'react'
import { useInView } from 'motion/react'
import { usePreferences } from '../../lib/preferences'

/**
 * Mounts a chart only once it scrolls into view, so its draw-in animation plays when the
 * reader actually reaches it. Keeps the space reserved so nothing jumps.
 */
export default function Reveal({ children, className = '', amount = 0.35 }) {
  const ref = useRef(null)
  const { reduceMotion } = usePreferences()
  const inView = useInView(ref, { once: true, amount })
  return (
    <div ref={ref} className={className}>
      {inView || reduceMotion ? children : null}
    </div>
  )
}
