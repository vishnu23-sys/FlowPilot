import { LayoutDashboard, Receipt, Banknote, PiggyBank, Repeat, HandCoins, Target, ChartNoAxesColumn, Settings } from 'lucide-react'

/** Sidebar order also defines page-transition direction and the "g <key>" shortcuts. */
export const NAV = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard, key: 'd' },
  { to: '/expenses', label: 'Expenses', icon: Receipt, key: 'e' },
  { to: '/income', label: 'Income', icon: Banknote, key: 'i' },
  { to: '/budgets', label: 'Budgets', icon: PiggyBank, key: 'b' },
  { to: '/subscriptions', label: 'Subscriptions', icon: Repeat, key: 's' },
  { to: '/debts', label: 'Debts', icon: HandCoins, key: 'o' },
  { to: '/goals', label: 'Goals', icon: Target, key: 'g' },
  { to: '/analytics', label: 'Analytics', icon: ChartNoAxesColumn, key: 'a' },
]

export const SETTINGS_NAV = { to: '/settings', label: 'Settings', icon: Settings, key: ',' }

export const ALL_NAV = [...NAV, SETTINGS_NAV]

export function navIndex(pathname) {
  const i = ALL_NAV.findIndex((n) => pathname.startsWith(n.to))
  return i === -1 ? 0 : i
}

export function navItem(pathname) {
  return ALL_NAV.find((n) => pathname.startsWith(n.to)) || NAV[0]
}
