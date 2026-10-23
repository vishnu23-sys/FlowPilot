import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import toast from 'react-hot-toast'
import { Check, X, Sun, Moon, Monitor, Keyboard, LogOut } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Panel from '../components/ui/Panel'
import Button from '../components/ui/Button'
import Segmented, { directionOf } from '../components/ui/Segmented'
import { Field, Input, MoneyInput, Select } from '../components/ui/Input'
import { Switch } from '../components/ui/Controls'
import ShortcutsDialog from '../components/shell/ShortcutsDialog'
import apiClient, { errorMessage } from '../api/apiClient'
import { invalidateFinance } from '../api/queries'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { ACCENTS, usePreferences } from '../lib/preferences'
import { CURRENCIES, currencySymbol } from '../lib/format'
import { checkPassword } from '../lib/password'
import { usePageEntrance } from '../lib/entrance'
import { spring, tabContentVariants } from '../lib/motion'

const TABS = [
  { value: 'profile', label: 'Profile' },
  { value: 'preferences', label: 'Preferences' },
  { value: 'security', label: 'Security' },
]

function Row({ title, description, children }) {
  return (
    <div className="grid gap-3 md:grid-cols-[240px_1fr] md:gap-8 py-5 first:pt-1 last:pb-1">
      <div>
        <p className="text-sm text-fg">{title}</p>
        {description && <p className="text-xs text-muted mt-1 leading-relaxed">{description}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

function ProfileTab() {
  const { user, updateUser } = useAuth()
  const qc = useQueryClient()
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    monthly_income: user?.monthly_income != null ? String(user.monthly_income) : '',
    currency: user?.currency || 'USD',
  })
  const [saving, setSaving] = useState(false)
  const dirty = form.full_name !== (user?.full_name || '')
    || form.monthly_income !== (user?.monthly_income != null ? String(user.monthly_income) : '')
    || form.currency !== (user?.currency || 'USD')

  const save = async (e) => {
    e.preventDefault()
    if (!form.full_name.trim()) return toast.error('Enter your name')
    setSaving(true)
    try {
      const { data } = await apiClient.put('/api/profile', {
        full_name: form.full_name.trim(),
        monthly_income: form.monthly_income === '' ? null : Number(form.monthly_income),
        currency: form.currency,
      })
      updateUser(data.user)
      invalidateFinance(qc)
      toast.success('Profile saved')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={save}>
      <Panel bodyClassName="divide-y divide-line">
        <Row title="Name" description="Shown in your greeting and account menu.">
          <Input className="max-w-sm" value={form.full_name} maxLength={255} aria-label="Name"
            onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} />
        </Row>
        <Row title="Expected monthly income" description="Used for any month where you haven't logged income. Leave blank if you log every payment.">
          <div className="max-w-sm">
            <MoneyInput symbol={currencySymbol(form.currency).trim()} placeholder="0" aria-label="Expected monthly income"
              value={form.monthly_income} onChange={(e) => setForm((f) => ({ ...f, monthly_income: e.target.value }))} />
          </div>
        </Row>
        <Row title="Currency" description="Changes the symbol shown everywhere. Amounts aren't converted.">
          <div className="max-w-sm">
            <Select aria-label="Currency" value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
        </Row>
      </Panel>
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="primary" type="submit" loading={saving} disabled={!dirty}>Save profile</Button>
      </div>
    </form>
  )
}

const ACCENT_SWATCH = { lime: '#C5F23A', vermilion: '#FF7054', teal: '#3DD6B5' }

function PreferencesTab() {
  const { prefs, update, setTheme, setAccent } = usePreferences()
  const [shortcuts, setShortcuts] = useState(false)
  return (
    <Panel bodyClassName="divide-y divide-line">
      <Row title="Theme" description="Match your system, or pick one.">
        <Segmented
          label="Theme"
          value={prefs.theme}
          onChange={(t, e) => {
            const r = e?.currentTarget.getBoundingClientRect()
            setTheme(t, r && { x: r.left + r.width / 2, y: r.top + r.height / 2 })
          }}
          options={[
            { value: 'system', label: <span className="flex items-center gap-1.5"><Monitor size={13} aria-hidden="true" />System</span> },
            { value: 'light', label: <span className="flex items-center gap-1.5"><Sun size={13} aria-hidden="true" />Light</span> },
            { value: 'dark', label: <span className="flex items-center gap-1.5"><Moon size={13} aria-hidden="true" />Dark</span> },
          ]}
        />
      </Row>
      <Row title="Accent colour" description="Used for highlights, the primary button and your main figures.">
        <div className="flex flex-wrap items-center gap-4">
          <div role="radiogroup" aria-label="Accent colour" className="flex gap-2">
            {ACCENTS.map((a) => (
              <button key={a} type="button" role="radio" aria-checked={prefs.accent === a} aria-label={a}
                onClick={() => setAccent(a)}
                className="relative h-9 w-9 rounded-full border border-line grid place-items-center"
                style={{ backgroundColor: ACCENT_SWATCH[a] }}>
                {prefs.accent === a && (
                  <motion.span layoutId="accent-check" transition={spring.snappy} className="absolute -inset-1 rounded-full border-2 border-fg" />
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 rounded-[10px] border border-line bg-canvas/50 px-4 py-2.5" aria-hidden="true">
            <span className="serif text-[28px] leading-none text-accent">72</span>
            <div className="w-24 h-1.5 rounded-full bg-fg/10 overflow-hidden"><div className="h-full w-2/3 bg-accent" /></div>
            <span className="h-7 px-2.5 rounded-control bg-accent text-on-accent text-xs grid place-items-center">Button</span>
          </div>
        </div>
      </Row>
      <Row title="Sidebar" description="How the sidebar starts on wide screens. Ctrl B switches any time.">
        <Segmented label="Sidebar" value={prefs.sidebar} onChange={(sidebar) => update({ sidebar })}
          options={[{ value: 'expanded', label: 'Expanded' }, { value: 'rail', label: 'Icons only' }]} />
      </Row>
      <Row title="Reduce motion" description="Replaces slides and morphs with simple fades. Your system setting is always respected.">
        <Switch checked={prefs.reduceMotion === 'on'} onCheckedChange={(v) => update({ reduceMotion: v ? 'on' : 'system' })} label="Reduce motion" />
      </Row>
      <Row title="Keyboard shortcuts" description="Press ? anywhere to see them.">
        <Button onClick={() => setShortcuts(true)}><Keyboard size={14} aria-hidden="true" /> Show shortcuts</Button>
        <ShortcutsDialog open={shortcuts} onOpenChange={setShortcuts} />
      </Row>
    </Panel>
  )
}

function Rules({ password }) {
  const { results, score, label } = checkPassword(password)
  const colors = ['rgb(var(--danger))', 'rgb(var(--danger))', 'rgb(var(--warning))', 'rgb(var(--accent))', 'rgb(var(--success))']
  return (
    <div className="mt-2.5 space-y-2" aria-live="polite">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1">
          {[1, 2, 3, 4].map((i) => (
            <motion.span key={i} className="h-1 flex-1 rounded-full" initial={false}
              animate={{ backgroundColor: i <= score ? colors[score] : 'rgb(var(--fg) / 0.1)' }} />
          ))}
        </div>
        <span className="text-xs text-muted w-16 text-right">{password ? label : ''}</span>
      </div>
      <ul className="space-y-1">
        {results.map((r) => (
          <li key={r.id} className={`flex items-center gap-1.5 text-xs transition-colors ${r.ok ? 'text-success' : 'text-muted'}`}>
            {r.ok ? <Check size={12} aria-hidden="true" /> : <X size={12} aria-hidden="true" />}{r.label}
          </li>
        ))}
      </ul>
    </div>
  )
}

function SecurityTab() {
  const { user, updateUser, logout } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState(user?.email || '')
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [saving, setSaving] = useState(null)

  const saveEmail = async (e) => {
    e.preventDefault()
    setSaving('email')
    try {
      const { data } = await apiClient.put('/api/profile', { email })
      updateUser(data.user)
      toast.success('Email updated')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(null)
    }
  }

  const savePassword = async (e) => {
    e.preventDefault()
    if (!checkPassword(pw.next).valid) return toast.error('The new password needs to meet every rule')
    if (pw.next !== pw.confirm) return toast.error("The new passwords don't match")
    setSaving('password')
    try {
      await apiClient.put('/api/profile/password', { current_password: pw.current, new_password: pw.next })
      setPw({ current: '', next: '', confirm: '' })
      toast.success('Password changed')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="space-y-4">
      <Panel bodyClassName="divide-y divide-line">
        <Row title="Email" description="Used to log in.">
          <form onSubmit={saveEmail} className="flex gap-2 max-w-md">
            <Input type="email" aria-label="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            <Button type="submit" loading={saving === 'email'} disabled={email === user?.email}>Update</Button>
          </form>
        </Row>
        <Row title="Password" description="You'll stay logged in on this device after changing it.">
          <form onSubmit={savePassword} className="space-y-3 max-w-md">
            <Field label="Current password">
              {(a) => <Input {...a} type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))} />}
            </Field>
            <Field label="New password">
              {(a) => <Input {...a} type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))} />}
            </Field>
            {pw.next && <Rules password={pw.next} />}
            <Field label="Repeat new password" error={pw.confirm && pw.confirm !== pw.next ? "Doesn't match" : null}>
              {(a) => <Input {...a} type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))} />}
            </Field>
            <Button type="submit" variant="primary" loading={saving === 'password'} disabled={!pw.current || !pw.next}>Change password</Button>
          </form>
        </Row>
      </Panel>
      <Panel bodyClassName="divide-y divide-line">
        <Row title="Log out" description="Ends your session on this device.">
          <Button variant="danger" onClick={() => { logout(); navigate('/login') }}><LogOut size={14} aria-hidden="true" /> Log out</Button>
        </Row>
      </Panel>
    </div>
  )
}

export default function Settings() {
  const entrance = usePageEntrance()
  const [params, setParams] = useSearchParams()
  const tab = TABS.some((t) => t.value === params.get('tab')) ? params.get('tab') : 'profile'
  const [dir, setDir] = useState(1)

  return (
    <motion.div {...entrance}>
      <PageHeader
        context="Your account and how FlowPilot looks"
        title="Settings"
        actions={<Segmented label="Section" options={TABS} value={tab} onChange={(t) => {
          setDir(directionOf(TABS, tab, t))
          setParams(t === 'profile' ? {} : { tab: t }, { replace: true })
        }} />}
      />
      <div className="max-w-4xl">
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div key={tab} custom={dir} variants={tabContentVariants} initial="initial" animate="animate" exit="exit">
            {tab === 'profile' && <ProfileTab />}
            {tab === 'preferences' && <PreferencesTab />}
            {tab === 'security' && <SecurityTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
