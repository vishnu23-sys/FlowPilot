export const CATEGORIES = [
  'Food', 'Transport', 'Shopping', 'Entertainment', 'Bills',
  'Health', 'Education', 'Travel', 'Investments', 'Others',
]

export const PAYMENT_METHODS = [
  'Cash', 'Credit Card', 'Debit Card', 'UPI', 'Bank Transfer', 'Other',
]

export const CATEGORY_COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#3b82f6', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6b7280',
]

export const CURRENCY_SYMBOLS = {
  USD: '$', EUR: '€', GBP: '£', INR: '₹',
  AUD: 'A$', CAD: 'C$', SGD: 'S$', AED: 'د.إ',
}

export function getCurrencySymbol(code) {
  return CURRENCY_SYMBOLS[code] || code || '$'
}

export function formatAmount(amount, currencyCode) {
  const symbol = getCurrencySymbol(currencyCode)
  return `${symbol}${Number(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}
