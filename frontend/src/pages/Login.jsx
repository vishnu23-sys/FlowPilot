import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useAuth } from '../context/AuthContext'
import apiClient, { errorMessage } from '../api/apiClient'
import AuthLayout from '../components/brand/AuthLayout'
import Button from '../components/ui/Button'
import { Field, Input } from '../components/ui/Input'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const set = (patch) => {
    setForm((f) => ({ ...f, ...patch }))
    setError(null)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) return setError('Enter your email and password.')
    setLoading(true)
    try {
      const res = await apiClient.post('/api/auth/login', form)
      login(res.data.token, res.data.user)
      navigate(location.state?.from || '/dashboard', { replace: true })
    } catch (err) {
      setError(errorMessage(err, "Couldn't log in. Try again."))
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <h1 className="serif text-[44px] leading-none">Welcome back</h1>
      <p className="mt-3 text-sm text-muted">Log in to pick up where you left off.</p>

      <AnimatePresence>
        {error && (
          <motion.p role="alert" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="mt-6 overflow-hidden rounded-control border border-danger/30 bg-danger/10 px-3 py-2.5 text-sm text-danger">
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
        <Field label="Email">
          {(a) => <Input {...a} type="email" autoComplete="email" autoFocus placeholder="you@example.com"
            value={form.email} onChange={(e) => set({ email: e.target.value })} />}
        </Field>
        <Field label="Password">
          {(a) => <Input {...a} type="password" autoComplete="current-password"
            value={form.password} onChange={(e) => set({ password: e.target.value })} />}
        </Field>
        <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full justify-center mt-2">Log in</Button>
      </form>

      <p className="mt-8 text-sm text-muted">
        New to FlowPilot? <Link to="/signup" className="text-fg underline underline-offset-4 decoration-line-strong hover:decoration-accent">Create an account</Link>
      </p>
    </AuthLayout>
  )
}
