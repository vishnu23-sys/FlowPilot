import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import Contours from '../components/brand/Contours'
import ProductPreview from '../components/brand/ProductPreview'
import Logo from '../components/shell/Logo'
import { buttonClasses } from '../components/ui/Button'
import { Kbd } from '../components/ui/Controls'
import { ProgressBar, Ring } from '../components/ui/Progress'
import { Monogram } from '../components/ui/Pill'
import { ease } from '../lib/motion'
import { usePointerEffects } from '../lib/interactions'

const rise = (delay) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease, delay },
})

function BudgetDemo() {
  return (
    <div className="space-y-4">
      {[['Food', 0.62, 'food'], ['Transport', 0.91, 'transport'], ['Shopping', 1.08, 'shopping']].map(([name, pct, token]) => (
        <div key={name}>
          <div className="flex justify-between text-xs mb-1.5">
            <span>{name}</span>
            <span className={`num ${pct > 1 ? 'text-danger' : pct > 0.85 ? 'text-warning' : 'text-muted'}`}>{Math.round(pct * 100)}%</span>
          </div>
          <ProgressBar value={pct} marker={0.55} color={pct > 1 ? 'rgb(var(--danger))' : pct > 0.85 ? 'rgb(var(--warning))' : `rgb(var(--cat-${token}))`} />
        </div>
      ))}
    </div>
  )
}

function CalendarDemo() {
  const due = { 3: 'Netflix', 9: 'Spotify', 17: 'iCloud+', 24: 'Notion' }
  return (
    <div className="grid grid-cols-7 gap-1 text-center">
      {Array.from({ length: 28 }, (_, i) => (
        <span key={i} className={`aspect-square rounded-md grid place-items-center text-2xs num relative
          ${due[i + 1] ? 'bg-fg/[0.06] text-fg' : 'text-faint'} ${i + 1 === 9 ? '!bg-accent !text-on-accent' : ''}`}>
          {i + 1}
          {due[i + 1] && <span className={`absolute bottom-1 h-1 w-1 rounded-full ${i + 1 === 9 ? 'bg-on-accent' : 'bg-accent'}`} />}
        </span>
      ))}
    </div>
  )
}

function GoalDemo() {
  return (
    <div className="flex items-center gap-5">
      <Ring value={0.68} size={88} stroke={8} label="68% funded"><span className="num text-sm">68%</span></Ring>
      <div>
        <p className="text-sm">MacBook Pro</p>
        <p className="serif text-[30px] leading-none mt-1">₹1,22,400</p>
        <p className="text-xs text-muted mt-2"><span className="num text-fg">₹19,200</span> a month gets you there by March</p>
      </div>
    </div>
  )
}

const FEATURES = [
  { title: 'Budgets that warn you early', body: 'Set a limit per category. The tick shows where you are in the month, so you see trouble while you can still change course.', demo: <BudgetDemo /> },
  { title: 'Every renewal on one calendar', body: 'Subscriptions land on a calendar with a heads-up before each charge. Pause one and its cost drops out of your totals.', demo: <CalendarDemo /> },
  { title: 'Goals that do the arithmetic', body: 'Name what you are saving for and when. FlowPilot works out the monthly amount and tracks every contribution.', demo: <GoalDemo /> },
]

export default function Landing() {
  usePointerEffects()
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Contours />
      <header className="relative z-10 mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Logo to="/" size={24} />
        <nav className="flex items-center gap-2">
          <Link to="/login" className="h-9 px-3 grid place-items-center rounded-control text-sm text-muted hover:text-fg transition-colors">Log in</Link>
          <Link to="/signup" className={buttonClasses({ variant: 'primary' })}>Create account</Link>
        </nav>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pt-14 pb-24 md:pt-20 lg:grid-cols-[1fr_520px]">
          <div>
            <motion.h1 {...rise(0)} className="serif text-[56px] leading-[0.98] md:text-[84px] tracking-tight max-w-[11ch]">
              Know where your money goes.
            </motion.h1>
            <motion.p {...rise(0.08)} className="mt-6 max-w-[46ch] text-lg leading-relaxed text-muted">
              FlowPilot keeps your spending, income, budgets, subscriptions and savings goals in one place, then tells you plainly what changed this month.
            </motion.p>
            <motion.div {...rise(0.16)} className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/signup" className={buttonClasses({ variant: 'primary', size: 'lg' })}>Create free account</Link>
              <Link to="/login" className={buttonClasses({ size: 'lg' })}>Log in</Link>
            </motion.div>
            <motion.p {...rise(0.24)} className="mt-6 text-sm text-faint">No bank connection needed. Your data stays in your account.</motion.p>
          </div>
          <motion.div initial={{ opacity: 0, y: 30, rotate: -1.5 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ duration: 0.8, ease, delay: 0.2 }}>
            <ProductPreview />
          </motion.div>
        </section>

        <section className="border-t border-line bg-canvas/70 backdrop-blur-sm">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <h2 className="serif text-[40px] md:text-[52px] leading-none max-w-[16ch]">Built around the questions you actually ask.</h2>
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {FEATURES.map((f) => (
                <motion.article key={f.title}
                  initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.5, ease }}
                  data-glow className="flex flex-col rounded-panel border border-line bg-panel p-6">
                  <div className="min-h-[150px]">{f.demo}</div>
                  <h3 className="mt-6 text-base text-fg">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
                </motion.article>
              ))}
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-[1.2fr_1fr] rounded-panel border border-line bg-panel p-6 md:p-8 items-center">
              <div>
                <h3 className="text-base text-fg">Fast with a keyboard</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted max-w-[52ch]">
                  Press N to log an expense from any page. Ctrl K searches every page, action and transaction. G then a letter jumps between sections.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-muted">
                <span className="flex items-center gap-2"><Kbd>N</Kbd> New expense</span>
                <span className="flex items-center gap-2"><Kbd>Ctrl</Kbd><Kbd>K</Kbd> Search</span>
                <span className="flex items-center gap-2"><Kbd>G</Kbd><Kbd>B</Kbd> Budgets</span>
                <span className="flex items-center gap-2"><Monogram name="Netflix" size={22} /> Renewal alerts</span>
              </div>
            </div>
          </div>
        </section>

        <section className="relative border-t border-line">
          <div className="mx-auto max-w-6xl px-5 py-20 text-center">
            <p className="serif text-[44px] md:text-[60px] leading-none">Start with one expense.</p>
            <p className="mt-4 text-muted">It takes about ten seconds, and the picture fills in from there.</p>
            <Link to="/signup" className={buttonClasses({ variant: 'primary', size: 'lg', className: 'mt-8' })}>Create free account</Link>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-sm text-faint">
          <Logo to="/" size={18} />
          <span>© {new Date().getFullYear()} FlowPilot</span>
        </div>
      </footer>
    </div>
  )
}
