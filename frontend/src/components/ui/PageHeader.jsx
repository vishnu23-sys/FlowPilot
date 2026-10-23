import { useEffect } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { staggerItem } from '../../lib/motion'
import { setPageTitle, TITLE_TUCK } from '../../lib/interactions'
import { usePreferences } from '../../lib/preferences'

/**
 * Page anatomy: small context line, serif title, actions on the right.
 * As the page scrolls, the title shrinks and fades while the top bar picks it up.
 */
export default function PageHeader({ context, title, actions, children }) {
  const { reduceMotion } = usePreferences()
  const { scrollY } = useScroll()
  const scale = useTransform(scrollY, TITLE_TUCK, [1, 0.82])
  const opacity = useTransform(scrollY, TITLE_TUCK, [1, 0])
  const y = useTransform(scrollY, TITLE_TUCK, [0, 10])

  useEffect(() => {
    setPageTitle(typeof title === 'string' ? title : '')
    return () => setPageTitle('')
  }, [title])

  return (
    <motion.header variants={staggerItem} className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 mb-6">
      <div className="min-w-0">
        {context && <p className="text-sm text-muted mb-1.5">{context}</p>}
        <motion.h1
          style={reduceMotion ? undefined : { scale, opacity, y, transformOrigin: 'left bottom' }}
          className="serif text-[40px] md:text-[44px] text-fg"
        >
          {title}
        </motion.h1>
        {children}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </motion.header>
  )
}
