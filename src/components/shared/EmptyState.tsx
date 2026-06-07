import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  message: string
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
      <Inbox className="h-10 w-10 opacity-50" />
      <p className="text-sm">{message}</p>
    </div>
  )
}
