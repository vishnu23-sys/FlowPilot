import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { flushSync } from 'react-dom'
import { useMediaQuery } from './useMediaQuery'

export const ACCENTS = ['lime', 'vermilion', 'teal']
export const STORAGE_KEY = 'fp:prefs'

export const DEFAULT_PREFS = {
  theme: 'system', // 'system' | 'light' | 'dark'
  accent: 'lime',
  reduceMotion: 'system', // 'system' | 'on'
  sidebar: 'expanded', // 'expanded' | 'rail'
}

export function loadPrefs(storage = window.localStorage) {
  try {
    const saved = JSON.parse(storage.getItem(STORAGE_KEY) || '{}')
    const prefs = { ...DEFAULT_PREFS, ...saved }
    if (!ACCENTS.includes(prefs.accent)) prefs.accent = DEFAULT_PREFS.accent
    if (!['system', 'light', 'dark'].includes(prefs.theme)) prefs.theme = DEFAULT_PREFS.theme
    return prefs
  } catch {
    return { ...DEFAULT_PREFS }
  }
}

export function savePrefs(prefs, storage = window.localStorage) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    // Storage can be unavailable (private mode); preferences then last for the session only.
  }
}

export function resolveTheme(theme, systemPrefersLight) {
  if (theme === 'light' || theme === 'dark') return theme
  return systemPrefersLight ? 'light' : 'dark'
}

const PreferencesContext = createContext(null)

export function PreferencesProvider({ children }) {
  const [prefs, setPrefs] = useState(loadPrefs)
  const systemLight = useMediaQuery('(prefers-color-scheme: light)')
  const systemReduce = useMediaQuery('(prefers-reduced-motion: reduce)')

  const resolvedTheme = resolveTheme(prefs.theme, systemLight)
  const reduceMotion = prefs.reduceMotion === 'on' || systemReduce

  // Layout effect so the attribute is set inside the View Transition's update callback.
  useLayoutEffect(() => {
    const root = document.documentElement
    root.dataset.theme = resolvedTheme
    root.dataset.accent = prefs.accent
    root.dataset.reduceMotion = String(reduceMotion)
  }, [resolvedTheme, prefs.accent, reduceMotion])

  useEffect(() => savePrefs(prefs), [prefs])

  const update = useCallback((patch) => setPrefs((p) => ({ ...p, ...patch })), [])

  /**
   * Change theme with a circular reveal from `origin` ({x, y}) where supported,
   * otherwise a short colour crossfade.
   */
  const setTheme = useCallback((theme, origin) => {
    const apply = () => flushSync(() => setPrefs((p) => ({ ...p, theme })))
    const root = document.documentElement
    if (!document.startViewTransition || reduceMotion || !origin) {
      root.classList.add('theme-fading')
      apply()
      window.setTimeout(() => root.classList.remove('theme-fading'), 320)
      return
    }
    const radius = Math.hypot(Math.max(origin.x, innerWidth - origin.x), Math.max(origin.y, innerHeight - origin.y))
    const transition = document.startViewTransition(apply)
    transition.ready.then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${origin.x}px ${origin.y}px)`, `circle(${radius}px at ${origin.x}px ${origin.y}px)`] },
        { duration: 520, easing: 'cubic-bezier(.2,.9,.3,1)', pseudoElement: '::view-transition-new(root)' },
      )
    })
  }, [reduceMotion])

  const setAccent = useCallback((accent) => {
    const root = document.documentElement
    root.classList.add('theme-fading')
    setPrefs((p) => ({ ...p, accent }))
    window.setTimeout(() => root.classList.remove('theme-fading'), 320)
  }, [])

  const value = useMemo(() => ({
    prefs, update, setTheme, setAccent, resolvedTheme, reduceMotion,
  }), [prefs, update, setTheme, setAccent, resolvedTheme, reduceMotion])

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext)
  if (!ctx) throw new Error('usePreferences must be used inside PreferencesProvider')
  return ctx
}
