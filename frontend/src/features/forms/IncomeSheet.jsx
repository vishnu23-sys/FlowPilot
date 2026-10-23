import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Trash2 } from 'lucide-react'
import { Sheet } from '../../components/ui/Overlay'
import Button from '../../components/ui/Button'
import { Field, Input, MoneyInput } from '../../components/ui/Input'
import { Switch } from '../../components/ui/Controls'
import { DateQuickPick, SourceGrid, amountError } from './shared'
import apiClient, { errorMessage } from '../../api/apiClient'
import { keys, useFinanceMutation } from '../../api/queries'
import { useCurrency } from '../../context/AuthContext'
import { currencySymbol, formatMoney, todayISO } from '../../lib/format'
import { deleteWithUndo } from '../../lib/undo'

const blank = () => ({ amount: '', source: 'Salary', date: todayISO(), description: '', is_recurring: false })

export default function IncomeSheet({ open, entry, onClose }) {
  const currency = useCurrency()
  const qc = useQueryClient()
  const editing = Boolean(entry?.id)
  const [form, setForm] = useState(blank)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open) return
    setForm(editing
      ? { amount: String(entry.amount), source: entry.source, date: entry.date, description: entry.description || '', is_recurring: entry.is_recurring }
      : blank())
    setError(null)
  }, [open, editing, entry])

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  const save = useFinanceMutation((payload) => (editing
    ? apiClient.put(`/api/income/${entry.id}`, payload)
    : apiClient.post('/api/income', payload)))

  const submit = (e) => {
    e.preventDefault()
    const err = amountError(form.amount)
    if (err) return setError(err)
    save.mutate({ ...form, amount: Number(form.amount), description: form.description.trim() }, {
      onSuccess: () => {
        toast.success(editing ? 'Changes saved' : `Logged ${formatMoney(form.amount, currency)} from ${form.source}`)
        onClose()
      },
      onError: (err) => toast.error(errorMessage(err)),
    })
  }

  const remove = () => {
    onClose()
    deleteWithUndo({ qc, queryKey: keys.income, ids: [entry.id], message: 'Income entry deleted', url: `/api/income/${entry.id}` })
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={editing ? 'Edit income' : 'Log income'}
      description={editing ? undefined : 'Logged income replaces your expected monthly income for that month.'}
      footer={
        <>
          {editing && (
            <Button variant="ghost" className="text-danger hover:text-danger" onClick={remove}>
              <Trash2 size={14} aria-hidden="true" /> Delete
            </Button>
          )}
          <div className="flex-1" />
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="income-form" loading={save.isPending}>
            {editing ? 'Save changes' : 'Log income'}
          </Button>
        </>
      }
    >
      <form id="income-form" onSubmit={submit} className="space-y-5" noValidate>
        <Field label="Amount" error={error}>
          {(a11y) => (
            <MoneyInput {...a11y} large autoFocus symbol={currencySymbol(currency).trim()} placeholder="0"
              value={form.amount} onChange={(e) => { set({ amount: e.target.value }); setError(null) }} />
          )}
        </Field>
        <div>
          <p className="text-xs text-muted mb-1.5">Source</p>
          <SourceGrid value={form.source} onChange={(source) => set({ source })} />
        </div>
        <Field label="Date">
          {(a11y) => <DateQuickPick {...a11y} value={form.date} onChange={(date) => set({ date })} />}
        </Field>
        <Field label="From" optional>
          {(a11y) => (
            <Input {...a11y} placeholder="Employer, client or note" maxLength={255}
              value={form.description} onChange={(e) => set({ description: e.target.value })} />
          )}
        </Field>
        <label className="flex h-10 items-center justify-between rounded-control border border-line px-3 text-sm cursor-pointer">
          Arrives every month
          <Switch checked={form.is_recurring} onCheckedChange={(v) => set({ is_recurring: v })} label="Arrives every month" />
        </label>
      </form>
    </Sheet>
  )
}
