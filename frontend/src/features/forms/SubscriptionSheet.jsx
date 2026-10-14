import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Trash2 } from 'lucide-react'
import { Sheet } from '../../components/ui/Overlay'
import Button from '../../components/ui/Button'
import { Field, Input, MoneyInput } from '../../components/ui/Input'
import { Switch } from '../../components/ui/Controls'
import Segmented from '../../components/ui/Segmented'
import { Monogram } from '../../components/ui/Pill'
import { amountError } from './shared'
import apiClient, { errorMessage } from '../../api/apiClient'
import { keys, useFinanceMutation } from '../../api/queries'
import { useCurrency } from '../../context/AuthContext'
import { currencySymbol, toISODate } from '../../lib/format'
import { deleteWithUndo } from '../../lib/undo'

function nextMonthISO() {
  const d = new Date()
  d.setMonth(d.getMonth() + 1)
  return toISODate(d)
}

const blank = () => ({ name: '', amount: '', billing_cycle: 'monthly', next_renewal_date: nextMonthISO(), is_active: true })

export default function SubscriptionSheet({ open, sub, onClose }) {
  const currency = useCurrency()
  const qc = useQueryClient()
  const editing = Boolean(sub?.id)
  const [form, setForm] = useState(blank)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (!open) return
    setForm(editing
      ? { name: sub.name, amount: String(sub.amount), billing_cycle: sub.billing_cycle, next_renewal_date: sub.next_renewal_date, is_active: sub.is_active }
      : blank())
    setErrors({})
  }, [open, editing, sub])

  const set = (patch) => {
    setForm((f) => ({ ...f, ...patch }))
    setErrors({})
  }

  const save = useFinanceMutation((payload) => (editing
    ? apiClient.put(`/api/subscriptions/${sub.id}`, payload)
    : apiClient.post('/api/subscriptions', payload)))

  const submit = (e) => {
    e.preventDefault()
    const errs = {
      name: form.name.trim() ? null : 'Enter the service name',
      amount: amountError(form.amount),
      next_renewal_date: form.next_renewal_date ? null : 'Pick the next renewal date',
    }
    if (Object.values(errs).some(Boolean)) return setErrors(errs)
    save.mutate({ ...form, name: form.name.trim(), amount: Number(form.amount) }, {
      onSuccess: () => {
        toast.success(editing ? 'Changes saved' : `${form.name.trim()} added`)
        onClose()
      },
      onError: (err) => toast.error(errorMessage(err)),
    })
  }

  const remove = () => {
    onClose()
    deleteWithUndo({ qc, queryKey: keys.subs, ids: [sub.id], message: `${sub.name} deleted`, url: `/api/subscriptions/${sub.id}` })
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={editing ? sub.name : 'New subscription'}
      footer={
        <>
          {editing && (
            <Button variant="ghost" className="text-danger hover:text-danger" onClick={remove}>
              <Trash2 size={14} aria-hidden="true" /> Delete
            </Button>
          )}
          <div className="flex-1" />
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="sub-form" loading={save.isPending}>
            {editing ? 'Save changes' : 'Add subscription'}
          </Button>
        </>
      }
    >
      <form id="sub-form" onSubmit={submit} className="space-y-5" noValidate>
        <Field label="Service" error={errors.name}>
          {(a11y) => (
            <div className="flex items-center gap-3">
              <Monogram name={form.name || '?'} size={36} />
              <Input {...a11y} autoFocus placeholder="Netflix, Spotify, iCloud…" maxLength={100}
                value={form.name} onChange={(e) => set({ name: e.target.value })} />
            </div>
          )}
        </Field>
        <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
          <Field label="Price" error={errors.amount}>
            {(a11y) => (
              <MoneyInput {...a11y} symbol={currencySymbol(currency).trim()} placeholder="0"
                value={form.amount} onChange={(e) => set({ amount: e.target.value })} />
            )}
          </Field>
          <Segmented
            label="Billing cycle"
            value={form.billing_cycle}
            onChange={(billing_cycle) => set({ billing_cycle })}
            options={[{ value: 'monthly', label: 'Monthly' }, { value: 'yearly', label: 'Yearly' }]}
          />
        </div>
        <Field label="Next renewal" error={errors.next_renewal_date}>
          {(a11y) => <Input {...a11y} type="date" value={form.next_renewal_date} onChange={(e) => set({ next_renewal_date: e.target.value })} />}
        </Field>
        <label className="flex h-10 items-center justify-between rounded-control border border-line px-3 text-sm cursor-pointer">
          Active
          <Switch checked={form.is_active} onCheckedChange={(v) => set({ is_active: v })} label="Active" />
        </label>
      </form>
    </Sheet>
  )
}
