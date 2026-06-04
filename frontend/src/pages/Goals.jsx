import { useState, useEffect } from 'react'
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import { Calculator, TrendingUp, AlertCircle } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'
import { SkeletonBlock } from '../components/ui/Skeleton'
import apiClient from '../api/apiClient'
import { useAuth } from '../context/AuthContext'

const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: '#0c1325',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px',
    color: '#f1f5f9',
    fontSize: '12px',
  },
  itemStyle: { color: '#f1f5f9' },
}

export default function Goals() {
  const { user } = useAuth()
  const currency = user?.currency || 'USD'

  const [params, setParams] = useState({ reduce_spending_pct: 0, extra_savings: 0, cancel_subscription_id: '' })
  const [subs, setSubs]         = useState([])
  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading]   = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)

  const fetchSubs = () => apiClient.get('/api/subscriptions').then(r => setSubs(r.data.subscriptions.filter(s => s.is_active)))

  const runProjection = async (p = params) => {
    setLoading(true)
    try {
      const q = new URLSearchParams()
      if (Number(p.reduce_spending_pct) > 0) q.set('reduce_spending_pct', p.reduce_spending_pct)
      if (Number(p.extra_savings) > 0) q.set('extra_savings', p.extra_savings)
      if (p.cancel_subscription_id) q.set('cancel_subscription_id', p.cancel_subscription_id)
      const r = await apiClient.get(`/api/predictions?${q}`)
      setPrediction(r.data)
    } finally {
      setLoading(false)
      setInitialLoad(false)
    }
  }

  useEffect(() => {
    fetchSubs()
    runProjection()
  }, [])

  const handleChange = (field, value) => setParams(p => ({ ...p, [field]: value }))

  const netColor = prediction?.monthly_net_savings >= 0 ? 'text-emerald-400' : 'text-red-400'

  const hasIncome = user?.monthly_income != null && user.monthly_income > 0

  return (
    <AppLayout>
      <div className="mb-7">
        <h1 className="text-xl font-semibold text-white">Goals & Predictions</h1>
        <p className="text-sm text-slate-600 mt-0.5">Simulate changes and project your financial future</p>
      </div>

      {!hasIncome && (
        <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm px-4 py-3 rounded-xl mb-5">
          <AlertCircle size={15} className="shrink-0" />
          Set your monthly income in{' '}
          <a href="/settings" className="underline hover:text-amber-300">Settings</a>
          {' '}to unlock accurate savings projections and debt payoff timelines.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Controls */}
        <Card delay={0.1} className="lg:col-span-1 h-fit">
          <div className="flex items-center gap-2 mb-5">
            <Calculator size={15} className="text-blue-400" />
            <p className="text-sm font-medium text-slate-300">Simulation controls</p>
          </div>

          <div className="space-y-5">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs text-slate-500">Reduce spending by</label>
                <span className="text-xs font-semibold text-blue-400">{params.reduce_spending_pct}%</span>
              </div>
              <input
                type="range" min="0" max="50" step="5"
                value={params.reduce_spending_pct}
                onChange={e => handleChange('reduce_spending_pct', Number(e.target.value))}
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-[10px] text-slate-700 mt-1">
                <span>0%</span><span>50%</span>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Extra monthly savings ({currency})</label>
              <Input
                type="number" min="0" step="10"
                placeholder="e.g. 200"
                value={params.extra_savings || ''}
                onChange={e => handleChange('extra_savings', Number(e.target.value))}
              />
            </div>

            {subs.length > 0 && (
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Cancel a subscription</label>
                <Select
                  value={params.cancel_subscription_id}
                  onChange={e => handleChange('cancel_subscription_id', e.target.value)}
                >
                  <option value="">— None —</option>
                  {subs.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({currency} {s.amount}/{s.billing_cycle === 'monthly' ? 'mo' : 'yr'})
                    </option>
                  ))}
                </Select>
              </div>
            )}

            <Button onClick={() => runProjection()} disabled={loading} className="w-full">
              {loading ? 'Calculating...' : 'Run Projection'}
            </Button>
          </div>

          {prediction && (
            <div className="mt-5 pt-5 border-t border-white/[0.06] space-y-2">
              <p className="text-xs text-slate-500">Projected monthly net savings</p>
              <p className={`text-2xl font-bold ${netColor}`}>
                {currency} {Math.abs(prediction.monthly_net_savings).toFixed(0)}
                <span className="text-sm font-normal text-slate-500 ml-1">/mo</span>
              </p>
              {prediction.monthly_net_savings < 0 && (
                <p className="text-xs text-red-400 flex gap-1.5 items-start">
                  <AlertCircle size={12} className="shrink-0 mt-0.5" />
                  Spending exceeds income. Adjust the controls to find a path to positive savings.
                </p>
              )}
              <p className="text-xs text-slate-600">
                Based on avg {currency} {prediction.base_monthly_expenses?.toFixed(0)}/mo expenses
              </p>
            </div>
          )}
        </Card>

        {/* Results */}
        <div className="lg:col-span-2 space-y-5">
          {/* Savings projection chart */}
          {initialLoad ? <SkeletonBlock className="h-72" /> : prediction && (
            <Card delay={0.15}>
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp size={14} className="text-emerald-400" />
                <p className="text-sm font-medium text-slate-400">12-month savings projection</p>
              </div>
              <ResponsiveContainer width="100%" height={230}>
                <AreaChart data={prediction.savings_projection} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <defs>
                    <linearGradient id="gradProj" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={prediction.monthly_net_savings >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={prediction.monthly_net_savings >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" stroke="#334155" tick={{ fill: '#475569', fontSize: 10 }} interval={1} />
                  <YAxis stroke="#334155" tick={{ fill: '#475569', fontSize: 11 }} tickFormatter={v => `${currency}${v}`} width={65} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [`${currency} ${Number(v).toFixed(0)}`, 'Cumulative savings']} />
                  <Area
                    type="monotone" dataKey="savings"
                    stroke={prediction.monthly_net_savings >= 0 ? '#10b981' : '#ef4444'}
                    fill="url(#gradProj)" strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Debt payoff */}
          {!initialLoad && prediction?.debt_payoff && (
            <Card delay={0.2}>
              <p className="text-sm font-medium text-slate-400 mb-4">Debt payoff timeline</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="glass rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-1">Total debt</p>
                  <p className="text-xl font-bold text-red-400">{currency} {prediction.debt_payoff.total_debt.toLocaleString()}</p>
                </div>
                {prediction.debt_payoff.months_to_payoff ? (
                  <>
                    <div className="glass rounded-xl p-4">
                      <p className="text-xs text-slate-500 mb-1">Months to clear</p>
                      <p className="text-xl font-bold text-white">{prediction.debt_payoff.months_to_payoff}</p>
                    </div>
                    <div className="glass rounded-xl p-4">
                      <p className="text-xs text-slate-500 mb-1">Payoff date</p>
                      <p className="text-lg font-semibold text-emerald-400">{prediction.debt_payoff.payoff_date}</p>
                    </div>
                    <div className="glass rounded-xl p-4">
                      <p className="text-xs text-slate-500 mb-1">Monthly payment</p>
                      <p className="text-lg font-semibold text-white">{currency} {prediction.debt_payoff.monthly_payment.toFixed(0)}</p>
                    </div>
                  </>
                ) : (
                  <div className="glass rounded-xl p-4 col-span-2">
                    <p className="text-sm text-amber-400 flex gap-2">
                      <AlertCircle size={15} className="shrink-0 mt-0.5" />
                      Can't calculate payoff — net savings is negative. Reduce expenses or increase income.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {!initialLoad && !prediction?.debt_payoff && (
            <Card delay={0.2} className="flex items-center justify-center py-8 text-center">
              <p className="text-slate-600 text-sm">No outstanding debts — great position to be in!</p>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
