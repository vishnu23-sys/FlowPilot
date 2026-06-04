const base = `
  w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-100
  placeholder-slate-600 outline-none
  focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30
  transition-all duration-200
`

export function Input({ className = '', ...props }) {
  return <input className={`${base} ${className}`} {...props} />
}

export function Select({ children, className = '', ...props }) {
  return (
    <select
      className={`${base} ${className}`}
      style={{ colorScheme: 'dark' }}
      {...props}
    >
      {children}
    </select>
  )
}
