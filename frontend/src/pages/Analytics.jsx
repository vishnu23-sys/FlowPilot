import { useState, useEffect } from 'react'
import {
  ResponsiveContainer, PieChart, Pie, Cell,
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import AppLayout from '../components/AppLayout'
import Card from '../components/ui/Card'
import { SkeletonBlock } from '../components/ui/Skeleton'
import apiClient from '../api/apiClient'
import { useAuth } from '../context/AuthContext'
import { CATEGORY_COLORS } from '../constants'

const RANGES = ['weekly', 'monthly', 'yearly']

const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: '#0c1325',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px',
    color: '#f1f5f9',
    fontSize: '12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  },
  itemStyle: { color: '#f1f5f9' },
}

const AXIS_STYLE = {
  stroke: '#334155',
  tick: { fill: '#475569', fontSize: 11 },
}

export default function Analytics() {
  const { user } = useAuth()
  const currency = user?.currency || 'USD'
  const [range, setRange] = useState('monthly')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    apiClient.get(`/api/analytics?range=${range}`)
      .then(r => setData(r.data))
      .finally(() => setLoading(false))
  }, [range])

  const fmt = v => `${currency} ${Number(v).toFixed(0)}`

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-xl font-semibold text-white">Analytics</h1>
          <p className="text-sm text-slate-600 mt-0.5">Visualize your spending patterns</p>
        </div>

        {/* Range filter */}
        <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
          {RANGES.map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-all ${
                range === r
                  ? 'bg-blue-600 text-white shadow-glow-blue'
                  : 'text-slate-500 hover:text-slate-200'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Category breakdown pie */}
        {loading ? <SkeletonBlock className="h-72" /> : (
          <Card delay={0.1}>
            <p className="text-sm font-medium text-slate-400 mb-5">Spending by category</p>
            {!data?.spending_by_category?.length ? (
              <div className="h-52 flex items-center justify-center">
                <p className="text-slate-600 text-sm">No data for this period</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie data={data.spending_by_category} dataKey="total" nameKey="category" cx="50%" cy="50%" innerRadius={55} outerRadius={85} strokeWidth={0} paddingAngle={2}>
                    {data.spending_by_category.map((_, i) => <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />)}
                  </Pie>
                  <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [`${currency} ${Number(v).toFixed(2)}`, '']} />
                  <Legend wrapperStyle={{ color: '#64748b', fontSize: '11px', paddingTop: '12px' }} iconType="circle" iconSize={7} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>
        )}

        {/* Spending trend line */}
        {loading ? <SkeletonBlock className="h-72" /> : (
          <Card delay={0.15}>
            <p className="text-sm font-medium text-slate-400 mb-5">Spending trend</p>
            {!data?.trend?.length ? (
              <div className="h-52 flex items-center justify-center">
                <p className="text-slate-600 text-sm">No data for this period</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={230}>
                <LineChart data={data.trend} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="period" {...AXIS_STYLE} />
                  <YAxis {...AXIS_STYLE} tickFormatter={v => `${currency}${v}`} width={60} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [fmt(v), 'Spent']} />
                  <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>
        )}
      </div>

      {/* Savings trend area */}
      {data?.savings_trend?.length > 0 && !loading && (
        <Card delay={0.2}>
          <p className="text-sm font-medium text-slate-400 mb-5">Income vs expenses vs savings</p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data.savings_trend} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradSavings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="period" {...AXIS_STYLE} />
              <YAxis {...AXIS_STYLE} tickFormatter={v => `${currency}${v}`} width={60} />
              <Tooltip {...TOOLTIP_STYLE} formatter={(v, name) => [fmt(v), name.charAt(0).toUpperCase() + name.slice(1)]} />
              <Legend wrapperStyle={{ color: '#64748b', fontSize: '11px' }} />
              <Area type="monotone" dataKey="income"   stroke="#3b82f6" fill="url(#gradIncome)"   strokeWidth={2} />
              <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="url(#gradExpenses)" strokeWidth={2} />
              <Area type="monotone" dataKey="savings"  stroke="#10b981" fill="url(#gradSavings)"  strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}

      {data?.savings_trend?.length === 0 && !loading && (
        <Card delay={0.2} className="text-center py-6">
          <p className="text-slate-500 text-sm">Set your monthly income in your profile to see the savings trend chart.</p>
        </Card>
      )}
    </AppLayout>
  )
}
