import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useMotionTemplate } from 'motion/react'
import { useTilt } from '../../lib/interactions'
import { ResponsiveContainer, AreaChart, Area } from 'recharts'
import RollingNumber from '../ui/RollingNumber'
import { CategoryIcon } from '../ui/Pill'
import { ProgressBar } from '../ui/Progress'
import { AreaGradient } from '../charts/chartTheme'
import { formatMoney } from '../../lib/format'
import { usePreferences } from '../../lib/preferences'

/** Sample months the landing preview cycles through. */
const MONTHS = [
  {
    name: 'August', spent: 41250, left: 43750, score: 68,
    curve: [2, 6, 7, 12, 14, 19, 22, 24, 29, 33, 36, 41],
    rows: [['Swiggy', 'Food', 640], ['Metro card', 'Transport', 400], ['Steam', 'Entertainment', 1299]],
    budget: [['Food', 0.82], ['Transport', 1.04]],
  },
  {
    name: 'September', spent: 35830, left: 49170, score: 79,
    curve: [1, 3, 8, 9, 13, 15, 17, 22, 25, 28, 31, 36],
    rows: [['BigBasket', 'Food', 1870], ['IndiGo', 'Travel', 6420], ['Airtel Fiber', 'Bills', 999]],
    budget: [['Food', 0.61], ['Transport', 0.74]],
  },
  {
    name: 'October', spent: 29410, left: 55590, score: 86,
    curve: [3, 4, 6, 10, 11, 14, 16, 18, 21, 24, 27, 29],
    rows: [['Blue Tokai', 'Food', 320], ['Uber', 'Transport', 286], ['Cult.fit', 'Health', 1500]],
    budget: [['Food', 0.48], ['Transport', 0.55]],
  },
]

export default function ProductPreview() {
  const { reduceMotion } = usePreferences()
  const [i, setI] = useState(0)
  useEffect(() => {
    if (reduceMotion) return
    const id = setInterval(() => setI((n) => (n + 1) % MONTHS.length), 3800)
    return () => clearInterval(id)
  }, [reduceMotion])
  const m = MONTHS[i]
  const curve = m.curve.map((v, x) => ({ x, v }))
  const tilt = useTilt({ max: 6 })
  const shine = useMotionTemplate`radial-gradient(420px circle at ${tilt.shineX} ${tilt.shineY}, rgb(var(--fg) / 0.07), transparent 60%)`

  return (
    <motion.div ref={tilt.ref} style={tilt.style} className="relative rounded-[16px] border border-line bg-panel/90 backdrop-blur shadow-pop overflow-hidden text-left will-change-transform" role="img"
      aria-label="FlowPilot dashboard preview with sample data">
      <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10" style={{ background: shine }} />
      <div className="flex items-center gap-1.5 border-b border-line px-4 h-9">
        <span className="h-2.5 w-2.5 rounded-full bg-fg/15" /><span className="h-2.5 w-2.5 rounded-full bg-fg/15" /><span className="h-2.5 w-2.5 rounded-full bg-fg/15" />
        <span className="ml-3 text-2xs text-muted font-mono">flowpilot / home</span>
      </div>
      <div className="p-5 md:p-6" aria-hidden="true">
        <div className="relative h-[44px] overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.p key={m.name} className="serif text-[40px] leading-none"
              initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -30, opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.2, 0.9, 0.3, 1] }}>
              {m.name}
            </motion.p>
          </AnimatePresence>
        </div>
        <div className="mt-4 grid grid-cols-3 divide-x divide-line rounded-[10px] border border-line">
          {[['Spent', formatMoney(m.spent, 'INR')], ['Left to spend', formatMoney(m.left, 'INR')], ['Health', String(m.score)]].map(([label, v], k) => (
            <div key={label} className="p-3">
              <p className="text-2xs text-muted">{label}</p>
              <p className={`serif text-[26px] md:text-[30px] leading-none mt-1.5 ${k === 2 ? 'text-accent' : ''}`}><RollingNumber value={v} /></p>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-5 gap-4">
          <div className="col-span-3 h-[120px] -mx-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={curve} margin={{ top: 6, right: 4, left: 4, bottom: 0 }}>
                <defs><AreaGradient id="preview-fill" color="rgb(var(--accent))" from={0.25} /></defs>
                <Area type="monotone" dataKey="v" stroke="rgb(var(--accent))" strokeWidth={2} fill="url(#preview-fill)"
                  isAnimationActive={!reduceMotion} animationDuration={700} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="col-span-2 space-y-3 pt-1">
            {m.budget.map(([cat, pct]) => (
              <div key={cat}>
                <div className="flex justify-between text-2xs mb-1"><span>{cat}</span><span className="num text-muted">{Math.round(pct * 100)}%</span></div>
                <ProgressBar value={pct} height={5} color={pct > 1 ? 'rgb(var(--danger))' : `rgb(var(--cat-${cat.toLowerCase()}))`} />
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 divide-y divide-line border-t border-line">
          <AnimatePresence mode="popLayout" initial={false}>
            {m.rows.map(([name, cat, amount]) => (
              <motion.div key={`${m.name}-${name}`} layout
                initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.35 }} className="flex items-center gap-3 py-2.5">
                <CategoryIcon id={cat} size={28} />
                <span className="flex-1 text-sm">{name}</span>
                <span className="num text-sm">−{formatMoney(amount, 'INR')}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
