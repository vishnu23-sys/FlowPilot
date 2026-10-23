import { useEffect } from 'react'
import { useAnimate } from 'motion/react'
import { usePreferences } from '../../lib/preferences'

const COLORS = ['rgb(var(--accent))', 'rgb(var(--cat-food))', 'rgb(var(--cat-transport))', 'rgb(var(--cat-shopping))', 'rgb(var(--cat-entertainment))']

/**
 * A one-off ring of particles flying out from the centre of its (relative) parent.
 * Started imperatively on mount: declarative `initial` animations are skipped inside an
 * AnimatePresence with initial={false} (like the Goals tab), which would hide the burst.
 */
export default function Burst({ count = 18, distance = 54, delay = 0.35 }) {
  const { reduceMotion } = usePreferences()
  const [scope, animate] = useAnimate()

  useEffect(() => {
    if (reduceMotion || !scope.current) return
    const particles = scope.current.querySelectorAll('[data-particle]')
    particles.forEach((el, i) => {
      const angle = (i / count) * Math.PI * 2
      const r = distance * (0.8 + ((i * 37) % 10) / 25)
      animate(
        el,
        { x: [0, Math.cos(angle) * r], y: [0, Math.sin(angle) * r], scale: [0.4, 1.1, 0], opacity: [1, 1, 0] },
        { duration: 0.9, delay, ease: [0.15, 0.8, 0.3, 1] },
      )
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (reduceMotion) return null
  return (
    <span ref={scope} aria-hidden="true" className="pointer-events-none absolute inset-0">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          data-particle
          className="absolute left-1/2 top-1/2 -ml-[3px] -mt-[3px] h-1.5 w-1.5 rounded-full opacity-0"
          style={{ backgroundColor: COLORS[i % COLORS.length] }}
        />
      ))}
    </span>
  )
}
