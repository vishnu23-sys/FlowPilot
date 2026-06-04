import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { User, ShieldCheck, LogOut, CheckCircle, XCircle, AlertCircle, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import AppLayout from '../components/AppLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'
import apiClient from '../api/apiClient'
import { useAuth } from '../context/AuthContext'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'SGD', 'AED']

const TABS = [
  { id: 'profile',  label: 'Profile',  icon: User        },
  { id: 'security', label: 'Security', icon: ShieldCheck },
]

function StatusBanner({ status }) {
  if (!status) return null
  const isOk = status.type === 'success'
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm ${
        isOk ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
      }`}
    >
      {isOk ? <CheckCircle size={14} className="shrink-0" /> : <AlertCircle size={14} className="shrink-0" />}
      {status.message}
    </motion.div>
  )
}

function PasswordRule({ ok, label }) {
  return (
    <div className={`flex items-center gap-2 text-xs transition-colors ${ok ? 'text-emerald-400' : 'text-slate-600'}`}>
      {ok ? <Check size={11} /> : <XCircle size={11} />}
      {label}
    </div>
  )
}

function checkPw(pw) {
  return {
    length:    pw.length >= 8,
    uppercase: /[A-Z]/.test(pw),
    special:   /[!@#$%^&*(),.?":{}|<>\-_+=\[\]\\;'`~]/.test(pw),
  }
}

