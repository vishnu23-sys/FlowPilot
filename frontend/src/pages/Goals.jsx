import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import Segmented from '../components/ui/Segmented'
import { Skeleton } from '../components/ui/Skeleton'
import { QueryView } from '../components/ui/States'
import GoalsTab from '../features/goals/GoalsTab'
import SimulatorTab from '../features/goals/SimulatorTab'
import { useGoals } from '../api/queries'
import { useCurrency } from '../context/AuthContext'
import { usePageEntrance } from '../lib/entrance'
import { useSheets } from '../lib/sheets'
import { tabContentVariants } from '../lib/motion'

const TABS = [{ value: 'goals', label: 'Savings goals' }, { value: 'simulator', label: 'What if' }]

export default function Goals() {
  const currency = useCurrency()
  const entrance = usePageEntrance()
  const { openSheet } = useSheets()
  const goals = useGoals()
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'simulator' ? 'simulator' : 'goals'
  const dir = tab === 'simulator' ? 1 : -1

  return (
    <motion.div {...entrance}>
      <PageHeader
        context="What you're saving for"
        title="Goals"
        actions={
          <>
            <Segmented label="View" options={TABS} value={tab} onChange={(t) => setParams(t === 'goals' ? {} : { tab: t }, { replace: true })} />
            {tab === 'goals' && <Button variant="primary" onClick={() => openSheet('goal')}><Plus size={14} strokeWidth={2.4} aria-hidden="true" /> New goal</Button>}
          </>
        }
      />
      <AnimatePresence mode="wait" custom={dir} initial={false}>
        <motion.div key={tab} custom={dir} variants={tabContentVariants} initial="initial" animate="animate" exit="exit">
          {tab === 'goals' ? (
            <QueryView query={goals} loading={<Skeleton className="h-[420px]" />}>
              {(data) => <GoalsTab data={data} currency={currency} />}
            </QueryView>
          ) : (
            <SimulatorTab currency={currency} />
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}
