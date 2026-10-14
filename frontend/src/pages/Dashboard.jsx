import { motion } from 'framer-motion'
import PageHeader from '../components/ui/PageHeader'
import { ErrorState } from '../components/ui/States'
import HeroStrip from '../features/dashboard/HeroStrip'
import SpendCurve from '../features/dashboard/SpendCurve'
import { QuickActions, AttentionPanel, RecentPanel, CategoryBreakdown, BudgetsPanel, HealthPanel, InsightsPanel } from '../features/dashboard/Widgets'
import { useAttention, useBudgets, useHealth, useIncomeSummary, useInsights, useSummary } from '../api/queries'
import { useAuth, useCurrency } from '../context/AuthContext'
import { greeting, monthName } from '../lib/format'
import { usePageEntrance } from '../lib/entrance'

export default function Dashboard() {
  const { user } = useAuth()
  const currency = useCurrency()
  const entrance = usePageEntrance()
  const summary = useSummary()
  const health = useHealth()
  const incomeSummary = useIncomeSummary()
  const attention = useAttention()
  const budgets = useBudgets()
  const insights = useInsights()

  const loggedIncome = incomeSummary.data?.monthly_total
  const income = loggedIncome > 0 ? loggedIncome : user?.monthly_income || null
  const firstName = user?.full_name?.split(' ')[0]

  return (
    <motion.div {...entrance}>
      <PageHeader context={`${greeting()}, ${firstName}`} title={monthName()} />

      {summary.isError && !summary.data ? (
        <div className="rounded-panel border border-line bg-panel mb-4"><ErrorState error={summary.error} onRetry={() => summary.refetch()} /></div>
      ) : (
        <HeroStrip
          summary={summary.data}
          income={incomeSummary.isPending ? null : income}
          health={health.data}
          currency={currency}
          loading={summary.isPending}
        />
      )}

      <QuickActions />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SpendCurve summary={summary.data} currency={currency} loading={summary.isPending} />
        <AttentionPanel query={attention} />

        <RecentPanel summary={summary.data} currency={currency} loading={summary.isPending} />
        <CategoryBreakdown summary={summary.data} currency={currency} loading={summary.isPending} />

        <BudgetsPanel query={budgets} currency={currency} />
        <HealthPanel query={health} />
        <InsightsPanel query={insights} />
      </div>
    </motion.div>
  )
}
