import { describe, expect, it } from 'vitest'
import { filterExpenses, groupByDay, presetRange, readFilters, sortExpenses, summarize, writeFilters } from './expenses/filters'
import { monthlyCost, renewalCalendar, renewalsInMonth, upcomingDates } from './subscriptions/schedule'

const NOW = new Date(2026, 9, 14) // 14 Oct 2026

const EXPENSES = [
  { id: 1, amount: 640, category: 'Food', date: '2026-10-14', description: 'Swiggy', payment_method: 'UPI' },
  { id: 2, amount: 8760, category: 'Travel', date: '2026-10-14', description: 'IndiGo', payment_method: 'UPI' },
  { id: 3, amount: 1000, category: 'Bills', date: '2026-10-12', description: 'Airtel Fiber', payment_method: 'Debit Card' },
  { id: 4, amount: 250, category: 'Food', date: '2026-09-20', description: 'Blue Tokai', payment_method: 'Cash' },
  { id: 5, amount: 99, category: 'Food', date: '2026-07-01', description: 'Snack', payment_method: 'Cash' },
]

describe('expense filters', () => {
  it('filters by search text across description, category, method and amount', () => {
    expect(filterExpenses(EXPENSES, { q: 'swig' }, NOW).map((e) => e.id)).toEqual([1])
    expect(filterExpenses(EXPENSES, { q: 'cash' }, NOW).map((e) => e.id)).toEqual([4, 5])
    expect(filterExpenses(EXPENSES, { q: '8760' }, NOW).map((e) => e.id)).toEqual([2])
  })

  it('filters by categories and date presets', () => {
    expect(filterExpenses(EXPENSES, { categories: ['Food'] }, NOW).map((e) => e.id)).toEqual([1, 4, 5])
    expect(filterExpenses(EXPENSES, { preset: 'month' }, NOW).map((e) => e.id)).toEqual([1, 2, 3])
    expect(filterExpenses(EXPENSES, { preset: 'last-month' }, NOW).map((e) => e.id)).toEqual([4])
    expect(filterExpenses(EXPENSES, { preset: '30d', categories: ['Food'] }, NOW).map((e) => e.id)).toEqual([1, 4])
  })

  it('computes preset ranges', () => {
    expect(presetRange('month', NOW)).toEqual(['2026-10-01', '2026-10-14'])
    expect(presetRange('last-month', NOW)).toEqual(['2026-09-01', '2026-09-30'])
    expect(presetRange('30d', NOW)).toEqual(['2026-09-15', '2026-10-14'])
    expect(presetRange('all', NOW)).toBeNull()
  })

  it('sorts with a stable tiebreak', () => {
    expect(sortExpenses(EXPENSES, 'date-desc').map((e) => e.id)).toEqual([2, 1, 3, 4, 5])
    expect(sortExpenses(EXPENSES, 'amount-desc').map((e) => e.id)).toEqual([2, 3, 1, 4, 5])
    expect(sortExpenses(EXPENSES, 'amount-asc')[0].id).toBe(5)
  })

  it('groups by day with subtotals and summarises', () => {
    const groups = groupByDay(sortExpenses(EXPENSES, 'date-desc'))
    expect(groups.map((g) => [g.date, g.total, g.items.length])).toEqual([
      ['2026-10-14', 9400, 2], ['2026-10-12', 1000, 1], ['2026-09-20', 250, 1], ['2026-07-01', 99, 1],
    ])
    expect(summarize(EXPENSES.slice(0, 2))).toEqual({ count: 2, total: 9400, average: 4700 })
  })

  it('round-trips filters through the URL', () => {
    const state = { q: 'tea', categories: ['Food', 'Bills'], preset: '30d', sort: 'amount-asc' }
    expect(readFilters(writeFilters(state))).toEqual(state)
    expect(writeFilters({ q: '', categories: [], preset: 'all', sort: 'date-desc' }).toString()).toBe('')
  })
})

describe('subscription schedule', () => {
  const monthly = { id: 1, name: 'Netflix', amount: 649, billing_cycle: 'monthly', next_renewal_date: '2026-10-31', is_active: true }
  const yearly = { id: 2, name: 'Prime', amount: 1499, billing_cycle: 'yearly', next_renewal_date: '2026-11-27', is_active: true }

  it('normalises cost to a month', () => {
    expect(monthlyCost(monthly)).toBe(649)
    expect(monthlyCost(yearly)).toBeCloseTo(124.92, 2)
  })

  it('places monthly renewals each month and clamps short months', () => {
    expect(renewalsInMonth(monthly, 2026, 9)).toEqual(['2026-10-31'])
    expect(renewalsInMonth(monthly, 2026, 8)).toEqual([]) // before the next renewal
    expect(renewalsInMonth(monthly, 2027, 1)).toEqual(['2027-02-28'])
    expect(renewalsInMonth({ ...monthly, is_active: false }, 2026, 9)).toEqual([])
  })

  it('places yearly renewals once a year', () => {
    expect(renewalsInMonth(yearly, 2026, 10)).toEqual(['2026-11-27'])
    expect(renewalsInMonth(yearly, 2026, 11)).toEqual([])
    expect(renewalsInMonth(yearly, 2027, 10)).toEqual(['2027-11-27'])
  })

  it('builds a calendar map and upcoming dates', () => {
    expect(Object.keys(renewalCalendar([monthly, yearly], 2026, 10))).toEqual(['2026-11-30', '2026-11-27'])
    expect(upcomingDates(monthly, 3)).toEqual(['2026-10-31', '2026-11-30', '2026-12-31'])
    expect(upcomingDates(yearly, 2)).toEqual(['2026-11-27', '2027-11-27'])
  })
})
