const variants = {
  primary: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500 shadow-glow-blue',
  ghost:   'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:text-white',
  danger:  'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20',
}

export default function Button({ children, variant = 'primary', className = '', disabled, ...props }) {
  return (
    <button
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
        transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed
        ${variants[variant]} ${className}
      `}
      {...props}
    >
      {children}
    </button>
  )
}
