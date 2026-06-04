import { motion } from 'framer-motion'
import { useCountUp } from '../../hooks/useCountUp'
import { getCurrencySymbol } from '../../constants'

export default function StatCard({ label, value, numericValue, currencyCode, sub, icon: Icon, gradient = 'from-blue-600 to-purple-600', delay = 0 }) {
  const animated = useCountUp(numericValue ?? 0)

  const displayValue = numericValue != null
    ? `${getCurrencySymbol(currencyCode)}${animated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : value

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className="glass rounded-2xl p-5 flex items-start gap-4"
    >
      {Icon && (
        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${gradient} shrink-0`}>
          <Icon size={17} className="text-white" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs text-slate-500 mb-1">{label}</p>
        <p className="text-2xl font-bold text-white truncate leading-tight">{displayValue}</p>
        {sub && <p className="text-xs text-slate-600 mt-1">{sub}</p>}
      </div>
    </motion.div>
  )
}
