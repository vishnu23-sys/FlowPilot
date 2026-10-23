import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import Contours from './Contours'
import Logo from '../shell/Logo'
import { usePreferences } from '../../lib/preferences'
import { ease } from '../../lib/motion'

const LINES = [
  { text: 'Food is 32% of your spending this month.', note: 'Category breakdown' },
  { text: 'Netflix renews in 2 days.', note: 'Renewal heads-up' },
  { text: 'At this pace, Transport will finish ₹1,400 over budget.', note: 'Budget pace' },
  { text: "You're 68% of the way to your MacBook.", note: 'Savings goals' },
]

/** Form on one side, a contour panel with rotating product lines on the other. */
export default function AuthLayout({ children }) {
  const { reduceMotion } = usePreferences()
  const [i, setI] = useState(0)
  useEffect(() => {
    if (reduceMotion) return
    const id = setInterval(() => setI((n) => (n + 1) % LINES.length), 4200)
    return () => clearInterval(id)
  }, [reduceMotion])

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col px-6 py-6 sm:px-10">
        <Logo to="/" size={24} />
        <motion.main
          className="flex flex-1 items-center justify-center py-12"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
        >
          <div className="w-full max-w-[380px]">{children}</div>
        </motion.main>
      </div>
      <aside className="relative hidden overflow-hidden border-l border-line bg-panel lg:flex lg:flex-col lg:justify-end p-12" aria-hidden="true">
        <Contours />
        <div className="relative min-h-[180px]">
          <AnimatePresence mode="wait">
            <motion.div key={i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.5, ease }}>
              <p className="text-sm text-accent">{LINES[i].note}</p>
              <p className="serif mt-3 text-[44px] leading-[1.05] max-w-[18ch]">{LINES[i].text}</p>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="relative mt-10 flex gap-1.5">
          {LINES.map((_, k) => <span key={k} className={`h-1 rounded-full transition-all duration-500 ${k === i ? 'w-8 bg-accent' : 'w-2 bg-fg/15'}`} />)}
        </div>
      </aside>
    </div>
  )
}
