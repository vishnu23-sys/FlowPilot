/** Shared motion vocabulary. Every animation in the app draws from these values. */

export const ease = [0.2, 0.9, 0.3, 1]

export const dur = { fast: 0.12, base: 0.22, slow: 0.38 }

export const spring = {
  snappy: { type: 'spring', stiffness: 520, damping: 40, mass: 0.8 },
  soft: { type: 'spring', stiffness: 280, damping: 32 },
  bar: { type: 'spring', stiffness: 140, damping: 22 },
}

/** Page content: direction-aware lift. `custom` is +1 (moving down the nav) or -1 (moving up). */
export const pageVariants = {
  initial: (dir) => ({ opacity: 0, y: dir * 14 }),
  animate: { opacity: 1, y: 0, transition: { duration: dur.slow, ease } },
  exit: (dir) => ({ opacity: 0, y: dir * -8, transition: { duration: dur.fast, ease: 'easeIn' } }),
}

/** Tab content crossfade that shifts in the direction of travel. */
export const tabContentVariants = {
  initial: (dir) => ({ opacity: 0, x: dir * 18 }),
  animate: { opacity: 1, x: 0, transition: { duration: dur.base, ease } },
  exit: (dir) => ({ opacity: 0, x: dir * -18, transition: { duration: dur.fast, ease: 'easeIn' } }),
}

/** Stagger for a page's sections. Kept short so a page is fully in within ~400ms. */
export const staggerContainer = {
  animate: { transition: { staggerChildren: 0.04, delayChildren: 0.02 } },
}

export const staggerItem = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: dur.slow, ease } },
}

/** List rows entering, leaving and reflowing. */
export const rowVariants = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: 'auto', transition: { duration: dur.base, ease } },
  exit: { opacity: 0, height: 0, transition: { duration: dur.base, ease } },
}
