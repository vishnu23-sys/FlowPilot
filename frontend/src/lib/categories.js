import {
  UtensilsCrossed, Car, ShoppingBag, Clapperboard, Receipt, HeartPulse,
  GraduationCap, Plane, LineChart, Shapes, Briefcase, Laptop, Building2,
  TrendingUp, Home, Gift, RotateCcw, CircleDollarSign,
} from 'lucide-react'

/** One source of truth for category colour, icon and label across pills, charts and forms. */
export const CATEGORIES = [
  { id: 'Food', token: 'food', icon: UtensilsCrossed },
  { id: 'Transport', token: 'transport', icon: Car },
  { id: 'Shopping', token: 'shopping', icon: ShoppingBag },
  { id: 'Entertainment', token: 'entertainment', icon: Clapperboard },
  { id: 'Bills', token: 'bills', icon: Receipt },
  { id: 'Health', token: 'health', icon: HeartPulse },
  { id: 'Education', token: 'education', icon: GraduationCap },
  { id: 'Travel', token: 'travel', icon: Plane },
  { id: 'Investments', token: 'investments', icon: LineChart },
  { id: 'Others', token: 'others', icon: Shapes },
]

const BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]))

export function category(id) {
  return BY_ID[id] || BY_ID.Others
}

/** CSS colour for a category, usable in SVG fill/stroke and inline styles. */
export function categoryColor(id, alpha = 1) {
  const { token } = category(id)
  return alpha === 1 ? `rgb(var(--cat-${token}))` : `rgb(var(--cat-${token}) / ${alpha})`
}

export const PAYMENT_METHODS = ['UPI', 'Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Other']

export const INCOME_SOURCES = [
  { id: 'Salary', token: 'investments', icon: Briefcase },
  { id: 'Freelance', token: 'transport', icon: Laptop },
  { id: 'Business', token: 'entertainment', icon: Building2 },
  { id: 'Investments', token: 'health', icon: TrendingUp },
  { id: 'Rental', token: 'education', icon: Home },
  { id: 'Gift', token: 'shopping', icon: Gift },
  { id: 'Refund', token: 'food', icon: RotateCcw },
  { id: 'Other', token: 'others', icon: CircleDollarSign },
]

const SOURCE_BY_ID = Object.fromEntries(INCOME_SOURCES.map((s) => [s.id, s]))

export function incomeSource(id) {
  return SOURCE_BY_ID[id] || SOURCE_BY_ID.Other
}

export function sourceColor(id, alpha = 1) {
  const { token } = incomeSource(id)
  return alpha === 1 ? `rgb(var(--cat-${token}))` : `rgb(var(--cat-${token}) / ${alpha})`
}

export const GOAL_COLORS = {
  accent: 'rgb(var(--accent))',
  amber: 'rgb(var(--cat-food))',
  blue: 'rgb(var(--cat-transport))',
  violet: 'rgb(var(--cat-entertainment))',
  pink: 'rgb(var(--cat-shopping))',
  teal: 'rgb(var(--cat-education))',
}
