import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import apiClient from '../api/apiClient'
import Button from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'

export default function Signup() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    monthly_income: '',
    currency: 'USD',
  })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const payload = {
        ...form,
        monthly_income: form.monthly_income ? parseFloat(form.monthly_income) : null,
      }
      const res = await apiClient.post('/api/auth/register', payload)
      login(res.data.token, res.data.user)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#070c18] flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-0 right-1/3 w-[500px] h-[500px] bg-purple-600/[0.07] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-blue-600/[0.07] rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="glass rounded-2xl p-8 w-full max-w-sm mx-4 relative z-10"
      >
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">FP</span>
          </div>
          <span className="font-semibold text-white text-lg tracking-tight">FlowPilot</span>
        </div>

        <h1 className="text-xl font-bold text-white mb-1">Create your account</h1>
        <p className="text-sm text-slate-500 mb-6">Start tracking your finances today</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">Full name</label>
            <Input name="full_name" type="text" placeholder="John Doe" value={form.full_name} onChange={handleChange} required />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">Email</label>
            <Input name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">Password</label>
            <Input name="password" type="password" placeholder="••••••••" value={form.password} onChange={handleChange} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Monthly income</label>
              <Input name="monthly_income" type="number" placeholder="Optional" value={form.monthly_income} onChange={handleChange} min="0" step="0.01" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Currency</label>
              <Select name="currency" value={form.currency} onChange={handleChange}>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="INR">INR</option>
              </Select>
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full mt-2">
            {loading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>

        <p className="text-sm text-slate-600 mt-6 text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-400 hover:text-blue-300 transition-colors">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
