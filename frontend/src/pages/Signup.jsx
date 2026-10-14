import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import apiClient, { errorMessage } from '../api/apiClient'
import AuthLayout from '../components/brand/AuthLayout'
import Button from '../components/ui/Button'
import { Field, Input, Select } from '../components/ui/Input'
import { CURRENCIES, formatMoney } from '../lib/format'
import { checkPassword } from '../lib/password'

function guessCurrency() {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
  if (tz.startsWith('Asia/Kolkata') || tz.startsWith('Asia/Calcutta')) return 'INR'
  if (tz.startsWith('Europe/London')) return 'GBP'
  if (tz.startsWith('Europe/')) return 'EUR'
  if (tz.startsWith('Australia/')) return 'AUD'
  if (tz.startsWith('Asia/Singapore')) return 'SGD'
  if (tz.startsWith('Asia/Dubai')) return 'AED'
  return 'USD'
}

export default function Signup() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ full_name: '', email: '', password: '', currency: guessCurrency() })
  const [touched, setTouched] = useState({})
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const pw = checkPassword(form.password)

  const errors = {
    full_name: !form.full_name.trim() ? 'Enter your name' : null,
    email: !/^\S+@\S+\.\S+$/.test(form.email) ? 'Enter a valid email' : null,
    password: !pw.valid ? 'Meet each rule below' : null,
  }

  const set = (patch) => {
    setForm((f) => ({ ...f, ...patch }))
    setError(null)
  }
  const blur = (k) => () => setTouched((t) => ({ ...t, [k]: true }))

  const submit = async (e) => {
    e.preventDefault()
    setTouched({ full_name: true, email: true, password: true })
    if (Object.values(errors).some(Boolean)) return
    setLoading(true)
    try {
      const res = await apiClient.post('/api/auth/register', { ...form, full_name: form.full_name.trim() })
      login(res.data.token, res.data.user)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(errorMessage(err, "Couldn't create your account. Try again."))
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <h1 className="serif text-[44px] leading-none">Create your account</h1>
      <p className="mt-3 text-sm text-muted">Free, and it takes under a minute.</p>

      <AnimatePresence>
        {error && (
          <motion.p role="alert" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="mt-6 overflow-hidden rounded-control border border-danger/30 bg-danger/10 px-3 py-2.5 text-sm text-danger">
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
        <Field label="Name" error={touched.full_name && errors.full_name}>
          {(a) => <Input {...a} autoComplete="name" autoFocus placeholder="Asha Rao" value={form.full_name}
            onBlur={blur('full_name')} onChange={(e) => set({ full_name: e.target.value })} />}
        </Field>
        <Field label="Email" error={touched.email && errors.email}>
          {(a) => <Input {...a} type="email" autoComplete="email" placeholder="you@example.com" value={form.email}
            onBlur={blur('email')} onChange={(e) => set({ email: e.target.value })} />}
        </Field>
        <Field label="Password" error={touched.password && errors.password}>
          {(a) => <Input {...a} type="password" autoComplete="new-password" value={form.password}
            onBlur={blur('password')} onChange={(e) => set({ password: e.target.value })} />}
        </Field>
        <ul className="grid grid-cols-1 gap-1 -mt-1" aria-live="polite">
          {pw.results.map((r) => (
            <li key={r.id} className={`flex items-center gap-1.5 text-xs transition-colors ${r.ok ? 'text-success' : 'text-muted'}`}>
              {r.ok ? <Check size={12} aria-hidden="true" /> : <X size={12} aria-hidden="true" />}{r.label}
            </li>
          ))}
        </ul>
        <Field label="Currency" hint="You can change this later in Settings.">
          {(a) => (
            <Select {...a} value={form.currency} onChange={(e) => set({ currency: e.target.value })}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}, {formatMoney(1234, c)}</option>)}
            </Select>
          )}
        </Field>
        <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full justify-center mt-2">Create account</Button>
      </form>

      <p className="mt-8 text-sm text-muted">
        Already have an account? <Link to="/login" className="text-fg underline underline-offset-4 decoration-line-strong hover:decoration-accent">Log in</Link>
      </p>
    </AuthLayout>
  )
}
