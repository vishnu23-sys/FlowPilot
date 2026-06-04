import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import apiClient from '../api/apiClient'
import Button from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await apiClient.post('/api/auth/login', form)
      login(res.data.token, res.data.user)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#070c18] flex items-center justify-center relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/[0.07] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-600/[0.07] rounded-full blur-3xl pointer-events-none" />

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

        <h1 className="text-xl font-bold text-white mb-1">Welcome back</h1>
        <p className="text-sm text-slate-500 mb-6">Sign in to your account to continue</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">Email</label>
            <Input name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">Password</label>
            <Input name="password" type="password" placeholder="••••••••" value={form.password} onChange={handleChange} required />
          </div>
          <Button type="submit" disabled={loading} className="w-full mt-2">
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <p className="text-sm text-slate-600 mt-6 text-center">
          No account?{' '}
          <Link to="/signup" className="text-blue-400 hover:text-blue-300 transition-colors">
            Create one
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
