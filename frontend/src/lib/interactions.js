import { useEffect, useRef, useSyncExternalStore } from 'react'
import { useMotionValue, useSpring, useTransform } from 'motion/react'
import { usePreferences } from './preferences'

/** True on devices with a real mouse; cursor effects are skipped on touch screens. */
export function hasFinePointer() {
  return typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches
}

/* ------------------------------------------------------------------ */
/* Pointer: one listener feeds the panel glow and the living dot grid. */
/* ------------------------------------------------------------------ */

const pointerListeners = new Set()
export const pointer = { x: -9999, y: -9999 }

/** Subscribe to page-level pointer moves (client coordinates). Returns an unsubscribe. */
export function onPointer(fn) {
  pointerListeners.add(fn)
  return () => pointerListeners.delete(fn)
}

/**
 * Drives cursor effects for the whole app: sets --mx/--my on every element marked
 * data-glow (relative to that element) and notifies pointer subscribers, once per frame.
 */
export function usePointerEffects() {
  const { reduceMotion } = usePreferences()
  useEffect(() => {
    if (reduceMotion || !hasFinePointer()) return undefined
    let frame = 0
    const flush = () => {
      frame = 0
      for (const el of document.querySelectorAll('[data-glow]')) {
        const r = el.getBoundingClientRect()
        // Only near elements light up; skip the work for anything far away.
        if (pointer.x < r.left - 300 || pointer.x > r.right + 300 || pointer.y < r.top - 300 || pointer.y > r.bottom + 300) {
          if (el.style.getPropertyValue('--mx') !== '-999px') {
            el.style.setProperty('--mx', '-999px')
            el.style.setProperty('--my', '-999px')
          }
          continue
        }
        el.style.setProperty('--mx', `${pointer.x - r.left}px`)
        el.style.setProperty('--my', `${pointer.y - r.top}px`)
      }
      pointerListeners.forEach((fn) => fn(pointer))
    }
    const onMove = (e) => {
      pointer.x = e.clientX
      pointer.y = e.clientY
      if (!frame) frame = requestAnimationFrame(flush)
    }
    const onLeave = () => {
      pointer.x = -9999
      pointer.y = -9999
      if (!frame) frame = requestAnimationFrame(flush)
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(flush) }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('scroll', onScroll)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      onLeave()
    }
  }, [reduceMotion])
}

/* ------------------------------------------------------------------ */
/* Tilt toward the cursor (landing preview).                           */
/* ------------------------------------------------------------------ */

/** Returns { ref, style } for an element that tilts toward the pointer while hovered. */
export function useTilt({ max = 7 } = {}) {
  const { reduceMotion } = usePreferences()
  const ref = useRef(null)
  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [max, -max]), { stiffness: 160, damping: 18 })
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-max * 1.15, max * 1.15]), { stiffness: 160, damping: 18 })
  const shineX = useTransform(px, [-0.5, 0.5], ['20%', '80%'])
  const shineY = useTransform(py, [-0.5, 0.5], ['10%', '90%'])

  useEffect(() => {
    const el = ref.current
    if (!el || reduceMotion || !hasFinePointer()) return undefined
    const zone = el.parentElement || el
    const move = (e) => {
      const r = el.getBoundingClientRect()
      px.set((e.clientX - r.left) / r.width - 0.5)
      py.set((e.clientY - r.top) / r.height - 0.5)
    }
    const leave = () => { px.set(0); py.set(0) }
    zone.addEventListener('pointermove', move)
    zone.addEventListener('pointerleave', leave)
    return () => {
      zone.removeEventListener('pointermove', move)
      zone.removeEventListener('pointerleave', leave)
    }
  }, [reduceMotion, px, py])

  return { ref, style: { rotateX, rotateY, transformPerspective: 1000 }, shineX, shineY }
}

/* ------------------------------------------------------------------ */
/* Feedback signals: "just added" flashes and goal celebrations.       */
/* ------------------------------------------------------------------ */

function createSignalStore(ttl) {
  const items = new Map()
  const subs = new Set()
  let version = 0
  const emit = () => { version += 1; subs.forEach((fn) => fn()) }
  return {
    mark(key) {
      items.set(key, Date.now())
      emit()
      setTimeout(() => { items.delete(key); emit() }, ttl)
    },
    has: (key) => items.has(key),
    subscribe: (fn) => { subs.add(fn); return () => subs.delete(fn) },
    snapshot: () => version,
  }
}

/** Expenses created in the last few seconds; their rows flash once when they appear. */
export const freshExpenses = createSignalStore(4000)
/** Goals that were just fully funded; their ring bursts once. */
export const celebratedGoals = createSignalStore(4000)

export function useSignal(store, key) {
  useSyncExternalStore(store.subscribe, store.snapshot)
  return store.has(key)
}

/* ------------------------------------------------------------------ */
/* Small helpers.                                                      */
/* ------------------------------------------------------------------ */

/** Calls fn when value changes from what it was on the previous render (not on mount). */
export function useOnChange(value, fn) {
  const prev = useRef(value)
  useEffect(() => {
    if (prev.current !== value) fn(prev.current, value)
    prev.current = value
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps
}

/** Shared presets for pressable things. */
export const press = {
  tap: { scale: 0.96 },
  transition: { type: 'spring', stiffness: 600, damping: 22 },
}

export const lift = {
  hover: { y: -3 },
  tap: { scale: 0.98 },
  transition: { type: 'spring', stiffness: 380, damping: 24 },
}

export const shakeKeyframes = { x: [0, -7, 7, -5, 5, -2, 0] }
export const wiggleKeyframes = { rotate: [0, -16, 14, -10, 6, 0] }

/* ------------------------------------------------------------------ */
/* Current page title, shown in the top bar once the big one scrolls.  */
/* ------------------------------------------------------------------ */

let currentTitle = ''
const titleSubs = new Set()

export function setPageTitle(title) {
  currentTitle = title
  titleSubs.forEach((fn) => fn())
}

export function usePageTitle() {
  return useSyncExternalStore(
    (fn) => { titleSubs.add(fn); return () => titleSubs.delete(fn) },
    () => currentTitle,
  )
}

/** Scroll distance over which the big title tucks away. */
export const TITLE_TUCK = [0, 96]
