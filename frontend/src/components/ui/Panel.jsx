import { forwardRef } from 'react'
import { motion } from 'motion/react'
import { staggerItem } from '../../lib/motion'

/**
 * Content panel. Panels are the only "card" surface; they step up from the dotted canvas.
 * `title` renders a quiet header row with optional `action` on the right.
 */
const Panel = forwardRef(function Panel(
  { title, action, children, className = '', bodyClassName = '', as = 'section', flush = false, glow = true, ...props },
  ref,
) {
  const Comp = motion[as] || motion.section
  return (
    <Comp ref={ref} variants={staggerItem} data-glow={glow ? '' : undefined} className={`bg-panel border border-line rounded-panel ${className}`} {...props}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 px-4 pt-3.5 pb-1 min-h-[44px]">
          {typeof title === 'string' ? <h2 className="text-sm text-muted">{title}</h2> : title}
          {action}
        </header>
      )}
      <div className={`${flush ? '' : 'px-4 pb-4 pt-2'} ${bodyClassName}`}>{children}</div>
    </Comp>
  )
})

export default Panel
