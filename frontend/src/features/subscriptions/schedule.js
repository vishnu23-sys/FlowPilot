import { parseISODate, toISODate } from '../../lib/format'

/** Monthly-equivalent cost of a subscription. */
export function monthlyCost(sub) {
  return sub.billing_cycle === 'yearly' ? sub.amount / 12 : sub.amount
}

function clampDay(year, month, day) {
  return Math.min(day, new Date(year, month + 1, 0).getDate())
}

/**
 * Renewal dates (ISO) of an active subscription that fall inside the given month.
 * Monthly plans repeat on the same day each month from their next renewal; yearly plans once a year.
 */
export function renewalsInMonth(sub, year, month) {
  if (!sub.is_active) return []
  const next = parseISODate(sub.next_renewal_date)
  const monthStart = new Date(year, month, 1)
  const monthEnd = new Date(year, month + 1, 0)
  if (next > monthEnd) return []
  if (sub.billing_cycle === 'monthly') {
    if (next >= monthStart) return [toISODate(next)]
    return [toISODate(new Date(year, month, clampDay(year, month, next.getDate())))]
  }
  if (next.getMonth() !== month) return []
  if (next.getFullYear() > year) return []
  return [toISODate(new Date(year, month, clampDay(year, month, next.getDate())))]
}

/** Map of ISO day -> subscriptions renewing that day within the month. */
export function renewalCalendar(subs, year, month) {
  const map = {}
  for (const s of subs) {
    for (const iso of renewalsInMonth(s, year, month)) {
      ;(map[iso] ||= []).push(s)
    }
  }
  return map
}

/** The next n renewal dates for a subscription, starting at its next renewal. */
export function upcomingDates(sub, n = 3) {
  const first = parseISODate(sub.next_renewal_date)
  const dates = []
  for (let i = 0; i < n; i++) {
    const d = new Date(first)
    if (sub.billing_cycle === 'monthly') {
      d.setDate(1)
      d.setMonth(first.getMonth() + i)
      d.setDate(clampDay(d.getFullYear(), d.getMonth(), first.getDate()))
    } else {
      d.setFullYear(first.getFullYear() + i)
    }
    dates.push(toISODate(d))
  }
  return dates
}
