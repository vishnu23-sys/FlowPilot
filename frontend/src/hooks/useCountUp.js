import { useState, useEffect, useRef } from 'react'

export function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0)
  const raf = useRef(null)

  useEffect(() => {
    if (typeof target !== 'number' || isNaN(target)) return
    cancelAnimationFrame(raf.current)

    const startTime = performance.now()

    const tick = (now) => {
      const t = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3) // ease-out cubic
      setValue(target * eased)
      if (t < 1) raf.current = requestAnimationFrame(tick)
      else setValue(target)
    }

    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration])

  return value
}
