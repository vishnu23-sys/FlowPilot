import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Trash2 } from 'lucide-react'
import { Sheet } from '../../components/ui/Overlay'
import Button from '../../components/ui/Button'
import { Field, Input, MoneyInput } from '../../components/ui/Input'
import { amountError, DateQuickPick } from './shared'
import apiClient, { errorMessage } from '../../api/apiClient'
import { useFinanceMutation } from '../../api/queries'
import { useCurrency } from '../../context/AuthContext'
import { GOAL_COLORS } from '../../lib/categories'
import { currencySymbol, formatMoney, todayISO } from '../../lib/format'
import { celebratedGoals } from '../../lib/interactions'

const blank = () => ({ name: '', target_amount: '', target_date: '', color: 'accent', initial_amount: '' })

export function GoalSheet({ open, goal, onClose, onDelete }) {
  const currency = useCurrency()
  const editing = Boolean(goal?.id)
  const [form, setForm] = useState(blank)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (!open) return
    setForm(editing
      ? { name: goal.name, target_amount: String(goal.target_amount), target_date: goal.target_date || '', color: goal.color, initial_amount: '' }
      : blank())
    setErrors({})
  }, [open, editing, goal])

  const set = (patch) => {
    setForm((f) => ({ ...f, ...patch }))
    setErrors({})
  }

  const save = useFinanceMutation((payload) => (editing
    ? apiClient.put(`/api/goals/${goal.id}`, payload)
    : apiClient.post('/api/goals', payload)))

  const submit = (e) => {
    e.preventDefault()
    const errs = {
      name: form.name.trim() ? null : 'Name your goal',
      target_amount: amountError(form.target_amount),
      initial_amount: form.initial_amount && Number(form.initial_amount) < 0 ? "Starting amount can't be negative" : null,
    }
    if (Object.values(errs).some(Boolean)) return setErrors(errs)
    const payload = {
      name: form.name.trim(),
      target_amount: Number(form.target_amount),
      target_date: form.target_date || null,
      color: form.color,
      ...(editing ? {} : { initial_amount: form.initial_amount ? Number(form.initial_amount) : 0 }),
    }
    save.mutate(payload, {
      onSuccess: () => {
        toast.success(editing ? 'Changes saved' : `${payload.name} goal created`)
        onClose()
      },
      onError: (err) => toast.error(errorMessage(err)),
    })
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={editing ? 'Edit goal' : 'New savings goal'}
      footer={
        <>
          {editing && (
            <Button variant="ghost" className="text-danger hover:text-danger" onClick={() => onDelete(goal)}>
              <Trash2 size={14} aria-hidden="true" /> Delete
            </Button>
          )}
          <div className="flex-1" />
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="goal-form" loading={save.isPending}>
            {editing ? 'Save changes' : 'Create goal'}
          </Button>
        </>
      }
    >
      <form id="goal-form" onSubmit={submit} className="space-y-5" noValidate>
        <Field label="Saving for" error={errors.name}>
          {(a11y) => (
            <Input {...a11y} autoFocus placeholder="Emergency fund, new laptop, Japan trip" maxLength={100}
              value={form.name} onChange={(e) => set({ name: e.target.value })} />
          )}
        </Field>
        <Field label="Target" error={errors.target_amount}>
          {(a11y) => (
            <MoneyInput {...a11y} large symbol={currencySymbol(currency).trim()} placeholder="0"
              value={form.target_amount} onChange={(e) => set({ target_amount: e.target.value })} />
          )}
        </Field>
        <Field label="Target date" optional hint="We'll work out how much to set aside each month.">
          {(a11y) => (
            <Input {...a11y} type="date" min={todayISO()} value={form.target_date} onChange={(e) => set({ target_date: e.target.value })} />
          )}
        </Field>
        {!editing && (
          <Field label="Already saved" optional error={errors.initial_amount}>
            {(a11y) => (
              <MoneyInput {...a11y} symbol={currencySymbol(currency).trim()} placeholder="0"
                value={form.initial_amount} onChange={(e) => set({ initial_amount: e.target.value })} />
            )}
          </Field>
        )}
        <div>
          <p className="text-xs text-muted mb-2">Colour</p>
          <div role="radiogroup" aria-label="Colour" className="flex gap-2">
            {Object.entries(GOAL_COLORS).map(([key, color]) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={form.color === key}
                aria-label={key}
                onClick={() => set({ color: key })}
                className={`h-8 w-8 rounded-full border-2 transition-transform ${form.color === key ? 'border-fg scale-110' : 'border-transparent hover:scale-105'}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </form>
    </Sheet>
  )
}

export function ContributionSheet({ open, goal, onClose }) {
  const currency = useCurrency()
  const [form, setForm] = useState({ amount: '', date: todayISO(), note: '' })
  const [error, setError] = useState(null)

  useEffect(() => {
    if (open) {
      setForm({ amount: goal?.monthly_needed ? String(Math.ceil(goal.monthly_needed)) : '', date: todayISO(), note: '' })
      setError(null)
    }
  }, [open, goal])

  const save = useFinanceMutation((payload) => apiClient.post(`/api/goals/${goal.id}/contributions`, payload))

  const submit = (e) => {
    e.preventDefault()
    const err = amountError(form.amount)
    if (err) return setError(err)
    save.mutate({ ...form, amount: Number(form.amount) }, {
      onSuccess: ({ data }) => {
        if (data.goal.is_complete) celebratedGoals.mark(goal.id)
        toast.success(data.goal.is_complete
          ? `${goal.name} is fully funded`
          : `Added ${formatMoney(form.amount, currency)} to ${goal.name}`)
        onClose()
      },
      onError: (err) => toast.error(errorMessage(err)),
    })
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={goal ? `Add to ${goal.name}` : 'Add money'}
      description={goal?.monthly_needed ? `${formatMoney(goal.monthly_needed, currency)} a month keeps you on track.` : undefined}
      width={400}
      footer={
        <>
          <div className="flex-1" />
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="contribution-form" loading={save.isPending}>Add money</Button>
        </>
      }
    >
      <form id="contribution-form" onSubmit={submit} className="space-y-5" noValidate>
        <Field label="Amount" error={error}>
          {(a11y) => (
            <MoneyInput {...a11y} large autoFocus symbol={currencySymbol(currency).trim()} placeholder="0"
              value={form.amount} onChange={(e) => { setForm((f) => ({ ...f, amount: e.target.value })); setError(null) }} />
          )}
        </Field>
        <Field label="Date">
          {(a11y) => <DateQuickPick {...a11y} value={form.date} onChange={(date) => setForm((f) => ({ ...f, date }))} />}
        </Field>
        <Field label="Note" optional>
          {(a11y) => (
            <Input {...a11y} placeholder="Monthly transfer" maxLength={255}
              value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
          )}
        </Field>
      </form>
    </Sheet>
  )
}
