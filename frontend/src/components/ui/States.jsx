import { AlertCircle, RotateCw } from 'lucide-react'
import Button from './Button'
import { errorMessage } from '../../api/apiClient'

/** An invitation to act, not an apology. */
export function EmptyState({ icon: Icon, title, body, action, compact = false }) {
  return (
    <div className={`flex flex-col items-center text-center ${compact ? 'py-8' : 'py-14'} px-6`}>
      {Icon && (
        <span className="mb-4 grid place-items-center h-11 w-11 rounded-full border border-dashed border-line-strong text-muted">
          <Icon size={18} strokeWidth={1.7} aria-hidden="true" />
        </span>
      )}
      <p className="text-fg font-medium">{title}</p>
      {body && <p className="text-sm text-muted mt-1 max-w-sm">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({ error, onRetry, compact = false }) {
  return (
    <div role="alert" className={`flex flex-col items-center text-center ${compact ? 'py-6' : 'py-12'} px-6`}>
      <AlertCircle size={18} className="text-danger mb-3" aria-hidden="true" />
      <p className="text-fg font-medium">Couldn't load this</p>
      <p className="text-sm text-muted mt-1 max-w-sm">{errorMessage(error)}</p>
      {onRetry && (
        <Button size="sm" className="mt-4" onClick={onRetry}>
          <RotateCw size={13} aria-hidden="true" /> Retry
        </Button>
      )}
    </div>
  )
}

/**
 * Renders loading / error / content for a TanStack query.
 * `children` receives the data. Keeps showing stale data during background refetches.
 */
export function QueryView({ query, loading, compactError, children }) {
  if (query.isPending) return loading ?? null
  if (query.isError && query.data === undefined) {
    return <ErrorState error={query.error} onRetry={() => query.refetch()} compact={compactError} />
  }
  return children(query.data)
}
