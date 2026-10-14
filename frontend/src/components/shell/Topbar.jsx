import { useLocation, useNavigate } from 'react-router-dom'
import * as Popover from '@radix-ui/react-popover'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, Menu as MenuIcon, Plus, Search, Sun, Moon, ChevronRight, CircleAlert, TriangleAlert, Info } from 'lucide-react'
import Button from '../ui/Button'
import { Kbd, Tooltip } from '../ui/Controls'
import { navItem } from './nav'
import { usePreferences } from '../../lib/preferences'
import { useSheets } from '../../lib/sheets'
import { useAttention } from '../../api/queries'
import { monthName } from '../../lib/format'
import { dur, ease } from '../../lib/motion'

const SEVERITY = {
  danger: { icon: CircleAlert, className: 'text-danger' },
  warning: { icon: TriangleAlert, className: 'text-warning' },
  info: { icon: Info, className: 'text-muted' },
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = usePreferences()
  const next = resolvedTheme === 'dark' ? 'light' : 'dark'
  return (
    <Tooltip content={`Switch to ${next} theme`}>
      <button
        type="button"
        aria-label={`Switch to ${next} theme`}
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          setTheme(next, { x: r.left + r.width / 2, y: r.top + r.height / 2 })
        }}
        className="relative grid h-8 w-8 place-items-center rounded-control text-muted hover:text-fg hover:bg-fg/[0.06] transition-colors overflow-hidden"
      >
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={resolvedTheme}
            initial={{ y: 14, rotate: -40, opacity: 0 }}
            animate={{ y: 0, rotate: 0, opacity: 1 }}
            exit={{ y: -14, rotate: 40, opacity: 0 }}
            transition={{ duration: dur.slow, ease }}
            className="grid place-items-center"
          >
            {resolvedTheme === 'dark' ? <Moon size={16} strokeWidth={1.8} /> : <Sun size={16} strokeWidth={1.8} />}
          </motion.span>
        </AnimatePresence>
      </button>
    </Tooltip>
  )
}

export function AttentionList({ items, onPick }) {
  if (!items.length) {
    return <p className="px-3 py-6 text-sm text-muted text-center">You're all caught up.</p>
  }
  return (
    <ul className="divide-y divide-line">
      {items.map((item, i) => {
        const sev = SEVERITY[item.severity] || SEVERITY.info
        const Icon = sev.icon
        return (
          <li key={`${item.kind}-${i}`}>
            <button
              type="button"
              onClick={() => onPick(item)}
              className="group flex w-full items-start gap-3 px-3 py-2.5 text-left hover:bg-fg/[0.04] transition-colors"
            >
              <Icon size={15} className={`mt-0.5 shrink-0 ${sev.className}`} aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm text-fg">{item.title}</span>
                <span className="block text-xs text-muted mt-0.5">{item.detail}</span>
              </span>
              <ChevronRight size={14} className="mt-0.5 text-faint group-hover:text-fg transition-colors" aria-hidden="true" />
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function AttentionBell() {
  const { data } = useAttention()
  const navigate = useNavigate()
  const count = data?.count || 0
  const urgent = data?.items?.some((i) => i.severity === 'danger')
  return (
    <Popover.Root>
      <Tooltip content="Needs attention">
        <Popover.Trigger asChild>
          <button
            type="button"
            aria-label={`Needs attention${count ? `, ${count} items` : ''}`}
            className="relative grid h-8 w-8 place-items-center rounded-control text-muted hover:text-fg hover:bg-fg/[0.06] transition-colors data-[state=open]:bg-fg/[0.06] data-[state=open]:text-fg"
          >
            <Bell size={16} strokeWidth={1.8} />
            <AnimatePresence>
              {count > 0 && (
                <motion.span
                  initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                  className={`absolute -top-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-semibold num
                    ${urgent ? 'bg-danger text-canvas' : 'bg-accent text-on-accent'}`}
                >
                  {count}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </Popover.Trigger>
      </Tooltip>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-[60] w-[340px] max-w-[calc(100vw-24px)] rounded-[12px] border border-line bg-raised shadow-pop overflow-hidden"
        >
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-line">
            <p className="text-sm font-medium">Needs attention</p>
            <span className="text-xs text-muted num">{count}</span>
          </div>
          <div className="max-h-[360px] overflow-y-auto">
            <AttentionList
              items={data?.items || []}
              onPick={(item) => navigate(item.link)}
            />
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

export default function Topbar({ onOpenPalette, onOpenDrawer }) {
  const { pathname } = useLocation()
  const { openSheet } = useSheets()
  const item = navItem(pathname)
  const Icon = item.icon

  return (
    <header className="sticky top-0 z-10 flex h-[52px] shrink-0 items-center gap-2 border-b border-line bg-canvas/80 backdrop-blur-md px-3 md:px-5">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={onOpenDrawer} aria-label="Open navigation">
        <MenuIcon size={18} />
      </Button>

      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-sm">
        <Icon size={15} strokeWidth={1.8} className="text-muted shrink-0" aria-hidden="true" />
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={item.to}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: dur.base, ease }}
            className="text-fg truncate"
          >
            {item.label}
          </motion.span>
        </AnimatePresence>
        {item.to === '/dashboard' && <span className="hidden sm:inline text-muted">/ {monthName()}</span>}
      </nav>

      <div className="flex-1" />

      <button
        type="button"
        onClick={onOpenPalette}
        className="hidden sm:flex h-8 w-56 items-center gap-2 rounded-control border border-line bg-panel/70 px-2.5 text-sm text-muted
          hover:border-line-strong hover:text-fg transition-colors"
      >
        <Search size={14} aria-hidden="true" />
        <span className="flex-1 text-left">Search or jump to…</span>
        <Kbd>Ctrl K</Kbd>
      </button>
      <Button variant="ghost" size="icon" className="sm:hidden" onClick={onOpenPalette} aria-label="Search">
        <Search size={16} />
      </Button>

      <ThemeToggle />
      <AttentionBell />

      <Tooltip content="New expense" shortcut="N">
        <Button variant="primary" size="sm" onClick={() => openSheet('expense')} className="ml-1">
          <Plus size={14} strokeWidth={2.4} aria-hidden="true" />
          <span className="hidden sm:inline">Expense</span>
          <span className="sm:hidden sr-only">New expense</span>
        </Button>
      </Tooltip>
    </header>
  )
}
