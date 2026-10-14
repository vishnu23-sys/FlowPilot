import { Link } from 'react-router-dom'

/** Wordmark: a flight-path mark plus the name in the serif. */
export function LogoMark({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect width="24" height="24" rx="7" fill="rgb(var(--accent))" />
      <path d="M5 16.5c3.2 0 4.4-2.6 6-5s3-4.5 6.6-4.5" fill="none" stroke="rgb(var(--on-accent))" strokeWidth="2" strokeLinecap="round" />
      <circle cx="17.6" cy="7" r="1.9" fill="rgb(var(--on-accent))" />
    </svg>
  )
}

export default function Logo({ to = '/dashboard', size = 22 }) {
  return (
    <Link to={to} className="flex items-center gap-2 rounded-md" aria-label="FlowPilot home">
      <LogoMark size={size} />
      <span className="serif text-[22px] leading-none text-fg">FlowPilot</span>
    </Link>
  )
}
