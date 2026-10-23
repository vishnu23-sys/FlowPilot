import { useEffect, useRef } from 'react'

/** True when the event comes from somewhere the user is typing. */
export function isTypingTarget(target) {
  if (!target || !(target instanceof Element)) return false
  if (target.isContentEditable) return true
  const tag = target.tagName
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (tag === 'INPUT') {
    const type = (target.getAttribute('type') || 'text').toLowerCase()
    return !['checkbox', 'radio', 'button', 'submit', 'range'].includes(type)
  }
  return Boolean(target.closest('[cmdk-root]'))
}

/** Normalise a keyboard event to a combo string like "mod+k", "shift+?", "n". */
export function comboOf(e) {
  const parts = []
  if (e.ctrlKey || e.metaKey) parts.push('mod')
  if (e.altKey) parts.push('alt')
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
  if (e.shiftKey && key.length > 1) parts.push('shift')
  parts.push(key)
  return parts.join('+')
}

/**
 * Global shortcuts. `bindings` maps combos ("mod+k", "n", "?") and two-key sequences
 * ("g d") to handlers. Plain-key shortcuts are ignored while typing; "mod+" ones still work.
 */
export function useHotkeys(bindings, enabled = true) {
  const ref = useRef(bindings)
  ref.current = bindings
  const pending = useRef({ key: null, at: 0 })

  useEffect(() => {
    if (!enabled) return
    const onKeyDown = (e) => {
      if (e.repeat || e.isComposing) return
      const combo = comboOf(e)
      const typing = isTypingTarget(e.target)
      if (typing && !combo.startsWith('mod+')) return

      const now = Date.now()
      if (pending.current.key && now - pending.current.at < 1200) {
        const seq = `${pending.current.key} ${combo}`
        pending.current = { key: null, at: 0 }
        if (ref.current[seq]) {
          e.preventDefault()
          ref.current[seq](e)
          return
        }
      }

      if (ref.current[combo]) {
        e.preventDefault()
        ref.current[combo](e)
        return
      }
      if (Object.keys(ref.current).some((k) => k.startsWith(`${combo} `))) {
        pending.current = { key: combo, at: now }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enabled])
}
