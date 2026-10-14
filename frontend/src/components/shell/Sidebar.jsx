import { NavLink, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { PanelLeftClose, PanelLeftOpen, LogOut, Settings, Keyboard, Sun, Moon, Monitor, ChevronsUpDown } from 'lucide-react'
import { NAV, SETTINGS_NAV } from './nav'
import { Tooltip, Menu, MenuTrigger, MenuContent, MenuItem, MenuSeparator, MenuLabel } from '../ui/Controls'
import { useAuth } from '../../context/AuthContext'
import { usePreferences } from '../../lib/preferences'
import { initials } from '../../lib/format'
import { dur, ease, spring } from '../../lib/motion'
import Logo from './Logo'

export const SIDEBAR_WIDTH = { expanded: 232, rail: 60 }

function NavItem({ item, rail, onNavigate }) {
  const Icon = item.icon
  return (
    <Tooltip content={item.label} side="right" shortcut={`G ${item.key.toUpperCase()}`} disabled={!rail}>
      <NavLink
        to={item.to}
        onClick={onNavigate}
        className={({ isActive }) => `group relative flex items-center gap-3 h-9 rounded-control px-[11px] text-sm
          transition-colors duration-150 ${isActive ? 'text-fg' : 'text-muted hover:text-fg'}`}
      >
        {({ isActive }) => (
          <>
            {isActive && (
              <motion.span
                layoutId="nav-active"
                transition={spring.snappy}
                className="absolute inset-0 rounded-control bg-fg/[0.07] border border-line"
              />
            )}
            {isActive && (
              <motion.span layoutId="nav-active-bar" transition={spring.snappy}
                className="absolute -left-3 top-2 bottom-2 w-[3px] rounded-r-full bg-accent" />
            )}
            <Icon size={17} strokeWidth={1.8} className="relative shrink-0" aria-hidden="true" />
            <AnimatePresence initial={false}>
              {!rail && (
                <motion.span
                  className="relative whitespace-nowrap"
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0, transition: { duration: dur.base, ease, delay: 0.06 } }}
                  exit={{ opacity: 0, x: -4, transition: { duration: dur.fast } }}
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
            {rail && <span className="sr-only">{item.label}</span>}
          </>
        )}
      </NavLink>
    </Tooltip>
  )
}

function ProfileMenu({ rail, onShowShortcuts }) {
  const { user, logout } = useAuth()
  const { prefs, setTheme } = usePreferences()
  const navigate = useNavigate()

  const themeItem = (value, Icon, label) => (
    <MenuItem icon={Icon} onSelect={() => setTheme(value)}>
      <span className="flex items-center justify-between">
        {label}
        {prefs.theme === value && <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-label="Selected" />}
      </span>
    </MenuItem>
  )

  return (
    <Menu>
      <MenuTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className="flex w-full items-center gap-2.5 rounded-control p-1.5 text-left hover:bg-fg/[0.05] transition-colors"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-on-accent text-xs font-semibold">
            {initials(user?.full_name)}
          </span>
          {!rail && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-fg">{user?.full_name}</span>
                <span className="block truncate text-xs text-muted">{user?.email}</span>
              </span>
              <ChevronsUpDown size={14} className="text-faint shrink-0" aria-hidden="true" />
            </>
          )}
        </button>
      </MenuTrigger>
      <MenuContent side="top" align="start" className="w-56">
        <MenuLabel>Theme</MenuLabel>
        {themeItem('system', Monitor, 'Match system')}
        {themeItem('light', Sun, 'Light')}
        {themeItem('dark', Moon, 'Dark')}
        <MenuSeparator />
        <MenuItem icon={Settings} shortcut="G ," onSelect={() => navigate('/settings')}>Settings</MenuItem>
        <MenuItem icon={Keyboard} shortcut="?" onSelect={onShowShortcuts}>Keyboard shortcuts</MenuItem>
        <MenuSeparator />
        <MenuItem icon={LogOut} danger onSelect={() => { logout(); navigate('/login') }}>Log out</MenuItem>
      </MenuContent>
    </Menu>
  )
}

/** Sidebar body; used both as the persistent desktop sidebar and inside the mobile drawer. */
export function SidebarBody({ rail = false, onToggle, onNavigate, onShowShortcuts, showToggle = true }) {
  return (
    <div className="flex h-full flex-col">
      <div className={`flex h-[52px] items-center shrink-0 ${rail ? 'justify-center' : 'justify-between pl-4 pr-2'}`}>
        {!rail && <Logo />}
        {showToggle && (
          <Tooltip content={rail ? 'Expand sidebar' : 'Collapse sidebar'} side="right" shortcut="Ctrl B">
            <button
              type="button"
              onClick={onToggle}
              aria-label={rail ? 'Expand sidebar' : 'Collapse sidebar'}
              className="grid h-8 w-8 place-items-center rounded-control text-muted hover:text-fg hover:bg-fg/[0.06] transition-colors"
            >
              {rail ? <PanelLeftOpen size={17} strokeWidth={1.8} /> : <PanelLeftClose size={17} strokeWidth={1.8} />}
            </button>
          </Tooltip>
        )}
      </div>

      <nav aria-label="Main" className="flex-1 overflow-y-auto overflow-x-hidden px-3 pt-2 space-y-0.5">
        {NAV.map((item) => <NavItem key={item.to} item={item} rail={rail} onNavigate={onNavigate} />)}
      </nav>

      <div className="px-3 pb-3 pt-2 space-y-1 border-t border-line">
        <div className="pt-1"><NavItem item={SETTINGS_NAV} rail={rail} onNavigate={onNavigate} /></div>
        <ProfileMenu rail={rail} onShowShortcuts={onShowShortcuts} />
      </div>
    </div>
  )
}

export default function Sidebar({ rail, onToggle, onShowShortcuts }) {
  return (
    <motion.aside
      aria-label="Sidebar"
      className="hidden md:block sticky top-0 h-screen shrink-0 border-r border-line bg-panel/60 backdrop-blur-sm z-20"
      initial={false}
      animate={{ width: rail ? SIDEBAR_WIDTH.rail : SIDEBAR_WIDTH.expanded }}
      transition={spring.soft}
    >
      <SidebarBody rail={rail} onToggle={onToggle} onShowShortcuts={onShowShortcuts} />
    </motion.aside>
  )
}
