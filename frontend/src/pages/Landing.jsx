import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125H18M2.25 10.5h1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125H2.25" />
      </svg>
    ),
    title: 'Expense Tracking',
    desc: 'Log and categorize every transaction. See exactly where your money goes with clean, real-time breakdowns.',
    color: 'blue',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
    title: 'Smart Analytics',
    desc: 'Visual charts reveal spending patterns and trends across months so you can make smarter decisions.',
    color: 'purple',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
      </svg>
    ),
    title: 'Goal Tracking',
    desc: 'Set savings targets and watch your progress. Stay motivated with a financial health score that evolves with you.',
    color: 'emerald',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
      </svg>
    ),
    title: 'Subscription Manager',
    desc: 'Never get surprised by a charge again. Track every recurring payment and see your monthly subscription burn.',
    color: 'rose',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6 9 12.75l4.286-4.286a11.948 11.948 0 0 1 4.306 6.43l.776 2.898m0 0 3.182-5.511m-3.182 5.511-5.511-3.182" />
      </svg>
    ),
    title: 'Debt Payoff Planner',
    desc: 'List every debt, track balances, and monitor your payoff progress — all in one focused view.',
    color: 'amber',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    title: 'Real-time Dashboard',
    desc: 'A single command center that shows income, spending, net savings, and upcoming bills at a glance.',
    color: 'cyan',
  },
]

const COLOR_MAP = {
  blue:    { bg: 'bg-blue-500/10',   icon: 'text-blue-400',   border: 'border-blue-500/20' },
  purple:  { bg: 'bg-purple-500/10', icon: 'text-purple-400', border: 'border-purple-500/20' },
  emerald: { bg: 'bg-emerald-500/10',icon: 'text-emerald-400',border: 'border-emerald-500/20' },
  rose:    { bg: 'bg-rose-500/10',   icon: 'text-rose-400',   border: 'border-rose-500/20' },
  amber:   { bg: 'bg-amber-500/10',  icon: 'text-amber-400',  border: 'border-amber-500/20' },
  cyan:    { bg: 'bg-cyan-500/10',   icon: 'text-cyan-400',   border: 'border-cyan-500/20' },
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: 'easeOut', delay },
})

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#070c18] text-slate-100 overflow-x-hidden">

      {/* Background glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-blue-600/[0.06] rounded-full blur-3xl" />
        <div className="absolute top-2/3 right-0 w-[500px] h-[500px] bg-purple-600/[0.05] rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-cyan-600/[0.04] rounded-full blur-3xl" />
      </div>

      {/* ── Navbar ── */}
      <nav className="relative z-20 flex items-center justify-between px-6 md:px-12 py-5 border-b border-white/[0.05]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">FP</span>
          </div>
          <span className="font-semibold text-white text-lg tracking-tight">FlowPilot</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-sm text-slate-400 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/[0.05]"
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            className="text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-4 py-2 rounded-lg transition-all"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-24 pb-20">
        <motion.div {...fadeUp(0)}>
          <span className="inline-flex items-center gap-2 text-xs font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Personal finance, simplified
          </span>
        </motion.div>

        <motion.h1 {...fadeUp(0.08)} className="text-4xl md:text-6xl font-bold text-white leading-tight max-w-3xl mb-5">
          Take control of{' '}
          <span className="gradient-text">your money</span>
          <br />without the complexity
        </motion.h1>

        <motion.p {...fadeUp(0.16)} className="text-slate-400 text-lg max-w-xl mb-10 leading-relaxed">
          FlowPilot tracks expenses, debts, subscriptions, and goals in one clean dashboard.
          Know where every dollar goes — and where it should go next.
        </motion.p>

        <motion.div {...fadeUp(0.22)} className="flex flex-col sm:flex-row items-center gap-3">
          <Link
            to="/signup"
            className="w-full sm:w-auto text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-6 py-3 rounded-xl transition-all shadow-lg shadow-blue-900/30"
          >
            Start for free
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto text-sm font-medium text-slate-400 hover:text-white glass px-6 py-3 rounded-xl transition-colors"
          >
            Sign in to your account
          </Link>
        </motion.div>

        {/* Hero mock card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.35 }}
          className="mt-16 w-full max-w-2xl"
        >
          <div className="glass rounded-2xl p-6 text-left">
            <p className="text-xs text-slate-500 mb-4 uppercase tracking-wider">This month's overview</p>
            <div className="grid grid-cols-3 gap-4 mb-5">
              {[
                { label: 'Income', value: '$5,200', change: '+8.3%', up: true },
                { label: 'Expenses', value: '$2,840', change: '-4.1%', up: false },
                { label: 'Net savings', value: '$2,360', change: '+21%', up: true },
              ].map((s) => (
                <div key={s.label} className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.06]">
                  <p className="text-xs text-slate-500 mb-1">{s.label}</p>
                  <p className="text-lg font-bold text-white">{s.value}</p>
                  <p className={`text-xs mt-0.5 ${s.up ? 'text-emerald-400' : 'text-rose-400'}`}>{s.change}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                <div className="h-full w-[54%] bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
              </div>
              <span className="text-xs text-slate-500 shrink-0">54% of budget used</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Features ── */}
      <section className="relative z-10 px-6 md:px-12 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Everything you need</h2>
          <p className="text-slate-500 max-w-md mx-auto text-sm">
            Six core tools designed to give you a complete picture of your financial life.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {FEATURES.map((f, i) => {
            const c = COLOR_MAP[f.color]
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="glass rounded-xl p-5 hover:bg-white/[0.06] transition-colors group"
              >
                <div className={`w-9 h-9 rounded-lg ${c.bg} border ${c.border} ${c.icon} flex items-center justify-center mb-4`}>
                  {f.icon}
                </div>
                <h3 className="text-sm font-semibold text-white mb-1.5">{f.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section className="relative z-10 px-6 md:px-12 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto glass rounded-2xl p-10 text-center border border-blue-500/10"
        >
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-600/[0.07] to-purple-600/[0.07] pointer-events-none" />
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 relative">
            Ready to pilot your finances?
          </h2>
          <p className="text-slate-500 text-sm mb-8 relative">
            Create a free account in seconds. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 relative">
            <Link
              to="/signup"
              className="w-full sm:w-auto text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-8 py-3 rounded-xl transition-all shadow-lg shadow-blue-900/30"
            >
              Create free account
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto text-sm text-slate-400 hover:text-white transition-colors"
            >
              Already have an account?
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/[0.05] px-6 md:px-12 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white text-[9px] font-bold">FP</span>
          </div>
          <span className="text-sm text-slate-500">FlowPilot</span>
        </div>
        <p className="text-xs text-slate-600">© 2026 FlowPilot. All rights reserved.</p>
      </footer>
    </div>
  )
}
