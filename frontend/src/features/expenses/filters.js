import { toISODate } from '../../lib/format'

export const DATE_PRESETS = [
  { value: 'all', label: 'All time' },
  { value: 'month', label: 'This month' },
  { value: 'last-month', label: 'Last month' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
]

export const SORTS = [
  { value: 'date-desc', label: 'Newest first' },
  { value: 'date-asc', label: 'Oldest first' },
  { value: 'amount-desc', label: 'Largest first' },
  { value: 'amount-asc', label: 'Smallest first' },
]

/** Inclusive [from, to] ISO bounds for a preset, or null for all time. */
export function presetRange(preset, now = new Date()) {
  const today = toISODate(now)
  const daysAgo = (n) => {
    const d = new Date(now)
    d.setDate(d.getDate() - n)
    return toISODate(d)
  }
  switch (preset) {
    case 'month':
      return [toISODate(new Date(now.getFullYear(), now.getMonth(), 1)), today]
    case 'last-month':
      return [
        toISODate(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
        toISODate(new Date(now.getFullYear(), now.getMonth(), 0)),
      ]
    case '30d':
      return [daysAgo(29), today]
    case '90d':
      return [daysAgo(89), today]
    default:
      return null
  }
}

/** Filters: { q, categories: string[], preset }. */
export function filterExpenses(expenses, { q = '', categories = [], preset = 'all' } = {}, now = new Date()) {
  const query = q.trim().toLowerCase()
  const range = presetRange(preset, now)
  const cats = new Set(categories)
  return expenses.filter((e) => {
    if (cats.size && !cats.has(e.category)) return false
    if (range && (e.date < range[0] || e.date > range[1])) return false
    if (query) {
      const haystack = `${e.description || ''} ${e.category} ${e.payment_method || ''} ${e.amount}`.toLowerCase()
      if (!haystack.includes(query)) return false
    }
    return true
  })
}

export function sortExpenses(expenses, sort = 'date-desc') {
  const [field, dir] = sort.split('-')
  const sign = dir === 'asc' ? 1 : -1
  return [...expenses].sort((a, b) => {
    const primary = field === 'amount' ? a.amount - b.amount : a.date.localeCompare(b.date)
    return sign * (primary || a.id - b.id)
  })
}

/**
 * Groups already-sorted expenses by day: [{ date, total, items }]. Only meaningful for date sorts;
 * amount sorts render as one flat group.
 */
export function groupByDay(expenses) {
  const groups = []
  let current = null
  for (const e of expenses) {
    if (!current || current.date !== e.date) {
      current = { date: e.date, total: 0, items: [] }
      groups.push(current)
    }
    current.items.push(e)
    current.total += e.amount
  }
  return groups
}

export function summarize(expenses) {
  const total = expenses.reduce((s, e) => s + e.amount, 0)
  return { count: expenses.length, total, average: expenses.length ? total / expenses.length : 0 }
}

/** URL search params <-> filter state. */
export function readFilters(params) {
  return {
    q: params.get('q') || '',
    categories: (params.get('cat') || '').split(',').filter(Boolean),
    preset: params.get('range') || 'all',
    sort: params.get('sort') || 'date-desc',
  }
}

export function writeFilters({ q, categories, preset, sort }) {
  const p = new URLSearchParams()
  if (q) p.set('q', q)
  if (categories.length) p.set('cat', categories.join(','))
  if (preset && preset !== 'all') p.set('range', preset)
  if (sort && sort !== 'date-desc') p.set('sort', sort)
  return p
}
