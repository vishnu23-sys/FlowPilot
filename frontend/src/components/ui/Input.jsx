import { forwardRef, useId } from 'react'
import { ChevronDown } from 'lucide-react'

const base = `w-full h-9 rounded-control bg-canvas/60 border border-line px-3 text-sm text-fg
  placeholder:text-faint outline-none transition-[border-color,box-shadow] duration-150
  hover:border-line-strong focus:border-accent/70 focus:ring-2 focus:ring-accent/20
  aria-[invalid=true]:border-danger/70 aria-[invalid=true]:ring-danger/15`

export const Input = forwardRef(function Input({ className = '', ...props }, ref) {
  return <input ref={ref} className={`${base} ${className}`} {...props} />
})

export const Textarea = forwardRef(function Textarea({ className = '', ...props }, ref) {
  return <textarea ref={ref} className={`${base} h-auto py-2 min-h-[72px] resize-y ${className}`} {...props} />
})

export const Select = forwardRef(function Select({ children, className = '', ...props }, ref) {
  return (
    <div className="relative">
      <select ref={ref} className={`${base} appearance-none pr-8 cursor-pointer ${className}`} {...props}>
        {children}
      </select>
      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" aria-hidden="true" />
    </div>
  )
})

/** Amount input with the currency symbol inset. */
export const MoneyInput = forwardRef(function MoneyInput({ symbol, className = '', large = false, ...props }, ref) {
  return (
    <div className="relative">
      <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none ${large ? 'serif text-2xl' : 'text-sm'}`}>
        {symbol}
      </span>
      <input
        ref={ref}
        type="number"
        inputMode="decimal"
        step="0.01"
        min="0"
        className={`${base} ${large ? 'h-14 serif !text-[32px] pl-10' : 'pl-8 num'} ${className}`}
        {...props}
      />
    </div>
  )
})

/** Label + control + hint/error, wired for accessibility. */
export function Field({ label, hint, error, children, className = '', optional = false }) {
  const id = useId()
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  const control = typeof children === 'function'
    ? children({ id, 'aria-describedby': describedBy, 'aria-invalid': Boolean(error) })
    : children
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="flex items-baseline justify-between text-xs text-muted mb-1.5">
          <span>{label}</span>
          {optional && <span className="text-faint">Optional</span>}
        </label>
      )}
      {control}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-danger mt-1.5">{error}</p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-faint mt-1.5">{hint}</p>
      ) : null}
    </div>
  )
}
