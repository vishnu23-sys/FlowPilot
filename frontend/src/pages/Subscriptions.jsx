import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, RefreshCw, DollarSign, Calendar } from 'lucide-react'
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

const today = new Date().toISOString().split('T')[0]
const emptyForm = { name: '', amount: '', billing_cycle: 'monthly', next_renewal_date: today, is_active: true }

function daysUntil(dateStr) {
  return Math.ceil((new Date(dateStr) - new Date(new Date().toDateString())) / 86400000)
}

export default function Subscriptions() {
  const { user } = useAuth()
  const currency = user?.currency || 'USD'

  const [subs, setSubs]             = useState([])
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
    Promise.all([apiClient.get('/api/subscriptions'), apiClient.get('/api/subscriptions/summary')])
      .then(([s, sm]) => { setSubs(s.data.subscriptions); setSummary(sm.data) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const openAdd  = () => { setForm(emptyForm); setEditing(null); setFormError(null); setShowForm(true) }
  const openEdit = (sub) => {
    setForm({ name: sub.name, amount: sub.amount, billing_cycle: sub.billing_cycle, next_renewal_date: sub.next_renewal_date, is_active: sub.is_active })
    setEditing(sub); setFormError(null); setShowForm(true)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setFormError(null); setSubmitting(true)
    try {
      const payload = { ...form, amount: parseFloat(form.amount) }
      if (editing) { await apiClient.put(`/api/subscriptions/${editing.id}`, payload); toast.success('Subscription updated') }
      else          { await apiClient.post('/api/subscriptions', payload);               toast.success('Subscription added') }
      setShowForm(false); fetchData()
    } catch (err) {
      const msg = err.response?.data?.error || 'Something went wrong'
      setFormError(msg); toast.error(msg)
    } finally { setSubmitting(false) }
  }

  const handleDelete = async () => {
    try { await apiClient.delete(`/api/subscriptions/${deleteTarget}`); toast.success('Subscription deleted'); fetchData() }
    catch { toast.error('Failed to delete') }
    finally { setDeleteTarget(null) }
  }

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-xl font-semibold text-white">Subscriptions</h1>
          <p className="text-sm text-slate-600 mt-0.5">{subs.filter(s => s.is_active).length} active subscription{subs.filter(s => s.is_active).length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={openAdd}><Plus size={15} /> Add Subscription</Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard label="Monthly cost"   numericValue={summary?.monthly_total || 0} currencyCode={currency} icon={RefreshCw}  gradient="from-blue-600 to-cyan-500"    delay={0} />
          <StatCard label="Yearly cost"    numericValue={summary?.yearly_total   || 0} currencyCode={currency} icon={DollarSign} gradient="from-purple-600 to-pink-500"  delay={0.08} />
          <StatCard label="Total per year" numericValue={summary?.total_yearly   || 0} currencyCode={currency} icon={Calendar}   gradient="from-emerald-600 to-teal-500" delay={0.16} />
        </div>
      )}

      {!loading && summary?.upcoming_renewals?.length > 0 && (
        <Card delay={0.15} className="mb-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={14} className="text-amber-400" />
            <p className="text-sm font-medium text-slate-300">Upcoming renewals</p>
            <span className="text-xs text-slate-600 ml-1">next 30 days</span>
          </div>
          <div className="space-y-0.5">
            {summary.upcoming_renewals.map(sub => {
              const days = daysUntil(sub.next_renewal_date)
              return (
                <div key={sub.id} className="flex items-center gap-3 py-2.5 border-b border-white/[0.05] last:border-0">
                  <div className="flex-1 min-w-0"><p className="text-sm text-slate-200">{sub.name}</p><p className="text-xs text-slate-600 mt-0.5">{sub.next_renewal_date}</p></div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border whitespace-nowrap ${days <= 7 ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                    {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days} days`}
                  </span>
                  <p className="text-sm font-semibold text-white whitespace-nowrap">{formatAmount(sub.amount, currency)}</p>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      <Card delay={0.2} noPad className="overflow-hidden">
        {loading ? <div className="p-6 text-slate-600 text-sm">Loading...</div>
        : subs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4"><RefreshCw size={18} className="text-slate-600" /></div>
            <p className="text-slate-400 font-medium mb-1">No subscriptions yet</p>
            <p className="text-slate-600 text-sm mb-5">Track your recurring bills — Netflix, Spotify, gym memberships.</p>
            <Button onClick={openAdd}><Plus size={14} /> Add first subscription</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-white/[0.06]">
                {['Name','Billing','Next renewal','Status','Amount',''].map(h => (
                  <th key={h} className={`px-5 py-3.5 text-[11px] font-medium uppercase tracking-wider text-slate-600 ${h==='Amount'?'text-right':'text-left'}`}>{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-white/[0.04]">
                {subs.map((sub, i) => (
                  <motion.tr key={sub.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.025 }} className={`hover:bg-white/[0.02] transition-colors ${!sub.is_active ? 'opacity-40' : ''}`}>
                    <td className="px-5 py-3.5 text-slate-200 font-medium">{sub.name}</td>
                    <td className="px-5 py-3.5"><span className={`text-xs px-2 py-0.5 rounded-full border ${sub.billing_cycle==='monthly'?'bg-blue-500/10 text-blue-400 border-blue-500/20':'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>{sub.billing_cycle}</span></td>
                    <td className="px-5 py-3.5 text-slate-500">{sub.next_renewal_date}</td>
                    <td className="px-5 py-3.5"><span className={`text-xs px-2 py-0.5 rounded-full border ${sub.is_active?'bg-green-500/10 text-green-400 border-green-500/20':'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>{sub.is_active?'Active':'Inactive'}</span></td>
                    <td className="px-5 py-3.5 text-right font-semibold text-white whitespace-nowrap">{formatAmount(sub.amount, currency)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 justify-end">
                        <button onClick={() => openEdit(sub)} className="p-1.5 text-slate-600 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"><Pencil size={13} /></button>
                        <button onClick={() => setDeleteTarget(sub.id)} className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 12 }} transition={{ duration: 0.2, ease: 'easeOut' }} className="glass rounded-2xl p-6 w-full max-w-md">
              <h2 className="text-base font-semibold text-white mb-5">{editing ? 'Edit Subscription' : 'Add Subscription'}</h2>
              {formError && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-4">{formError}</div>}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div><label className="block text-xs text-slate-500 mb-1.5">Name *</label><Input name="name" value={form.name} onChange={handleChange} required placeholder="e.g. Netflix" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs text-slate-500 mb-1.5">Amount *</label><Input name="amount" type="number" step="0.01" min="0" value={form.amount} onChange={handleChange} required placeholder="0.00" /></div>
                  <div><label className="block text-xs text-slate-500 mb-1.5">Billing cycle</label><Select name="billing_cycle" value={form.billing_cycle} onChange={handleChange}><option value="monthly">Monthly</option><option value="yearly">Yearly</option></Select></div>
                </div>
                <div><label className="block text-xs text-slate-500 mb-1.5">Next renewal date *</label><Input name="next_renewal_date" type="date" value={form.next_renewal_date} onChange={handleChange} required /></div>
                <label className="flex items-center gap-3 cursor-pointer py-1 select-none"><input name="is_active" type="checkbox" checked={form.is_active} onChange={handleChange} className="w-4 h-4 rounded accent-blue-500" /><span className="text-sm text-slate-400">Active subscription</span></label>
                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={submitting} className="flex-1">{submitting ? 'Saving...' : editing ? 'Save changes' : 'Add subscription'}</Button>
                  <Button type="button" variant="ghost" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal isOpen={deleteTarget !== null} title="Delete subscription?" message="This action cannot be undone." onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </AppLayout>
  )
}
