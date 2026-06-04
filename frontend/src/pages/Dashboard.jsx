import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingDown, Wallet, Tag, Lightbulb, AlertTriangle, CheckCircle, Info, Plus, Sparkles, AlertCircle } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import StatCard from '../components/ui/StatCard'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import ScoreGauge from '../components/ui/ScoreGauge'
import { SkeletonCard, SkeletonBlock } from '../components/ui/Skeleton'
import apiClient from '../api/apiClient'
import { useAuth } from '../context/AuthContext'
import { CATEGORY_COLORS, formatAmount, getCurrencySymbol } from '../constants'

const CHART_TOOLTIP = {
  contentStyle: { backgroundColor: '#0c1325', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#f1f5f9', fontSize: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' },
  itemStyle: { color: '#f1f5f9' },
}

const INSIGHT_STYLES = {
  positive: { icon: CheckCircle,   border: 'border-emerald-500/30', bg: 'bg-emerald-500/5', icon_color: 'text-emerald-400' },
  warning:  { icon: AlertTriangle, border: 'border-amber-500/30',   bg: 'bg-amber-500/5',   icon_color: 'text-amber-400'   },
  neutral:  { icon: Info,          border: 'border-blue-500/20',    bg: 'bg-blue-500/5',    icon_color: 'text-blue-400'    },
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const currency  = user?.currency || 'USD'
  const symb      = getCurrencySymbol(currency)

  const [summary,     setSummary]     = useState(null)
  const [healthData,  setHealthData]  = useState(null)
  const [insights,    setInsights]    = useState([])
  const [loadingSummary, setLoadingSummary] = useState(true)
  const [loadingHealth,  setLoadingHealth]  = useState(true)

  useEffect(() => {
    apiClient.get('/api/expenses/summary').then(r => setSummary(r.data)).finally(() => setLoadingSummary(false))
    apiClient.get('/api/health-score').then(r => setHealthData(r.data)).finally(() => setLoadingHealth(false))
    apiClient.get('/api/insights').then(r => setInsights(r.data.insights))
  }, [])

  const hasIncome    = user?.monthly_income != null && user.monthly_income > 0
  const noExpenses   = !loadingSummary && summary && summary.monthly_total === 0 && !summary.by_category?.length

  const budgetRemaining = hasIncome ? user.monthly_income - (summary?.monthly_total || 0) : null
  const topCategory     = summary?.by_category?.length ? summary.by_category.reduce((a, b) => b.total > a.total ? b : a).category : null

  return (
    <AppLayout>
      <div className="mb-7">
        <h1 className="text-xl font-semibold text-white">Dashboard</h1>
        <p className="text-sm text-slate-600 mt-0.5">Your financial overview for this month</p>
      </div>

      {/* Income not set banner */}
      {!hasIncome && !loadingSummary && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm px-4 py-3 rounded-xl mb-5">
          <AlertCircle size={15} className="shrink-0" />
          <span>Set your monthly income in <button onClick={() => navigate('/settings')} className="underline hover:text-amber-200">Settings</button> to unlock your health score, budget tracking, and savings predictions.</span>
        </motion.div>
      )}

      {/* Welcome empty state */}
      {noExpenses ? (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="glass rounded-2xl p-12 text-center mb-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center mx-auto mb-4">
            <Sparkles size={26} className="text-blue-400" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">
            Welcome to FlowPilot, {user?.full_name?.split(' ')[0]}!
          </h2>
          <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
            Your dashboard is ready. Add your first expense to see insights, charts, and spending trends come to life.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button onClick={() => navigate('/expenses')}><Plus size={14} /> Add first expense</Button>
            {!hasIncome && <Button variant="ghost" onClick={() => navigate('/settings')}>Set monthly income</Button>}
          </div>
        </motion.div>
      ) : (
        <>
          {/* Stat cards with count-up */}
          {loadingSummary ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <StatCard label="Total spent this month" numericValue={summary?.monthly_total || 0} currencyCode={currency} icon={TrendingDown} gradient="from-blue-600 to-cyan-500" delay={0} />
              {budgetRemaining != null ? (
                <StatCard label="Budget remaining" numericValue={budgetRemaining} currencyCode={currency} sub={`of ${symb}${Number(user.monthly_income).toLocaleString()} income`} icon={Wallet} gradient="from-purple-600 to-pink-500" delay={0.08} />
              ) : (
                <StatCard label="Categories tracked" value={String(summary?.by_category?.length || 0)} sub="this month" icon={Tag} gradient="from-purple-600 to-pink-500" delay={0.08} />
              )}
              <StatCard label="Top category" value={topCategory || '—'} sub={`${summary?.by_category?.length || 0} categor${summary?.by_category?.length !== 1 ? 'ies' : 'y'} this month`} icon={Tag} gradient="from-emerald-600 to-teal-500" delay={0.16} />
            </div>
          )}

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            {loadingSummary ? <SkeletonBlock className="h-72" /> : (
              <Card delay={0.2}>
                <p className="text-sm font-medium text-slate-400 mb-5">Spending by category</p>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={summary.by_category} dataKey="total" nameKey="category" cx="50%" cy="50%" innerRadius={58} outerRadius={88} strokeWidth={0} paddingAngle={2}>
                      {summary.by_category.map((_, i) => <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />)}
                    </Pie>
                    <Tooltip {...CHART_TOOLTIP} formatter={(v) => [formatAmount(v, currency), '']} />
                    <Legend wrapperStyle={{ color: '#64748b', fontSize: '11px', paddingTop: '14px' }} iconType="circle" iconSize={7} />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            )}

            {loadingSummary ? <SkeletonBlock className="h-72" /> : (
              <Card delay={0.25}>
                <p className="text-sm font-medium text-slate-400 mb-4">Recent transactions</p>
                {!summary?.recent_transactions?.length ? (
                  <div className="h-52 flex flex-col items-center justify-center gap-2">
                    <Wallet size={18} className="text-slate-600" />
                    <p className="text-slate-600 text-sm">No transactions yet</p>
                  </div>
                ) : (
                  <ul className="space-y-0.5">
                    {summary.recent_transactions.map((tx, i) => (
                      <motion.li key={tx.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.06, duration: 0.25 }}
                        className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full whitespace-nowrap">{tx.category}</span>
                          <span className="text-sm text-slate-500 truncate">{tx.description || '—'}</span>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <p className="text-sm font-semibold text-white">{formatAmount(tx.amount, currency)}</p>
                          <p className="text-xs text-slate-700">{tx.date}</p>
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                )}
              </Card>
            )}
          </div>
        </>
      )}

      {/* Health score + Insights (always show) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {loadingHealth ? <SkeletonBlock className="h-72" /> : healthData && (
          <Card delay={0.3} className="flex flex-col">
            <p className="text-sm font-medium text-slate-400 mb-2">Financial Health</p>
            <ScoreGauge score={healthData.score} />
            <p className={`text-center text-sm font-semibold mt-1 mb-4 ${healthData.score >= 75 ? 'text-emerald-400' : healthData.score >= 55 ? 'text-amber-400' : 'text-red-400'}`}>
              {healthData.label}
            </p>
            <div className="space-y-2 mb-4">
              {healthData.components.map(c => (
                <div key={c.label}>
                  <div className="flex justify-between text-xs text-slate-500 mb-1"><span>{c.label}</span><span>{c.score}/{c.max}</span></div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(c.score / c.max) * 100}%` }} transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }} className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-2 mt-auto">
              {healthData.recommendations.map((r, i) => (
                <p key={i} className="text-xs text-slate-500 flex gap-2"><span className="text-blue-500 shrink-0">→</span>{r}</p>
              ))}
            </div>
          </Card>
        )}

        <Card delay={0.35} className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb size={14} className="text-amber-400" />
            <p className="text-sm font-medium text-slate-400">Insights</p>
          </div>
          {insights.length === 0 ? (
            <p className="text-slate-600 text-sm">Add more transactions to unlock insights.</p>
          ) : (
            <div className="space-y-2.5">
              {insights.map((ins, i) => {
                const style = INSIGHT_STYLES[ins.type] || INSIGHT_STYLES.neutral
                const Icon = style.icon
                return (
                  <motion.div key={i} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 + i * 0.07, duration: 0.25 }}
                    className={`flex gap-3 p-3 rounded-xl border ${style.border} ${style.bg}`}>
                    <Icon size={15} className={`${style.icon_color} shrink-0 mt-0.5`} />
                    <p className="text-sm text-slate-300 leading-relaxed">{ins.text}</p>
                  </motion.div>
                )
              })}
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  )
}
