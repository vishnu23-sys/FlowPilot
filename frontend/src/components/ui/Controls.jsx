import * as RTooltip from '@radix-ui/react-tooltip'
import * as RMenu from '@radix-ui/react-dropdown-menu'
import * as RCheckbox from '@radix-ui/react-checkbox'
import * as RSwitch from '@radix-ui/react-switch'
import * as RSlider from '@radix-ui/react-slider'
import { motion } from 'motion/react'

export const TooltipProvider = ({ children }) => (
  <RTooltip.Provider delayDuration={350} skipDelayDuration={150}>{children}</RTooltip.Provider>
)

export function Tooltip({ content, side = 'top', children, shortcut, disabled = false }) {
  if (disabled || !content) return children
  return (
    <RTooltip.Root>
      <RTooltip.Trigger asChild>{children}</RTooltip.Trigger>
      <RTooltip.Portal>
        <RTooltip.Content
          side={side}
          sideOffset={8}
          className="z-[70] flex items-center gap-2 rounded-md bg-fg text-canvas px-2 py-1 text-xs shadow-pop select-none"
        >
          {content}
          {shortcut && <Kbd inverted>{shortcut}</Kbd>}
        </RTooltip.Content>
      </RTooltip.Portal>
    </RTooltip.Root>
  )
}

export function Kbd({ children, inverted = false }) {
  return (
    <kbd className={`inline-flex items-center h-[18px] min-w-[18px] justify-center px-1 rounded text-2xs font-mono
      ${inverted ? 'bg-canvas/15 text-canvas' : 'bg-fg/[0.06] text-muted border border-line'}`}
    >
      {children}
    </kbd>
  )
}

export const Menu = RMenu.Root
export const MenuTrigger = RMenu.Trigger

export function MenuContent({ children, align = 'end', side = 'bottom', className = '' }) {
  return (
    <RMenu.Portal>
      <RMenu.Content
        align={align}
        side={side}
        sideOffset={6}
        className={`z-[60] min-w-[200px] rounded-[10px] border border-line bg-raised p-1 shadow-pop
          origin-[var(--radix-dropdown-menu-content-transform-origin)] ${className}`}
      >
        {children}
      </RMenu.Content>
    </RMenu.Portal>
  )
}

export function MenuItem({ children, icon: Icon, danger = false, shortcut, ...props }) {
  return (
    <RMenu.Item
      className={`flex items-center gap-2.5 h-8 px-2 rounded-md text-sm cursor-pointer outline-none select-none
        ${danger ? 'text-danger data-[highlighted]:bg-danger/10' : 'text-fg data-[highlighted]:bg-fg/[0.06]'}`}
      {...props}
    >
      {Icon && <Icon size={14} className={danger ? '' : 'text-muted'} aria-hidden="true" />}
      <span className="flex-1">{children}</span>
      {shortcut && <Kbd>{shortcut}</Kbd>}
    </RMenu.Item>
  )
}

export const MenuSeparator = () => <RMenu.Separator className="my-1 h-px bg-line" />
export const MenuLabel = ({ children }) => <RMenu.Label className="px-2 pt-1.5 pb-1 text-xs text-muted">{children}</RMenu.Label>

export function Checkbox({ checked, onCheckedChange, label, className = '', ...props }) {
  return (
    <RCheckbox.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      aria-label={label}
      className={`grid place-items-center h-4 w-4 shrink-0 rounded-[4px] border border-line-strong bg-canvas/50
        data-[state=checked]:bg-accent data-[state=checked]:border-accent
        data-[state=indeterminate]:bg-accent data-[state=indeterminate]:border-accent transition-colors ${className}`}
      {...props}
    >
      <RCheckbox.Indicator forceMount className="text-on-accent">
        {/* The tick draws itself on check and rubs out on uncheck. */}
        <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true">
          <motion.path
            d={checked === 'indeterminate' ? 'M3 6h6' : 'M2.4 6.4 5 8.9 9.7 3.3'}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={false}
            animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
            transition={{ pathLength: { duration: 0.26, ease: [0.2, 0.9, 0.3, 1] }, opacity: { duration: 0.1 } }}
          />
        </svg>
      </RCheckbox.Indicator>
    </RCheckbox.Root>
  )
}

export function Switch({ checked, onCheckedChange, label, id }) {
  return (
    <RSwitch.Root
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      aria-label={label}
      className="relative h-5 w-9 shrink-0 rounded-full bg-fg/15 transition-colors data-[state=checked]:bg-accent"
    >
      <RSwitch.Thumb className="block h-4 w-4 translate-x-0.5 rounded-full bg-panel shadow transition-transform duration-300
        ease-[cubic-bezier(.3,1.7,.5,1)] data-[state=checked]:translate-x-[18px] motion-reduce:transition-none" />
    </RSwitch.Root>
  )
}

export function Slider({ value, onValueChange, min = 0, max = 100, step = 1, label }) {
  return (
    <RSlider.Root
      value={[value]}
      onValueChange={([v]) => onValueChange(v)}
      min={min}
      max={max}
      step={step}
      aria-label={label}
      className="relative flex h-5 w-full touch-none select-none items-center"
    >
      <RSlider.Track className="relative h-1.5 grow overflow-hidden rounded-full bg-fg/10">
        <RSlider.Range className="absolute h-full bg-accent" />
      </RSlider.Track>
      <RSlider.Thumb className="block h-4 w-4 rounded-full border-2 border-accent bg-panel shadow transition-transform hover:scale-110 focus-visible:scale-110" />
    </RSlider.Root>
  )
}