export default function Settings() {
  const { user, updateUser, logout } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('profile')

  // ── Profile state ─────────────────────────────────────────────
  const initProfile = () => {
    const parts = (user?.full_name || '').split(' ')
    return {
      first_name:     parts[0] || '',
      last_name:      parts.slice(1).join(' ') || '',
      monthly_income: user?.monthly_income != null ? String(user.monthly_income) : '',
      currency:       user?.currency || 'USD',
    }
  }
  const [profile, setProfile] = useState(initProfile)
  const [profileStatus, setProfileStatus] = useState(null)
  const [savingProfile, setSavingProfile] = useState(false)

  // ── Security state ────────────────────────────────────────────
  const [email, setEmail]       = useState(user?.email || '')
  const [emailStatus, setEmailStatus] = useState(null)
  const [savingEmail, setSavingEmail] = useState(false)

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [pwStatus, setPwStatus]   = useState(null)
  const [savingPw, setSavingPw]   = useState(false)
  const pwChecks = checkPw(pw.next)
  const pwValid  = Object.values(pwChecks).every(Boolean)

  // Refresh from API on mount (ensures fresh data)
  useEffect(() => {
    apiClient.get('/api/profile').then(r => {
      const u = r.data.user
      const parts = (u.full_name || '').split(' ')
      setProfile({
        first_name:     parts[0] || '',
        last_name:      parts.slice(1).join(' ') || '',
        monthly_income: u.monthly_income != null ? String(u.monthly_income) : '',
        currency:       u.currency || 'USD',
      })
      setEmail(u.email || '')
    }).catch(() => {})
  }, [])

  // ── Handlers ──────────────────────────────────────────────────
  const handleProfileSave = async (e) => {
    e.preventDefault()
    setSavingProfile(true); setProfileStatus(null)
    try {
      const full_name = [profile.first_name, profile.last_name].filter(Boolean).join(' ')
      if (!full_name) { setProfileStatus({ type: 'error', message: 'Name cannot be empty.' }); return }
      const res = await apiClient.put('/api/profile', {
        full_name,
        currency: profile.currency,
        monthly_income: profile.monthly_income === '' ? null : parseFloat(profile.monthly_income),
      })
      updateUser(res.data.user)
      setProfileStatus({ type: 'success', message: 'Profile saved.' })
      toast.success('Profile saved')
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to save.'
      setProfileStatus({ type: 'error', message: msg })
      toast.error(msg)
    } finally { setSavingProfile(false) }
  }

  const handleEmailSave = async (e) => {
    e.preventDefault()
    setSavingEmail(true); setEmailStatus(null)
    try {
      const res = await apiClient.put('/api/profile', { email })
      updateUser(res.data.user)
      setEmailStatus({ type: 'success', message: 'Email updated.' })
      toast.success('Email updated')
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to update email.'
      setEmailStatus({ type: 'error', message: msg })
      toast.error(msg)
    } finally { setSavingEmail(false) }
  }

  const handlePwSave = async (e) => {
    e.preventDefault()
    if (!pwValid) { setPwStatus({ type: 'error', message: 'Password does not meet all requirements.' }); return }
    if (pw.next !== pw.confirm) { setPwStatus({ type: 'error', message: 'Passwords do not match.' }); return }
    setSavingPw(true); setPwStatus(null)
    try {
      await apiClient.put('/api/profile/password', { current_password: pw.current, new_password: pw.next })
      setPwStatus({ type: 'success', message: 'Password changed successfully.' })
      setPw({ current: '', next: '', confirm: '' })
      toast.success('Password changed')
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to change password.'
      setPwStatus({ type: 'error', message: msg })
      toast.error(msg)
    } finally { setSavingPw(false) }
  }

  const handleLogout = () => { logout(); navigate('/login') }

  const initials = user?.full_name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?'

  return (
    <AppLayout>
      <div className="mb-7">
        <h1 className="text-xl font-semibold text-white">Settings</h1>
        <p className="text-sm text-slate-600 mt-0.5">Manage your profile, security, and preferences</p>
      </div>

      <div className="flex gap-5 flex-col md:flex-row">
        {/* Left panel */}
        <div className="md:w-56 shrink-0">
          <Card delay={0.1} className="p-4">
            {/* Avatar */}
            <div className="flex flex-col items-center py-4 border-b border-white/[0.06] mb-3">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold mb-2">
                {initials}
              </div>
              <p className="text-sm font-medium text-white text-center">{user?.full_name}</p>
              <p className="text-xs text-slate-600 text-center mt-0.5 truncate max-w-full">{user?.email}</p>
            </div>

            {/* Tab nav */}
            <nav className="space-y-0.5 mb-3">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all ${
                    tab === id
                      ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                      : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </nav>

            {/* Logout */}
            <div className="pt-3 border-t border-white/[0.06]">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          </Card>
        </div>

        {/* Right panel */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {tab === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                <Card delay={0}>
                  <p className="text-sm font-medium text-slate-300 mb-5">Profile information</p>
                  <form onSubmit={handleProfileSave} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-500 mb-1.5">First name</label>
                        <Input
                          value={profile.first_name}
                          onChange={e => { setProfile(p => ({ ...p, first_name: e.target.value })); setProfileStatus(null) }}
                          placeholder="First name"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1.5">Last name</label>
                        <Input
                          value={profile.last_name}
                          onChange={e => { setProfile(p => ({ ...p, last_name: e.target.value })); setProfileStatus(null) }}
                          placeholder="Last name"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-500 mb-1.5">
                          Monthly income
                          {!profile.monthly_income && <span className="ml-1 text-amber-500/80">← unlocks health score</span>}
                        </label>
                        <Input
                          type="number" min="0" step="0.01"
                          value={profile.monthly_income}
                          onChange={e => { setProfile(p => ({ ...p, monthly_income: e.target.value })); setProfileStatus(null) }}
                          placeholder="e.g. 3000"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1.5">Currency</label>
                        <Select
                          value={profile.currency}
                          onChange={e => { setProfile(p => ({ ...p, currency: e.target.value })); setProfileStatus(null) }}
                        >
                          {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </Select>
                      </div>
                    </div>

                    <StatusBanner status={profileStatus} />

                    <Button type="submit" disabled={savingProfile} className="w-full">
                      {savingProfile ? 'Saving...' : 'Save profile'}
                    </Button>
                  </form>
                </Card>
              </motion.div>
            )}

            {tab === 'security' && (
              <motion.div key="security" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="space-y-4">
                {/* Change email */}
                <Card delay={0}>
                  <p className="text-sm font-medium text-slate-300 mb-4">Email address</p>
                  <form onSubmit={handleEmailSave} className="space-y-3">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1.5">Email</label>
                      <Input
                        type="email"
                        value={email}
                        onChange={e => { setEmail(e.target.value); setEmailStatus(null) }}
                        required
                        placeholder="you@example.com"
                      />
                    </div>
                    <StatusBanner status={emailStatus} />
                    <Button type="submit" disabled={savingEmail} className="w-full">
                      {savingEmail ? 'Updating...' : 'Update email'}
                    </Button>
                  </form>
                </Card>

                {/* Change password */}
                <Card delay={0.1}>
                  <p className="text-sm font-medium text-slate-300 mb-4">Change password</p>
                  <form onSubmit={handlePwSave} className="space-y-3">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1.5">Current password</label>
                      <Input
                        type="password"
                        value={pw.current}
                        onChange={e => { setPw(p => ({ ...p, current: e.target.value })); setPwStatus(null) }}
                        required placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1.5">New password</label>
                      <Input
                        type="password"
                        value={pw.next}
                        onChange={e => { setPw(p => ({ ...p, next: e.target.value })); setPwStatus(null) }}
                        required placeholder="••••••••"
                      />
                      {pw.next && (
                        <div className="mt-2 grid grid-cols-3 gap-1.5">
                          <PasswordRule ok={pwChecks.length}    label="8+ characters" />
                          <PasswordRule ok={pwChecks.uppercase} label="Uppercase letter" />
                          <PasswordRule ok={pwChecks.special}   label="Special character" />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1.5">Confirm new password</label>
                      <Input
                        type="password"
                        value={pw.confirm}
                        onChange={e => { setPw(p => ({ ...p, confirm: e.target.value })); setPwStatus(null) }}
                        required placeholder="••••••••"
                      />
                    </div>
                    <StatusBanner status={pwStatus} />
                    <Button type="submit" disabled={savingPw || !pwValid} variant="ghost" className="w-full">
                      {savingPw ? 'Updating...' : 'Change password'}
                    </Button>
                  </form>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AppLayout>
  )
}
