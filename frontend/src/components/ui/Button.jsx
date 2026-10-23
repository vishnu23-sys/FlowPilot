import { forwardRef } from 'react'
import { motion } from 'motion/react'
import { press } from '../../lib/interactions'
import { Loader2 } from 'lucide-react'

const variants = {
  primary: 'bg-accent text-on-accent hover:brightness-110 active:brightness-95 font-medium',
  secondary: 'bg-panel text-fg border border-line hover:border-line-strong hover:bg-raised',
  ghost: 'text-muted hover:text-fg hover:bg-fg/[0.06]',
  danger: 'bg-danger/10 text-danger border border-danger/25 hover:bg-danger/15',
  'danger-solid': 'bg-danger text-canvas hover:brightness-110 font-medium',
}

const sizes = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-9 px-3.5 text-sm gap-2',
  lg: 'h-11 px-5 text-base gap-2',
  icon: 'h-8 w-8 justify-center',
  'icon-sm': 'h-7 w-7 justify-center',
}

/** Classes for anything that should look like a button (e.g. a router Link). */
export function buttonClasses({ variant = 'secondary', size = 'md', className = '', motion: springPress = false } = {}) {
  return `inline-flex items-center rounded-control whitespace-nowrap select-none duration-150 ease-out
    ${springPress ? 'transition-[background-color,border-color,color,filter]' : 'transition-[background-color,border-color,color,filter,transform] active:scale-[0.97]'}
    disabled:opacity-50 disabled:pointer-events-none
    ${variants[variant]} ${sizes[size]} ${className}`
}

const Button = forwardRef(function Button(
  { children, variant = 'secondary', size = 'md', loading = false, className = '', type = 'button', disabled, ...props },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      whileTap={disabled || loading ? undefined : press.tap}
      transition={press.transition}
      className={buttonClasses({ variant, size, className, motion: true })}
      {...props}
    >
      {loading && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
      {children}
    </motion.button>
  )
})

export default Button
