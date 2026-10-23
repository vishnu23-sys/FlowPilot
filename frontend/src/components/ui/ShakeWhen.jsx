import { useAnimate } from 'motion/react'
import { shakeKeyframes, useOnChange } from '../../lib/interactions'
import { usePreferences } from '../../lib/preferences'

/** Shakes its children once each time `active` flips from false to true (never on first render). */
export default function ShakeWhen({ active, children, className = '', delay = 0.35 }) {
  const [scope, animate] = useAnimate()
  const { reduceMotion } = usePreferences()
  useOnChange(Boolean(active), (was, now) => {
    if (now && !was && !reduceMotion && scope.current) animate(scope.current, shakeKeyframes, { duration: 0.45, delay })
  })
  return <div ref={scope} className={className}>{children}</div>
}
