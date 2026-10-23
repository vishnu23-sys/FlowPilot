import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Trash2 } from 'lucide-react'
import { Sheet } from '../../components/ui/Overlay'
import Button from '../../components/ui/Button'
import { Field, Input, MoneyInput } from '../../components/ui/Input'
import Segmented from '../../components/ui/Segmented'
import { amountError } from './shared'
import apiClient, { errorMessage } from '../../api/apiClient'
import { keys, useFinanceMutation } from '../../api/queries'
import { useCurrency } from '../../context/AuthContext'
import { currencySymbol } from '../../lib/format'
import { deleteWithUndo } from '../../lib/undo'

const blank = (type = 'owed_to_me') => ({ type, person_name: '', amount: '', description: '' })

export default function DebtSheet({ open, debt, onClose }) {
  const currency = useCurrency()
  const qc = useQueryClient()
  const editing = Boolean(debt?.id)
  const [form, setForm] = useState(blank)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (!open) return
    setForm(editing
      ? { type: debt.type, person_name: debt.person_name, amount: String(debt.amount), description: debt.description || '' }
      : blank(debt?.type))
    setErrors({})
  }, [open, editing, debt])

  const set = (patch) => {
    setForm((f) => ({ ...f, ...patch }))
    setErrors({})
  }

  const save = useFinanceMutation((payload) => (editing
    ? apiClient.put(`/api/debts/${debt.id}`, payload)
    : apiClient.post('/api/debts', payload)))

  const submit = (e) => {
    e.preventDefault()
    const errs = { person_name: form.person_name.trim() ? null : 'Enter a name', amount: amountError(form.amount) }
    if (errs.person_name || errs.amount) return setErrors(errs)
    save.mutate({ ...form, person_name: form.person_name.trim(), amount: Number(form.amount) }, {
      onSuccess: () => {
        toast.success(editing ? 'Changes saved' : 'Debt recorded')
        onClose()
      },
      onError: (err) => toast.error(errorMessage(err)),
    })
  }

  const remove = () => {
    onClose()
    deleteWithUndo({ qc, queryKey: keys.debts, ids: [debt.id], message: 'Debt deleted', url: `/api/debts/${debt.id}` })
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={editing ? 'Edit debt' : 'Record a debt'}
      footer={
        <>
          {editing && (
            <Button variant="ghost" className="text-danger hover:text-danger" onClick={remove}>
              <Trash2 size={14} aria-hidden="true" /> Delete
            </Button>
          )}
          <div className="flex-1" />
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="debt-form" loading={save.isPending}>
            {editing ? 'Save changes' : 'Record debt'}
          </Button>
        </>
      }
    >
      <form id="debt-form" onSubmit={submit} className="space-y-5" noValidate>
        <Segmented
          fullWidth
          label="Direction"
          value={form.type}
          onChange={(type) => set({ type })}
          options={[{ value: 'owed_to_me', label: 'They owe me' }, { value: 'i_owe', label: 'I owe them' }]}
        />
        <Field label="Person" error={errors.person_name}>
          {(a11y) => (
            <Input {...a11y} autoFocus placeholder="Rahul" maxLength={100}
              value={form.person_name} onChange={(e) => set({ person_name: e.target.value })} />
          )}
        </Field>
        <Field label="Amount" error={errors.amount}>
          {(a11y) => (
            <MoneyInput {...a11y} symbol={currencySymbol(currency).trim()} placeholder="0"
              value={form.amount} onChange={(e) => set({ amount: e.target.value })} />
          )}
        </Field>
        <Field label="What for" optional>
          {(a11y) => (
            <Input {...a11y} placeholder="Dinner split, cab share…" maxLength={255}
              value={form.description} onChange={(e) => set({ description: e.target.value })} />
          )}
        </Field>
      </form>
    </Sheet>
  )
}
