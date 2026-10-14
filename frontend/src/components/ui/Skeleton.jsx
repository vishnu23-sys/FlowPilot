export function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />
}

/** Placeholder shaped like a page: header, figure strip, two panels. Used while a route loads. */
export function PageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-48" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Skeleton className="h-72 lg:col-span-2" />
        <Skeleton className="h-72" />
      </div>
    </div>
  )
}

export function RowsSkeleton({ rows = 6 }) {
  return (
    <div className="divide-y divide-line" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3.5 px-4">
          <Skeleton className="h-7 w-7 rounded-full" />
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-3 w-16 ml-auto" />
        </div>
      ))}
    </div>
  )
}
