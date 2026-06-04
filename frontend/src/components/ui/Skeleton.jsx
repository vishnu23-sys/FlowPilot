export function SkeletonCard({ className = '' }) {
  return (
    <div className={`glass rounded-2xl p-5 ${className}`}>
      <div className="skeleton h-3 w-24 rounded-full mb-4" />
      <div className="skeleton h-7 w-36 rounded-full mb-2" />
      <div className="skeleton h-3 w-20 rounded-full" />
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 py-3.5 border-b border-white/[0.05]">
      <div className="skeleton h-3 w-20 rounded-full" />
      <div className="skeleton h-5 w-16 rounded-full" />
      <div className="skeleton h-3 w-32 rounded-full" />
      <div className="skeleton h-3 w-16 rounded-full ml-auto" />
    </div>
  )
}

export function SkeletonBlock({ className = '' }) {
  return <div className={`glass rounded-2xl skeleton ${className}`} />
}
