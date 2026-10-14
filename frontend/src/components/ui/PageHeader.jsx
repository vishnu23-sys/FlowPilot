import { motion } from 'framer-motion'
import { spring, staggerItem } from '../../lib/motion'

/**
 * Page anatomy: small context line, serif title, actions on the right.
 * The title carries a shared layoutId so it morphs between pages instead of popping.
 */
export default function PageHeader({ context, title, actions, children }) {
  return (
    <motion.header variants={staggerItem} className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 mb-6">
      <div className="min-w-0">
        {context && <p className="text-sm text-muted mb-1.5">{context}</p>}
        <motion.h1 layoutId="page-title" layout="position" transition={spring.soft} className="serif text-[40px] md:text-[44px] text-fg">
          {title}
        </motion.h1>
        {children}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </motion.header>
  )
}
