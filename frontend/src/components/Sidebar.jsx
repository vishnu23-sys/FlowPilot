import { NavLink, Link } from 'react-router-dom'
import { LayoutDashboard, CreditCard, BarChart3, TrendingDown, RefreshCw, Target, Settings, X } from 'lucide-react'

const mainNav = [
  { to: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard'     },
  { to: '/expenses',      icon: CreditCard,       label: 'Expenses'      },
  { to: '/debts',         icon: TrendingDown,     label: 'Debts'         },
  { to: '/subscriptions', icon: RefreshCw,        label: 'Subscriptions' },
  { to: '/analytics',     icon: BarChart3,        label: 'Analytics'     },
  { to: '/goals',         icon: Target,           label: 'Goals'         },
]

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 md:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-64 z-30 flex flex-col
        bg-[#050a15] border-r border-white/[0.06]
        transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex items-center justify-between h-16 px-5 border-b border-white/[0.06] shrink-0">
          <Link to="/dashboard" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">FP</span>
            </div>
            <span className="font-semibold text-white tracking-tight">FlowPilot</span>
          </Link>
          <button onClick={onClose} className="md:hidden text-slate-500 hover:text-white transition-colors">
            <X size={17} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-700 px-3 mb-2">Main</p>
          {mainNav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                    : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
                }`
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Settings as real nav link at the bottom */}
        <div className="p-3 border-t border-white/[0.06] shrink-0">
          <NavLink
            to="/settings"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                  : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
              }`
            }
          >
            <Settings size={15} />
            Settings
          </NavLink>
        </div>
      </aside>
    </>
  )
}
