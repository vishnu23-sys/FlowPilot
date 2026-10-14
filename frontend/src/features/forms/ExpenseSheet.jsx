import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Trash2 } from 'lucide-react'
import { Sheet } from '../../components/ui/Overlay'
import Button from '../../components/ui/Button'
import { Field, Input, MoneyInput, Select } from '../../components/ui/Input'
import { Checkbox, Switch } from '../../components/ui/Controls'
import { CategoryPill } from '../../components/ui/Pill'
import { CategoryGrid, DateQuickPick, amountError } from './shared'
import apiClient, { errorMessage } from '../../api/apiClient'
import { keys, useFinanceMutation } from '../../api/queries'
import { useCurrency } from '../../context/AuthContext'
import { PAYMENT_METHODS } from '../../lib/categories'
import { currencySymbol, formatMoney, todayISO } from '../../lib/format'
import { deleteWithUndo } from '../../lib/undo'
import { spring } from '../../lib/motion'

const blank = () => ({ amount: '', category: 'Food', date: todayISO(), description: '', payment_method: 'UPI', is_recurring: false })

function fromExpense(e) {
  return {
    amount: String(e.amount), category: e.category, date: e.date, description: e.description || '',
    payment_method: e.payment_method || 'UPI', is_recurring: Boolean(e.is_recurring),
  }
}

export default function ExpenseSheet({ open, expense, onClose }) {
  const currency = useCurrency()
  const qc = useQueryClient()
  const editing = Boolean(expense?.id)
  const [form, setForm] = useState(blank)
  const [errors, setErrors] = useState({})
  const [addAnother, setAddAnother] = useState(false)
  const amountRef = useRef(null)

  useEffect(() => {
    if (!open) return
    setForm(editing ? fromExpense(expense) : blank())
    setErrors({})
  }, [open, editing, expense])

  const set = (patch) => {
    setForm((f) => ({ ...f, ...patch }))
    setErrors((e) => ({ ...e, ...Object.fromEntries(Object.keys(patch).map((k) => [k, null])) }))
  }

  const save = useFinanceMutation((payload) => (editing
    ? apiClient.put(`/api/expenses/${expense.id}`, payload)
    : apiClient.post('/api/expenses', payload)))

  const submit = (e) => {
    e.preventDefault()
    const errs = { amount: amountError(form.amount), date: form.date ? null : 'Pick a date' }
    if (errs.amount || errs.date) {
      setErrors(errs)
      if (errs.amount) amountRef.current?.focus()
      return
    }
    save.mutate({ ...form, amount: Number(form.amount), description: form.description.trim() }, {
      onSuccess: () => {
        toast.success(editing ? 'Changes saved' : `Added ${formatMoney(form.amount, currency)} to ${form.category}`)
        if (!editing && addAnother) {
          setForm((f) => ({ ...blank(), category: f.category, date: f.date, payment_method: f.payment_method }))
          amountRef.current?.focus()
        } else {
          onClose()
        }
      },
      onError: (err) => toast.error(errorMessage(err)),
    })
  }

  const remove = () => {
    onClose()
    deleteWithUndo({
      qc, queryKey: keys.expenses, ids: [expense.id],
      message: 'Expense deleted', url: `/api/expenses/${expense.id}`,
    })
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={editing ? 'Edit expense' : 'New expense'}
      footer={
        <>
          {editing && (
            <Button variant="ghost" className="text-danger hover:text-danger" onClick={remove}>
              <Trash2 size={14} aria-hidden="true" /> Delete
            </Button>
          )}
          {!editing && (
            <label className="flex items-center gap-2 text-sm text-muted cursor-pointer select-none">
              <Checkbox checked={addAnother} onCheckedChange={(v) => setAddAnother(Boolean(v))} label="Add another after saving" />
              Add another
            </label>
          )}
          <div className="flex-1" />
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="expense-form" loading={save.isPending}>
            {editing ? 'Save changes' : 'Add expense'}
          </Button>
        </>
      }
    >
      {editing && (
        <div className="mb-5 flex items-center justify-between rounded-[10px] border border-line bg-canvas/50 px-4 py-3">
          <CategoryPill id={expense.category} layoutId={`exp-pill-${expense.id}`} />
          <motion.span layoutId={`exp-amt-${expense.id}`} transition={spring.soft} className="serif text-[28px] text-fg">
            {formatMoney(expense.amount, currency)}
          </motion.span>
        </div>
      )}

      <form id="expense-form" onSubmit={submit} className="space-y-5" noValidate>
        <Field label="Amount" error={errors.amount}>
          {(a11y) => (
            <MoneyInput
              {...a11y}
              ref={amountRef}
              large
              autoFocus
              symbol={currencySymbol(currency).trim()}
              placeholder="0"
              value={form.amount}
              onChange={(e) => set({ amount: e.target.value })}
            />
          )}
        </Field>

        <div>
          <p className="text-xs text-muted mb-1.5">Category</p>
          <CategoryGrid value={form.category} onChange={(category) => set({ category })} />
        </div>

        <Field label="Date" error={errors.date}>
          {(a11y) => <DateQuickPick {...a11y} value={form.date} onChange={(date) => set({ date })} />}
        </Field>

        <Field label="Description" optional>
          {(a11y) => (
            <Input {...a11y} placeholder="Swiggy, Uber to airport, groceries…" maxLength={255}
              value={form.description} onChange={(e) => set({ description: e.target.value })} />
          )}
        </Field>

        <div className="grid grid-cols-2 gap-3 items-end">
          <Field label="Paid with">
            {(a11y) => (
              <Select {...a11y} value={form.payment_method} onChange={(e) => set({ payment_method: e.target.value })}>
                {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </Select>
            )}
          </Field>
          <label className="flex h-9 items-center justify-between gap-3 rounded-control border border-line px-3 text-sm cursor-pointer">
            Repeats monthly
            <Switch checked={form.is_recurring} onCheckedChange={(v) => set({ is_recurring: v })} label="Repeats monthly" />
          </label>
        </div>
      </form>
    </Sheet>
  )
}
