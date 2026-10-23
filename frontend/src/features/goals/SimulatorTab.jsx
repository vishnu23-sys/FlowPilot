import { useEffect, useMemo, useState } from 'react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { Link } from 'react-router-dom'
import Panel from '../../components/ui/Panel'
import RollingNumber from '../../components/ui/RollingNumber'
import { Slider } from '../../components/ui/Controls'
import { MoneyInput, Select } from '../../components/ui/Input'
import { Skeleton } from '../../components/ui/Skeleton'
import { ErrorState } from '../../components/ui/States'
import { axisProps, gridProps, makeTooltip, AreaGradient, chartAnimation } from '../../components/charts/chartTheme'
import { usePredictions, useSubscriptions } from '../../api/queries'
import { currencySymbol, formatCompact, formatMoney } from '../../lib/format'
import Reveal from '../../components/charts/Reveal'

function useDebounced(value, ms) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms)
    return () => clearTimeout(id)
  }, [value, ms])
  return v
}

export default function SimulatorTab({ currency }) {
  const [params, setParams] = useState({ reduce_spending_pct: 0, extra_savings: 0, cancel_subscription_id: '' })
  const debounced = useDebounced(params, 250)
  const prediction = usePredictions(debounced)
  const subs = useSubscriptions()
  const p = prediction.data
  const Tip = useMemo(() => makeTooltip({
    format: (v) => formatMoney(v, currency),
    labels: { savings: 'With changes', baseline: 'As things are' },
    dashed: ['baseline'],
  }), [currency])

  const final = p?.savings_projection?.at(-1)
  const gain = final ? final.savings - final.baseline : 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
      <Panel title="What if you…" bodyClassName="space-y-6">
        <div>
          <div className="flex justify-between text-sm mb-3">
            <label htmlFor="reduce">Spent less each month</label>
            <span className="num text-accent">{params.reduce_spending_pct}%</span>
          </div>
          <Slider value={params.reduce_spending_pct} onValueChange={(v) => setParams((s) => ({ ...s, reduce_spending_pct: v }))} max={50} label="Spend less by percent" />
        </div>
        <div>
          <label htmlFor="extra" className="block text-sm mb-2">Saved extra each month</label>
          <MoneyInput id="extra" symbol={currencySymbol(currency).trim()} value={params.extra_savings || ''} placeholder="0"
            onChange={(e) => setParams((s) => ({ ...s, extra_savings: Math.max(0, Number(e.target.value) || 0) }))} />
        </div>
        <div>
          <label htmlFor="cancel" className="block text-sm mb-2">Cancelled a subscription</label>
          <Select id="cancel" value={params.cancel_subscription_id}
            onChange={(e) => setParams((s) => ({ ...s, cancel_subscription_id: e.target.value }))}>
            <option value="">Keep them all</option>
            {(subs.data || []).filter((s) => s.is_active).map((s) => (
              <option key={s.id} value={s.id}>{s.name}, {formatMoney(s.amount, currency)}/{s.billing_cycle === 'yearly' ? 'yr' : 'mo'}</option>
            ))}
          </Select>
        </div>
        {p && (
          <dl className="space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Monthly income</dt><dd className="num">{formatMoney(p.monthly_income, currency)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Typical monthly spend</dt><dd className="num">{formatMoney(p.base_monthly_expenses, currency)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Kept each month</dt>
              <dd className={`num ${p.monthly_net_savings < 0 ? 'text-danger' : 'text-fg'}`}>{formatMoney(p.monthly_net_savings, currency)}</dd></div>
          </dl>
        )}
      </Panel>

      <div className="space-y-4 min-w-0">
        {prediction.isError && !p ? <Panel><ErrorState error={prediction.error} onRetry={() => prediction.refetch()} /></Panel> : !p ? <Skeleton className="h-[420px]" /> : (
          <>
            <Panel>
              <p className="text-sm text-muted">In 12 months you'd have</p>
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mt-2">
                <span className={`serif text-[56px] leading-none ${final.savings < 0 ? 'text-danger' : ''}`}>
                  <RollingNumber value={formatMoney(final.savings, currency, { decimals: 0 })} />
                </span>
                {gain > 0.5 && <span className="text-sm text-success num">+{formatMoney(gain, currency)} from these changes</span>}
              </div>
              {p.monthly_income === 0 && (
                <p className="text-sm text-warning mt-3">Projections assume no income. <Link to="/income" className="underline underline-offset-2">Log income</Link> for a real picture.</p>
              )}
              <Reveal className="h-[260px] mt-4 -ml-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={p.savings_projection} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <defs><AreaGradient id="sim-fill" color="rgb(var(--accent))" /></defs>
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="month" {...axisProps} tickFormatter={(m) => m.split(' ')[0]} interval="preserveStartEnd" minTickGap={20} />
                    <YAxis {...axisProps} width={56} tickFormatter={(v) => formatCompact(v, currency)} />
                    <Tooltip content={<Tip />} />
                    <Area type="monotone" dataKey="baseline" stroke="rgb(var(--muted))" strokeDasharray="4 4" fill="none" strokeWidth={1.5} {...chartAnimation} />
                    <Area type="monotone" dataKey="savings" stroke="rgb(var(--accent))" fill="url(#sim-fill)" strokeWidth={2} {...chartAnimation} />
                  </AreaChart>
                </ResponsiveContainer>
              </Reveal>
            </Panel>
            {p.debt_payoff && (
              <Panel title="Paying off what you owe">
                <div className="flex flex-wrap gap-8">
                  <div><p className="text-xs text-muted">You owe</p><p className="serif text-[32px] leading-none mt-1">{formatMoney(p.debt_payoff.total_debt, currency)}</p></div>
                  <div><p className="text-xs text-muted">Clear by</p><p className="serif text-[32px] leading-none mt-1">{p.debt_payoff.payoff_date || 'Not at this rate'}</p></div>
                  {p.debt_payoff.months_to_payoff && (
                    <div><p className="text-xs text-muted">That's</p><p className="serif text-[32px] leading-none mt-1">{p.debt_payoff.months_to_payoff} {p.debt_payoff.months_to_payoff === 1 ? 'month' : 'months'}</p></div>
                  )}
                </div>
              </Panel>
            )}
          </>
        )}
      </div>
    </div>
  )
}
