import { motion, AnimatePresence } from 'framer-motion'
import Button from './Button'

export default function ConfirmModal({ isOpen, title = 'Are you sure?', message, onConfirm, onCancel, confirmLabel = 'Delete' }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
          onClick={(e) => e.target === e.currentTarget && onCancel()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="glass rounded-2xl p-6 w-full max-w-sm"
          >
            <h3 className="text-base font-semibold text-white mb-1">{title}</h3>
            {message && <p className="text-sm text-slate-400 mb-5">{message}</p>}
            {!message && <div className="mb-5" />}
            <div className="flex gap-3">
              <Button variant="ghost" onClick={onCancel} className="flex-1">Cancel</Button>
              <Button variant="danger" onClick={onConfirm} className="flex-1">{confirmLabel}</Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
