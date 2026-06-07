interface SkeletonLoaderProps {
  variant: 'card' | 'table' | 'map' | 'stats'
}

export function SkeletonLoader({ variant }: SkeletonLoaderProps) {
  return (
    <div aria-hidden="true">
      <span className="sr-only">Loading...</span>

      {variant === 'map' && (
        <div
          className="animate-pulse bg-muted rounded-xl w-full"
          style={{ minHeight: 400 }}
        />
      )}

      {variant === 'table' && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-muted h-10 rounded" />
          ))}
        </div>
      )}

      {variant === 'stats' && (
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-muted rounded-xl h-24" />
          ))}
        </div>
      )}

      {variant === 'card' && (
        <div className="animate-pulse bg-muted rounded-xl h-32" />
      )}
    </div>
  )
}
