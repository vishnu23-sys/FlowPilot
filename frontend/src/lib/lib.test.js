import { describe, expect, it } from 'vitest'
import { formatCompact, formatDayLabel, formatMoney, formatPercent, formatRelativeDays, initials } from './format'
import { checkPassword } from './password'
import { comboOf, isTypingTarget } from './hotkeys'
import { DEFAULT_PREFS, loadPrefs, resolveTheme, savePrefs, STORAGE_KEY } from './preferences'

describe('format', () => {
  it('formats money with symbol, grouping and sign', () => {
    expect(formatMoney(42180, 'INR')).toBe('₹42,180')
    expect(formatMoney(245300, 'INR')).toBe('₹2,45,300') // Indian grouping
    expect(formatMoney(12.5, 'USD')).toBe('$12.50')
    expect(formatMoney(-640, 'INR')).toBe('−₹640')
    expect(formatMoney(10, 'EUR', { sign: true })).toBe('+€10')
  })

  it('formats compact axis values per currency', () => {
    expect(formatCompact(42000, 'USD')).toBe('$42k')
    expect(formatCompact(150000, 'INR')).toBe('₹1.5L')
    expect(formatCompact(2_500_000, 'USD')).toBe('$2.5M')
    expect(formatCompact(900, 'GBP')).toBe('£900')
  })

  it('formats percents and relative days', () => {
    expect(formatPercent(12.4)).toBe('12%')
    expect(formatPercent(-3, { sign: true })).toBe('−3%')
    expect(formatPercent(null)).toBe('—')
    const now = new Date(2026, 9, 14)
    expect(formatRelativeDays('2026-10-15', now)).toBe('tomorrow')
    expect(formatRelativeDays('2026-10-20', now)).toBe('in 6 days')
    expect(formatDayLabel('2026-10-14', now)).toBe('Today')
    expect(formatDayLabel('2026-10-13', now)).toBe('Yesterday')
  })

  it('builds initials', () => {
    expect(initials('Demo Pilot')).toBe('DP')
    expect(initials('')).toBe('?')
  })
})

describe('password policy', () => {
  it('matches the backend rules', () => {
    expect(checkPassword('short').valid).toBe(false)
    expect(checkPassword('longenough!').valid).toBe(false) // no uppercase
    expect(checkPassword('Longenough1').valid).toBe(false) // no symbol
    expect(checkPassword('Longenough!').valid).toBe(true)
  })

  it('scores strength', () => {
    expect(checkPassword('').score).toBe(0)
    expect(checkPassword('Longenough!').label).toBe('Good')
    expect(checkPassword('Much-longer-pass1').label).toBe('Strong')
  })
})

describe('hotkeys', () => {
  it('ignores plain keys while typing in fields', () => {
    const input = document.createElement('input')
    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    expect(isTypingTarget(input)).toBe(true)
    expect(isTypingTarget(document.createElement('textarea'))).toBe(true)
    expect(isTypingTarget(checkbox)).toBe(false)
    expect(isTypingTarget(document.createElement('button'))).toBe(false)
  })

  it('normalises key combos', () => {
    expect(comboOf(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))).toBe('mod+k')
    expect(comboOf(new KeyboardEvent('keydown', { key: 'K', metaKey: true }))).toBe('mod+k')
    expect(comboOf(new KeyboardEvent('keydown', { key: '?', shiftKey: true }))).toBe('?')
    expect(comboOf(new KeyboardEvent('keydown', { key: 'n' }))).toBe('n')
  })
})

describe('preferences', () => {
  const memory = () => {
    const data = {}
    return { getItem: (k) => data[k] ?? null, setItem: (k, v) => { data[k] = v } }
  }

  it('round-trips and falls back to defaults on bad data', () => {
    const store = memory()
    expect(loadPrefs(store)).toEqual(DEFAULT_PREFS)
    savePrefs({ ...DEFAULT_PREFS, theme: 'light', accent: 'teal' }, store)
    expect(loadPrefs(store)).toMatchObject({ theme: 'light', accent: 'teal' })
    store.setItem(STORAGE_KEY, JSON.stringify({ accent: 'neon', theme: 'sepia' }))
    expect(loadPrefs(store)).toMatchObject({ accent: 'lime', theme: 'system' })
    store.setItem(STORAGE_KEY, '{not json')
    expect(loadPrefs(store)).toEqual(DEFAULT_PREFS)
  })

  it('resolves system theme', () => {
    expect(resolveTheme('system', true)).toBe('light')
    expect(resolveTheme('system', false)).toBe('dark')
    expect(resolveTheme('dark', true)).toBe('dark')
  })
})
