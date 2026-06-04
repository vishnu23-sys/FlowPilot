import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import AppLayout from '../components/AppLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'
import { SkeletonRow } from '../components/ui/Skeleton'
import ConfirmModal from '../components/ui/ConfirmModal'
import apiClient from '../api/apiClient'
import { useAuth } from '../context/AuthContext'
import { CATEGORIES, PAYMENT_METHODS, formatAmount } from '../constants'

const today = new Date().toISOString().split('T')[0]

const emptyForm = { amount: '', category: 'Food', date: today, description: '', payment_method: 'Cash', is_recurring: false }

const BADGE = {
  Food: 'bg-orange-500/10 text-orange-400 border-orange-500/20', Transport: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Shopping: 'bg-pink-500/10 text-pink-400 border-pink-500/20', Entertainment: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Bills: 'bg-red-500/10 text-red-400 border-red-500/20', Health: 'bg-green-500/10 text-green-400 border-green-500/20',
  Education: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', Travel: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  Investments: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', Others: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
}

export default function Expenses() {
  const { user } = useAuth()
  const currency = user?.currency || 'USD'

  const [expenses, setExpenses]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [editing, setEditing]       = useState(null)
  const [form, setForm]             = useState(emptyForm)
  const [formError, setFormError]   = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const fetchExpenses = () => {
    setLoading(true)
    apiClient.get('/api/expenses').then(r => setExpenses(r.data.expenses)).finally(() => setLoading(false))
  }

  useEffect(() => { fetchExpenses() }, [])

  const openAdd  = () => { setForm(emptyForm); setEditing(null); setFormError(null); setShowForm(true) }
  const openEdit = (exp) => {
    setForm({ amount: exp.amount, category: exp.category, date: exp.date, description: exp.description || '', payment_method: exp.payment_method || 'Cash', is_recurring: exp.is_recurring })
    setEditing(exp); setFormError(null); setShowForm(true)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setFormError(null); setSubmitting(true)
    try {
      const payload = { ...form, amount: parseFloat(form.amount) }
      if (editing) { await apiClient.put(`/api/expenses/${editing.id}`, payload); toast.success('Expense updated') }
      else          { await apiClient.post('/api/expenses', payload);              toast.success('Expense added') }
      setShowForm(false); fetchExpenses()
    } catch (err) {
      const msg = err.response?.data?.error || 'Something went wrong'
      setFormError(msg); toast.error(msg)
    } finally { setSubmitting(false) }
  }

  const handleDelete = async () => {
    try {
      await apiClient.delete(`/api/expenses/${deleteTarget}`)
      toast.success('Expense deleted')
      fetchExpenses()
    } catch { toast.error('Failed to delete') }
    finally { setDeleteTarget(null) }
  }

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-xl font-semibold text-white">Expenses</h1>
          <p className="text-sm text-slate-600 mt-0.5">{expenses.length} transaction{expenses.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={openAdd}><Plus size={15} /> Add Expense</Button>
      </div>

      <Card delay={0.1} noPad className="overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-1">{Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}</div>
        ) : expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4"><Plus size={20} className="text-slate-600" /></div>
            <p className="text-slate-400 font-medium mb-1">No expenses yet</p>
            <p className="text-slate-600 text-sm mb-5">Track your first transaction to start seeing spending insights.</p>
            <Button onClick={openAdd}><Plus size={14} /> Add first expense</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['Date','Category','Description','Payment','Recurring','Amount',''].map(h => (
                    <th key={h} className={`px-5 py-3.5 text-[11px] font-medium uppercase tracking-wider text-slate-600 ${h==='Amount'?'text-right':'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {expenses.map((exp, i) => (
                  <motion.tr key={exp.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.025, duration: 0.2 }} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">{exp.date}</td>
                    <td className="px-5 py-3.5"><span className={`text-xs px-2 py-0.5 rounded-full border ${BADGE[exp.category]||BADGE.Others}`}>{exp.category}</span></td>
                    <td className="px-5 py-3.5 text-slate-400 max-w-[200px] truncate">{exp.description||'—'}</td>
                    <td className="px-5 py-3.5 text-slate-500">{exp.payment_method||'—'}</td>
                    <td className="px-5 py-3.5 text-slate-600">{exp.is_recurring?'Yes':'No'}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-white whitespace-nowrap">{formatAmount(exp.amount, currency)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 justify-end">
                        <button onClick={() => openEdit(exp)} className="p-1.5 text-slate-600 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"><Pencil size={13} /></button>
                        <button onClick={() => setDeleteTarget(exp.id)} className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add/Edit modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 12 }} transition={{ duration: 0.2, ease: 'easeOut' }} className="glass rounded-2xl p-6 w-full max-w-md">
              <h2 className="text-base font-semibold text-white mb-5">{editing ? 'Edit Expense' : 'Add Expense'}</h2>
              {formError && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-4">{formError}</div>}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs text-slate-500 mb-1.5">Amount *</label><Input name="amount" type="number" step="0.01" min="0" value={form.amount} onChange={handleChange} required placeholder="0.00" /></div>
                  <div><label className="block text-xs text-slate-500 mb-1.5">Date *</label><Input name="date" type="date" value={form.date} onChange={handleChange} required /></div>
                </div>
                <div><label className="block text-xs text-slate-500 mb-1.5">Category *</label><Select name="category" value={form.category} onChange={handleChange}>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</Select></div>
                <div><label className="block text-xs text-slate-500 mb-1.5">Description</label><Input name="description" type="text" value={form.description} onChange={handleChange} placeholder="Optional" /></div>
                <div><label className="block text-xs text-slate-500 mb-1.5">Payment method</label><Select name="payment_method" value={form.payment_method} onChange={handleChange}>{PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}</Select></div>
                <label className="flex items-center gap-3 cursor-pointer py-1 select-none"><input name="is_recurring" type="checkbox" checked={form.is_recurring} onChange={handleChange} className="w-4 h-4 rounded accent-blue-500" /><span className="text-sm text-slate-400">Recurring expense</span></label>
                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={submitting} className="flex-1">{submitting ? 'Saving...' : editing ? 'Save changes' : 'Add expense'}</Button>
                  <Button type="button" variant="ghost" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={deleteTarget !== null}
        title="Delete expense?"
        message="This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AppLayout>
  )
}
