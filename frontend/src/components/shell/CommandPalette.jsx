import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Command } from 'cmdk'
import * as RDialog from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Banknote, Repeat, HandCoins, Target, SunMoon, PanelLeft, Keyboard, LogOut, Search, CornerDownLeft } from 'lucide-react'
import { ALL_NAV } from './nav'
import { Kbd } from '../ui/Controls'
import { CategoryIcon } from '../ui/Pill'
import { useExpenses } from '../../api/queries'
import { useAuth, useCurrency } from '../../context/AuthContext'
import { usePreferences } from '../../lib/preferences'
import { useSheets } from '../../lib/sheets'
import { formatMoney, formatShortDate } from '../../lib/format'
import { dur, ease } from '../../lib/motion'

function Item({ icon: Icon, children, hint, onSelect, value }) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className="flex items-center gap-3 h-10 px-3 rounded-md text-sm text-fg cursor-pointer select-none
        data-[selected=true]:bg-fg/[0.07]"
    >
      {Icon && <Icon size={15} className="text-muted shrink-0" aria-hidden="true" />}
      <span className="flex-1 truncate">{children}</span>
      {hint}
    </Command.Item>
  )
}

const groupClass = `[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5
  [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-muted`

export default function CommandPalette({ open, onOpenChange, onToggleSidebar, onShowShortcuts }) {
  const navigate = useNavigate()
  const { openSheet } = useSheets()
  const { logout } = useAuth()
  const { resolvedTheme, setTheme } = usePreferences()
  const currency = useCurrency()
  const [search, setSearch] = useState('')
  const expenses = useExpenses({ enabled: open })

  const run = (fn) => () => {
    onOpenChange(false)
    setSearch('')
    // Let the palette close before opening a sheet so focus lands in the sheet.
    setTimeout(fn, 10)
  }

  const showExpenses = search.trim().length >= 2
  const matches = showExpenses
    ? (expenses.data || []).filter((e) => {
      const q = search.trim().toLowerCase()
      return e.description?.toLowerCase().includes(q) || e.category.toLowerCase().includes(q) || String(e.amount).includes(q)
    }).slice(0, 8)
    : []

  return (
    <RDialog.Root open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setSearch('') }}>
      <AnimatePresence>
        {open && (
          <RDialog.Portal forceMount>
            <RDialog.Overlay asChild forceMount>
              <motion.div className="fixed inset-0 z-[60] bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: dur.fast }} />
            </RDialog.Overlay>
            <div className="fixed inset-0 z-[61] flex justify-center px-3 pt-[12vh] pointer-events-none">
              <RDialog.Content asChild forceMount>
                <motion.div
                  className="pointer-events-auto w-full max-w-[600px] h-fit overflow-hidden rounded-[14px] border border-line bg-raised shadow-pop outline-none"
                  initial={{ opacity: 0, scale: 0.98, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: -8 }}
                  transition={{ duration: dur.base, ease }}
                >
                  <RDialog.Title className="sr-only">Command palette</RDialog.Title>
                  <RDialog.Description className="sr-only">Search pages, actions and expenses</RDialog.Description>
                  <Command loop label="Command palette" shouldFilter>
                    <div className="flex items-center gap-2.5 border-b border-line px-4">
                      <Search size={16} className="text-muted" aria-hidden="true" />
                      <Command.Input
                        value={search}
                        onValueChange={setSearch}
                        placeholder="Search pages, actions or expenses"
                        className="h-12 flex-1 bg-transparent text-base text-fg placeholder:text-faint outline-none"
                      />
                      <Kbd>Esc</Kbd>
                    </div>
                    <Command.List className={`max-h-[min(420px,60vh)] overflow-y-auto p-1.5 ${groupClass}`}>
                      <Command.Empty className="py-10 text-center text-sm text-muted">No matches. Try a page name or an amount.</Command.Empty>

                      {matches.length > 0 && (
                        <Command.Group heading="Expenses">
                          {matches.map((e) => (
                            <Command.Item
                              key={e.id}
                              value={`expense ${e.id} ${e.description} ${e.category} ${e.amount}`}
                              onSelect={run(() => { navigate('/expenses'); openSheet('expense', e) })}
                              className="flex items-center gap-3 h-11 px-3 rounded-md text-sm cursor-pointer data-[selected=true]:bg-fg/[0.07]"
                            >
                              <CategoryIcon id={e.category} size={26} />
                              <span className="flex-1 truncate">{e.description || e.category}</span>
                              <span className="text-xs text-muted">{formatShortDate(e.date)}</span>
                              <span className="num text-sm w-24 text-right">{formatMoney(e.amount, currency)}</span>
                            </Command.Item>
                          ))}
                        </Command.Group>
                      )}

                      <Command.Group heading="Create">
                        <Item icon={Plus} value="new expense add" onSelect={run(() => openSheet('expense'))} hint={<Kbd>N</Kbd>}>New expense</Item>
                        <Item icon={Banknote} value="log income add salary" onSelect={run(() => openSheet('income'))}>Log income</Item>
                        <Item icon={Repeat} value="new subscription add" onSelect={run(() => openSheet('subscription'))}>New subscription</Item>
                        <Item icon={HandCoins} value="record debt owe lend split" onSelect={run(() => openSheet('debt'))}>Record a debt</Item>
                        <Item icon={Target} value="new savings goal" onSelect={run(() => openSheet('goal'))}>New savings goal</Item>
                      </Command.Group>

                      <Command.Group heading="Go to">
                        {ALL_NAV.map((n) => (
                          <Item key={n.to} icon={n.icon} value={`go ${n.label}`} onSelect={run(() => navigate(n.to))}
                            hint={<span className="flex gap-1"><Kbd>G</Kbd><Kbd>{n.key.toUpperCase()}</Kbd></span>}>
                            {n.label}
                          </Item>
                        ))}
                      </Command.Group>

                      <Command.Group heading="Preferences">
                        <Item icon={SunMoon} value="toggle theme dark light" onSelect={run(() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'))}>
                          Switch to {resolvedTheme === 'dark' ? 'light' : 'dark'} theme
                        </Item>
                        <Item icon={PanelLeft} value="toggle collapse sidebar" onSelect={run(onToggleSidebar)} hint={<Kbd>Ctrl B</Kbd>}>Toggle sidebar</Item>
                        <Item icon={Keyboard} value="keyboard shortcuts help" onSelect={run(onShowShortcuts)} hint={<Kbd>?</Kbd>}>Keyboard shortcuts</Item>
                        <Item icon={LogOut} value="log out sign out" onSelect={run(() => { logout(); navigate('/login') })}>Log out</Item>
                      </Command.Group>
                    </Command.List>
                    <div className="flex items-center gap-4 border-t border-line px-4 h-9 text-xs text-muted">
                      <span className="flex items-center gap-1.5"><Kbd>↑</Kbd><Kbd>↓</Kbd> to move</span>
                      <span className="flex items-center gap-1.5"><Kbd><CornerDownLeft size={10} /></Kbd> to select</span>
                    </div>
                  </Command>
                </motion.div>
              </RDialog.Content>
            </div>
          </RDialog.Portal>
        )}
      </AnimatePresence>
    </RDialog.Root>
  )
}
