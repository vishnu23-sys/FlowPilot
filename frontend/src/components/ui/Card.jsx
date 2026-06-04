import { motion } from 'framer-motion'

export default function Card({ children, className = '', delay = 0, noPad = false, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: 'easeOut' }}
      className={`glass rounded-2xl ${noPad ? '' : 'p-5'} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  )
}
