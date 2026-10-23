import { forwardRef } from 'react'
import * as RDialog from '@radix-ui/react-dialog'
import { AnimatePresence, motion, useDragControls } from 'motion/react'
import { X } from 'lucide-react'
import Button from './Button'
import { dur, ease, spring } from '../../lib/motion'
import { useMediaQuery } from '../../lib/useMediaQuery'

// forwardRef because Radix's Portal attaches a ref to each child it portals.
const Backdrop = forwardRef(function Backdrop(_, ref) {
  return (
    <RDialog.Overlay asChild forceMount ref={ref}>
      <motion.div
        className="fixed inset-0 z-40 bg-black/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: dur.base }}
      />
    </RDialog.Overlay>
  )
})

/**
 * Side sheet on desktop, bottom sheet on mobile. Radix handles focus trap, Esc and aria;
 * framer handles enter/exit so shared layoutIds inside can morph from the page.
 */
export function Sheet({ open, onOpenChange, title, description, children, footer, width = 468 }) {
  const mobile = useMediaQuery('(max-width: 639px)')
  // On phones the sheet can be dragged down by its handle (or header) to close.
  const drag = useDragControls()
  return (
    <RDialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <RDialog.Portal forceMount>
            <Backdrop />
            <RDialog.Content asChild forceMount>
              <motion.div
                className={`fixed z-50 flex flex-col bg-panel border-line outline-none
                  ${mobile
                    ? 'inset-x-0 bottom-0 max-h-[92vh] rounded-t-[16px] border-t'
                    : 'right-0 top-0 bottom-0 border-l shadow-sheet'}`}
                style={mobile ? undefined : { width: `min(${width}px, 100vw)` }}
                initial={mobile ? { y: '100%' } : { x: '100%' }}
                animate={mobile ? { y: 0 } : { x: 0 }}
                exit={mobile ? { y: '100%' } : { x: '100%' }}
                transition={spring.soft}
                drag={mobile ? 'y' : false}
                dragListener={false}
                dragControls={drag}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0.05, bottom: 0.8 }}
                onDragEnd={(_, info) => { if (info.offset.y > 110 || info.velocity.y > 600) onOpenChange(false) }}
              >
                {mobile && (
                  <div className="flex justify-center pt-2 pb-1 touch-none cursor-grab" onPointerDown={(e) => drag.start(e)} aria-hidden="true">
                    <div className="h-1 w-10 rounded-full bg-line-strong" />
                  </div>
                )}
                <div className={`flex items-start justify-between gap-4 px-5 pt-5 pb-3 ${mobile ? 'touch-none' : ''}`}
                  onPointerDown={mobile ? (e) => { if (!e.target.closest('button')) drag.start(e) } : undefined}>
                  <div className="min-w-0">
                    <RDialog.Title className="text-base font-medium text-fg">{title}</RDialog.Title>
                    {description ? (
                      <RDialog.Description className="text-sm text-muted mt-0.5">{description}</RDialog.Description>
                    ) : (
                      <RDialog.Description className="sr-only">{title}</RDialog.Description>
                    )}
                  </div>
                  <RDialog.Close asChild>
                    <Button variant="ghost" size="icon" aria-label="Close"><X size={16} /></Button>
                  </RDialog.Close>
                </div>
                <div className="flex-1 overflow-y-auto px-5 pb-5">{children}</div>
                {footer && <div className="border-t border-line px-5 py-3.5 flex items-center gap-2">{footer}</div>}
              </motion.div>
            </RDialog.Content>
          </RDialog.Portal>
        )}
      </AnimatePresence>
    </RDialog.Root>
  )
}

/** Centered dialog. */
export function Dialog({ open, onOpenChange, title, description, children, width = 420 }) {
  return (
    <RDialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <RDialog.Portal forceMount>
            <Backdrop />
            <div className="fixed inset-0 z-50 grid place-items-center p-4 pointer-events-none">
              <RDialog.Content asChild forceMount>
                <motion.div
                  className="pointer-events-auto w-full bg-panel border border-line rounded-[14px] shadow-pop p-5 outline-none"
                  style={{ maxWidth: width }}
                  initial={{ opacity: 0, scale: 0.97, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, y: 8 }}
                  transition={{ duration: dur.base, ease }}
                >
                  <RDialog.Title className="text-base font-medium text-fg">{title}</RDialog.Title>
                  <RDialog.Description className={description ? 'text-sm text-muted mt-1' : 'sr-only'}>
                    {description || title}
                  </RDialog.Description>
                  <div className="mt-4">{children}</div>
                </motion.div>
              </RDialog.Content>
            </div>
          </RDialog.Portal>
        )}
      </AnimatePresence>
    </RDialog.Root>
  )
}

export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = 'Delete', onConfirm, loading }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={title} description={description} width={380}>
      <div className="flex justify-end gap-2">
        <Button onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button variant="danger-solid" onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
      </div>
    </Dialog>
  )
}
