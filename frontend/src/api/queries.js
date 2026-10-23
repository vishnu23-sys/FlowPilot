import { QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from './apiClient'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (count, error) => {
        const status = error?.response?.status
        if (status && status < 500) return false
        return count < 2
      },
    },
  },
})

const get = (url) => () => apiClient.get(url).then((r) => r.data)

export const keys = {
  summary: ['summary'],
  expenses: ['expenses'],
  insights: ['insights'],
  health: ['health'],
  attention: ['attention'],
  analytics: (range) => ['analytics', range],
  debts: ['debts'],
  debtsSummary: ['debts-summary'],
  subs: ['subs'],
  subsSummary: ['subs-summary'],
  income: ['income'],
  incomeSummary: ['income-summary'],
  budgets: ['budgets'],
  goals: ['goals'],
  predictions: (params) => ['predictions', params],
}

// Every money write can move totals, insights, health, budgets and projections, so refresh all
// finance queries. Cached data stays on screen while the refetch happens.
export function invalidateFinance(qc) {
  return qc.invalidateQueries({ predicate: (q) => q.queryKey[0] !== 'me' })
}

export const useSummary = () => useQuery({ queryKey: keys.summary, queryFn: get('/api/expenses/summary') })
export const useExpenses = (options = {}) => useQuery({
  ...options,
  queryKey: keys.expenses,
  queryFn: () => apiClient.get('/api/expenses').then((r) => r.data.expenses),
})
export const useInsights = () => useQuery({
  queryKey: keys.insights,
  queryFn: () => apiClient.get('/api/insights').then((r) => r.data.insights),
})
export const useHealth = () => useQuery({ queryKey: keys.health, queryFn: get('/api/health-score') })
export const useAttention = () => useQuery({ queryKey: keys.attention, queryFn: get('/api/attention') })
export const useAnalytics = (range) => useQuery({
  queryKey: keys.analytics(range),
  queryFn: get(`/api/analytics?range=${range}`),
  placeholderData: (prev) => prev,
})
export const useDebts = () => useQuery({
  queryKey: keys.debts,
  queryFn: () => apiClient.get('/api/debts').then((r) => r.data.debts),
})
export const useDebtsSummary = () => useQuery({ queryKey: keys.debtsSummary, queryFn: get('/api/debts/summary') })
export const useSubscriptions = () => useQuery({
  queryKey: keys.subs,
  queryFn: () => apiClient.get('/api/subscriptions').then((r) => r.data.subscriptions),
})
export const useSubscriptionsSummary = () => useQuery({ queryKey: keys.subsSummary, queryFn: get('/api/subscriptions/summary') })
export const useIncome = () => useQuery({
  queryKey: keys.income,
  queryFn: () => apiClient.get('/api/income').then((r) => r.data.income),
})
export const useIncomeSummary = () => useQuery({ queryKey: keys.incomeSummary, queryFn: get('/api/income/summary') })
export const useBudgets = () => useQuery({ queryKey: keys.budgets, queryFn: get('/api/budgets') })
export const useGoals = () => useQuery({ queryKey: keys.goals, queryFn: get('/api/goals') })
export const usePredictions = (params) => useQuery({
  queryKey: keys.predictions(params),
  queryFn: () => {
    const q = new URLSearchParams()
    if (Number(params.reduce_spending_pct) > 0) q.set('reduce_spending_pct', params.reduce_spending_pct)
    if (Number(params.extra_savings) > 0) q.set('extra_savings', params.extra_savings)
    if (params.cancel_subscription_id) q.set('cancel_subscription_id', params.cancel_subscription_id)
    return apiClient.get(`/api/predictions?${q}`).then((r) => r.data)
  },
  placeholderData: (prev) => prev,
})

/** Mutation that refreshes finance data afterwards. `fn` receives the variables. */
export function useFinanceMutation(fn, options = {}) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    ...options,
    onSuccess: async (...args) => {
      await options.onSuccess?.(...args)
      invalidateFinance(qc)
    },
  })
}
