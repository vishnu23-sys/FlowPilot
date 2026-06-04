import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, Check, RotateCcw, ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import toast from 'react-hot-toast'
import AppLayout from '../components/AppLayout'
import Card from '../components/ui/Card'
import StatCard from '../components/ui/StatCard'
import Button from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'
import { SkeletonCard } from '../components/ui/Skeleton'
import ConfirmModal from '../components/ui/ConfirmModal'
import apiClient from '../api/apiClient'
import { useAuth } from '../context/AuthContext'
import { formatAmount } from '../constants'

const emptyForm = { person_name: '', amount: '', type: 'i_owe', description: '' }

function DebtItem({ debt, currency, onSettle, onEdit, onDelete }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-3 py-3 border-b border-white/[0.05] last:border-0 transition-opacity ${debt.is_settled ? 'opacity-40' : ''}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-slate-200">{debt.person_name}</p>
          {debt.is_settled && <span className="text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 px-1.5 py-0.5 rounded-full">Settled</span>}
        </div>
        {debt.description && <p className="text-xs text-slate-600 mt-0.5 truncate">{debt.description}</p>}
      </div>
      <p className={`text-sm font-semibold whitespace-nowrap ${debt.type === 'owed_to_me' ? 'text-green-400' : 'text-red-400'}`}>
        {formatAmount(debt.amount, currency)}
      </p>
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={() => onSettle(debt)} title={debt.is_settled ? 'Mark unsettled' : 'Mark settled'} className={`p-1.5 rounded-lg transition-all ${debt.is_settled ? 'text-slate-600 hover:text-blue-400 hover:bg-blue-500/10' : 'text-slate-600 hover:text-green-400 hover:bg-green-500/10'}`}>
          {debt.is_settled ? <RotateCcw size={13} /> : <Check size={13} />}
        </button>
        <button onClick={() => onEdit(debt)} className="p-1.5 text-slate-600 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"><Pencil size={13} /></button>
        <button onClick={() => onDelete(debt.id)} className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={13} /></button>
      </div>
    </motion.div>
  )
}

export default function Debts() {
  const { user } = useAuth()
  const currency = user?.currency || 'USD'

  const [debts, setDebts]           = useState([])
  const [summary, setSummary]       = useState(null)
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [editing, setEditing]       = useState(null)
  const [form, setForm]             = useState(emptyForm)
  const [formError, setFormError]   = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const fetchData = () => {
    setLoading(true)
    Promise.all([apiClient.get('/api/debts'), apiClient.get('/api/debts/summary')])
      .then(([d, s]) => { setDebts(d.data.debts); setSummary(s.data) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const openAdd  = () => { setForm(emptyForm); setEditing(null); setFormError(null); setShowForm(true) }
  const openEdit = (debt) => {
    setForm({ person_name: debt.person_name, amount: debt.amount, type: debt.type, description: debt.description || '' })
    setEditing(debt); setFormError(null); setShowForm(true)
  }

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault(); setFormError(null); setSubmitting(true)
    try {
      const payload = { ...form, amount: parseFloat(form.amount) }
      if (editing) { await apiClient.put(`/api/debts/${editing.id}`, payload); toast.success('Debt updated') }
      else          { await apiClient.post('/api/debts', payload);               toast.success('Debt added') }
      setShowForm(false); fetchData()
    } catch (err) {
      const msg = err.response?.data?.error || 'Something went wrong'
      setFormError(msg); toast.error(msg)
    } finally { setSubmitting(false) }
  }

  const handleSettle = async (debt) => {
    await apiClient.put(`/api/debts/${debt.id}`, { is_settled: !debt.is_settled })
    toast.success(debt.is_settled ? 'Marked as unsettled' : 'Marked as settled')
    fetchData()
  }

  const handleDelete = async () => {
    try { await apiClient.delete(`/api/debts/${deleteTarget}`); toast.success('Debt deleted'); fetchData() }
    catch { toast.error('Failed to delete') }
    finally { setDeleteTarget(null) }
  }

  const owedToMe = debts.filter(d => d.type === 'owed_to_me')
  const iOwe     = debts.filter(d => d.type === 'i_owe')

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-xl font-semibold text-white">Debts & Split</h1>
          <p className="text-sm text-slate-600 mt-0.5">Track what you owe and what's owed to you</p>
        </div>
        <Button onClick={openAdd}><Plus size={15} /> Add Debt</Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6"><SkeletonCard /><SkeletonCard /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <StatCard label="You are owed" numericValue={summary?.total_owed_to_me || 0} currencyCode={currency} sub="unsettled balance" icon={ArrowDownLeft} gradient="from-emerald-600 to-teal-500" delay={0} />
          <StatCard label="You owe"      numericValue={summary?.total_i_owe || 0}      currencyCode={currency} sub="unsettled balance" icon={ArrowUpRight}  gradient="from-red-600 to-rose-500"    delay={0.08} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card delay={0.15}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
            <p className="text-sm font-medium text-slate-300">You are owed</p>
            <span className="ml-auto text-xs text-slate-600">{owedToMe.length} record{owedToMe.length !== 1 ? 's' : ''}</span>
          </div>
          {owedToMe.length === 0 ? <p className="text-slate-600 text-sm py-6 text-center">Nothing owed to you yet.</p>
            : owedToMe.map(d => <DebtItem key={d.id} debt={d} currency={currency} onSettle={handleSettle} onEdit={openEdit} onDelete={setDeleteTarget} />)}
        </Card>

        <Card delay={0.2}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
            <p className="text-sm font-medium text-slate-300">You owe</p>
            <span className="ml-auto text-xs text-slate-600">{iOwe.length} record{iOwe.length !== 1 ? 's' : ''}</span>
          </div>
          {iOwe.length === 0 ? <p className="text-slate-600 text-sm py-6 text-center">You don't owe anyone.</p>
            : iOwe.map(d => <DebtItem key={d.id} debt={d} currency={currency} onSettle={handleSettle} onEdit={openEdit} onDelete={setDeleteTarget} />)}
        </Card>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 12 }} transition={{ duration: 0.2, ease: 'easeOut' }} className="glass rounded-2xl p-6 w-full max-w-md">
              <h2 className="text-base font-semibold text-white mb-5">{editing ? 'Edit Debt' : 'Add Debt'}</h2>
              {formError && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-4">{formError}</div>}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div><label className="block text-xs text-slate-500 mb-1.5">Person name *</label><Input name="person_name" value={form.person_name} onChange={handleChange} required placeholder="e.g. Alex" /></div>
                <div><label className="block text-xs text-slate-500 mb-1.5">Direction *</label><Select name="type" value={form.type} onChange={handleChange}><option value="i_owe">I owe them</option><option value="owed_to_me">They owe me</option></Select></div>
                <div><label className="block text-xs text-slate-500 mb-1.5">Amount *</label><Input name="amount" type="number" step="0.01" min="0" value={form.amount} onChange={handleChange} required placeholder="0.00" /></div>
                <div><label className="block text-xs text-slate-500 mb-1.5">Description</label><Input name="description" value={form.description} onChange={handleChange} placeholder="e.g. Dinner split" /></div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={submitting} className="flex-1">{submitting ? 'Saving...' : editing ? 'Save changes' : 'Add debt'}</Button>
                  <Button type="button" variant="ghost" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal isOpen={deleteTarget !== null} title="Delete debt?" message="This action cannot be undone." onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </AppLayout>
  )
}
