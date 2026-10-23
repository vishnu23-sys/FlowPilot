import { useEffect, useRef } from 'react'
import { hasFinePointer, onPointer } from '../../lib/interactions'
import { usePreferences } from '../../lib/preferences'

const GAP = 18
const RADIUS = 130
const HEIGHT = 680

/**
 * Brightens the background dot grid around the cursor. The resting grid is the CSS layer on
 * .canvas-dots; this canvas only draws the lit dots near the pointer, aligned to the same grid.
 */
export default function LivingDots() {
  const ref = useRef(null)
  const { reduceMotion, resolvedTheme } = usePreferences()

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || reduceMotion || !hasFinePointer()) return undefined
    const ctx = canvas.getContext('2d')
    const color = getComputedStyle(document.documentElement).getPropertyValue('--dot').trim().split(/\s+/).join(',')
    let drawn = false

    const size = () => {
      const dpr = window.devicePixelRatio || 1
      const { width } = canvas.getBoundingClientRect()
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(HEIGHT * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    size()

    const draw = (p) => {
      const rect = canvas.getBoundingClientRect()
      const x = p.x - rect.left
      const y = p.y - rect.top
      ctx.clearRect(0, 0, rect.width, HEIGHT)
      drawn = false
      if (x < -RADIUS || y < -RADIUS || x > rect.width + RADIUS || y > HEIGHT + RADIUS) return
      const fromX = Math.max(0, Math.floor((x - RADIUS) / GAP) * GAP)
      const fromY = Math.max(0, Math.floor((y - RADIUS) / GAP) * GAP)
      for (let gx = fromX; gx <= x + RADIUS; gx += GAP) {
        for (let gy = fromY; gy <= Math.min(y + RADIUS, HEIGHT); gy += GAP) {
          const k = 1 - Math.hypot(gx - x, gy - y) / RADIUS
          if (k <= 0) continue
          const fade = 1 - (gy / HEIGHT) * 0.5
          ctx.fillStyle = `rgba(${color},${(k * k * 0.42 * fade).toFixed(3)})`
          ctx.beginPath()
          ctx.arc(gx, gy - k * 2.5, 1 + k * 1.1, 0, Math.PI * 2)
          ctx.fill()
          drawn = true
        }
      }
    }

    const off = onPointer(draw)
    const ro = new ResizeObserver(size)
    ro.observe(canvas)
    return () => {
      off()
      ro.disconnect()
      if (drawn) ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }, [reduceMotion, resolvedTheme])

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 w-full"
      style={{
        height: HEIGHT,
        maskImage: 'linear-gradient(to bottom, #000 0%, rgb(0 0 0 / 0.6) 45%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, #000 0%, rgb(0 0 0 / 0.6) 45%, transparent 100%)',
      }}
    />
  )
}
