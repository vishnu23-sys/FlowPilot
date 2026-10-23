export const CURRENCY_SYMBOLS = {
  USD: '$', EUR: '€', GBP: '£', INR: '₹',
  AUD: 'A$', CAD: 'C$', SGD: 'S$', AED: 'AED ',
}

export const CURRENCIES = Object.keys(CURRENCY_SYMBOLS)

export function currencySymbol(code) {
  return CURRENCY_SYMBOLS[code] ?? (code ? `${code} ` : '$')
}

const LOCALES = { INR: 'en-IN' }

function locale(code) {
  return LOCALES[code] || 'en-US'
}

/** ₹42,180 · $1,204.50 · −₹640. `decimals` defaults to 0 for amounts ≥ 1000, else 2. */
export function formatMoney(amount, code = 'USD', { decimals, sign = false } = {}) {
  const n = Number(amount) || 0
  const abs = Math.abs(n)
  const d = decimals ?? (abs >= 1000 || Number.isInteger(abs) ? 0 : 2)
  const body = abs.toLocaleString(locale(code), { minimumFractionDigits: d, maximumFractionDigits: d })
  const prefix = n < 0 ? '−' : sign && n > 0 ? '+' : ''
  return `${prefix}${currencySymbol(code)}${body}`
}

/** Compact form for axes: ₹42k, ₹1.2L (INR), $1.2M. */
export function formatCompact(amount, code = 'USD') {
  const n = Number(amount) || 0
  const abs = Math.abs(n)
  const sym = currencySymbol(code)
  const sign = n < 0 ? '−' : ''
  if (code === 'INR') {
    if (abs >= 1e7) return `${sign}${sym}${trim(abs / 1e7)}Cr`
    if (abs >= 1e5) return `${sign}${sym}${trim(abs / 1e5)}L`
  }
  if (abs >= 1e6) return `${sign}${sym}${trim(abs / 1e6)}M`
  if (abs >= 1e3) return `${sign}${sym}${trim(abs / 1e3)}k`
  return `${sign}${sym}${Math.round(abs)}`
}

function trim(n) {
  return n >= 100 ? Math.round(n).toString() : n.toFixed(1).replace(/\.0$/, '')
}

export function formatPercent(value, { sign = false, decimals = 0 } = {}) {
  if (value == null || Number.isNaN(value)) return '—'
  const prefix = sign && value > 0 ? '+' : value < 0 ? '−' : ''
  return `${prefix}${Math.abs(value).toFixed(decimals)}%`
}

export function parseISODate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function toISODate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayISO() {
  return toISODate(new Date())
}

export function daysBetween(fromISO, toISO) {
  return Math.round((parseISODate(toISO) - parseISODate(fromISO)) / 86400000)
}

/** "Today", "Yesterday", "Mon 12 Oct", or "12 Oct 2025" for other years. */
export function formatDayLabel(iso, now = new Date()) {
  const diff = daysBetween(iso, toISODate(now))
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  const date = parseISODate(iso)
  const sameYear = date.getFullYear() === now.getFullYear()
  return date.toLocaleDateString('en-GB', sameYear
    ? { weekday: 'short', day: 'numeric', month: 'short' }
    : { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatShortDate(iso) {
  return parseISODate(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function formatRelativeDays(iso, now = new Date()) {
  const diff = daysBetween(toISODate(now), iso)
  if (diff === 0) return 'today'
  if (diff === 1) return 'tomorrow'
  if (diff === -1) return 'yesterday'
  if (diff > 0) return `in ${diff} days`
  return `${-diff} days ago`
}

export function monthName(date = new Date()) {
  return date.toLocaleDateString('en-GB', { month: 'long' })
}

export function greeting(now = new Date()) {
  const h = now.getHours()
  if (h < 5) return 'Up late'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function initials(name = '') {
  return name.split(/\s+/).filter(Boolean).map((p) => p[0]).slice(0, 2).join('').toUpperCase() || '?'
}
