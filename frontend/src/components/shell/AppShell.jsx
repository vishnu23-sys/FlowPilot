import { Suspense, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useOutlet } from 'react-router-dom'
import * as RDialog from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'framer-motion'
import Sidebar, { SidebarBody } from './Sidebar'
import Topbar from './Topbar'
import CommandPalette from './CommandPalette'
import ShortcutsDialog from './ShortcutsDialog'
import ErrorBoundary from './ErrorBoundary'
import SheetHost from '../../features/SheetHost'
import { ALL_NAV, navIndex, navItem } from './nav'
import { PageSkeleton } from '../ui/Skeleton'
import { usePreferences } from '../../lib/preferences'
import { useHotkeys } from '../../lib/hotkeys'
import { useSheets } from '../../lib/sheets'
import { useMediaQuery } from '../../lib/useMediaQuery'
import { pageVariants, spring } from '../../lib/motion'

/** Direction of travel through the sidebar order: +1 moving down, -1 moving up. */
function useNavDirection(pathname) {
  const prev = useRef(navIndex(pathname))
  const dir = useRef(1)
  const current = navIndex(pathname)
  if (current !== prev.current) {
    dir.current = current > prev.current ? 1 : -1
    prev.current = current
  }
  return dir.current
}

function AnimatedOutlet() {
  const location = useLocation()
  const outlet = useOutlet()
  const dir = useNavDirection(location.pathname)
  return (
    <AnimatePresence mode="wait" custom={dir} initial={false}>
      <motion.div
        key={location.pathname}
        custom={dir}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <ErrorBoundary>
          <Suspense fallback={<PageSkeleton />}>{outlet}</Suspense>
        </ErrorBoundary>
      </motion.div>
    </AnimatePresence>
  )
}

function MobileDrawer({ open, onOpenChange, onShowShortcuts }) {
  return (
    <RDialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <RDialog.Portal forceMount>
            <RDialog.Overlay asChild forceMount>
              <motion.div className="fixed inset-0 z-40 bg-black/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            </RDialog.Overlay>
            <RDialog.Content asChild forceMount>
              <motion.div
                className="fixed inset-y-0 left-0 z-50 w-[264px] max-w-[85vw] border-r border-line bg-panel outline-none"
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={spring.soft}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={{ left: 0.4, right: 0 }}
                onDragEnd={(_, info) => { if (info.offset.x < -60) onOpenChange(false) }}
              >
                <RDialog.Title className="sr-only">Navigation</RDialog.Title>
                <RDialog.Description className="sr-only">Main navigation</RDialog.Description>
                <SidebarBody showToggle={false} onNavigate={() => onOpenChange(false)} onShowShortcuts={onShowShortcuts} />
              </motion.div>
            </RDialog.Content>
          </RDialog.Portal>
        )}
      </AnimatePresence>
    </RDialog.Root>
  )
}

export default function AppShell() {
  const { prefs, update } = usePreferences()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { sheet, openSheet } = useSheets()
  const mobile = useMediaQuery('(max-width: 767px)')
  const tablet = useMediaQuery('(max-width: 1023px)')

  // Tablets start as a rail; the choice made there lasts for the session only.
  const [tabletRail, setTabletRail] = useState(true)
  const rail = tablet ? tabletRail : prefs.sidebar === 'rail'
  const toggleSidebar = () => (tablet ? setTabletRail((r) => !r) : update({ sidebar: rail ? 'expanded' : 'rail' }))

  const [paletteOpen, setPaletteOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  useEffect(() => {
    window.scrollTo({ top: 0 })
    document.title = `${navItem(pathname).label} | FlowPilot`
  }, [pathname])

  const overlayOpen = paletteOpen || shortcutsOpen || drawerOpen || Boolean(sheet.type)
  useHotkeys({
    'mod+k': () => setPaletteOpen((o) => !o),
    'mod+b': toggleSidebar,
    ...(overlayOpen ? {} : {
      n: () => openSheet('expense'),
      '?': () => setShortcutsOpen(true),
      ...Object.fromEntries(ALL_NAV.map((n) => [`g ${n.key}`, () => navigate(n.to)])),
    }),
  })

  return (
    <div className="flex min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[80] focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-on-accent">
        Skip to content
      </a>
      {!mobile && <Sidebar rail={rail} onToggle={toggleSidebar} onShowShortcuts={() => setShortcutsOpen(true)} />}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenPalette={() => setPaletteOpen(true)} onOpenDrawer={() => setDrawerOpen(true)} />
        <main id="main" className="canvas-dots flex-1">
          <div className="mx-auto w-full max-w-[1240px] px-4 py-6 md:px-8 md:py-8">
            <AnimatedOutlet />
          </div>
        </main>
      </div>

      {mobile && <MobileDrawer open={drawerOpen} onOpenChange={setDrawerOpen} onShowShortcuts={() => setShortcutsOpen(true)} />}
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onToggleSidebar={toggleSidebar}
        onShowShortcuts={() => setShortcutsOpen(true)}
      />
      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      <SheetHost />
    </div>
  )
}
