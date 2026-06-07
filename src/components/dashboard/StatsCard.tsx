import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  trend?: 'up' | 'down' | 'neutral'
}

export function StatsCard({ title, value, icon: Icon, description, trend }: StatsCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="flex items-center gap-4 p-4">
        <div className="rounded-full bg-blood-muted p-2 text-blood shrink-0">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold leading-none">{value}</p>
          <p className="text-muted-foreground text-sm mt-1">{title}</p>
          {trend === 'up' && description && (
            <span className="flex items-center gap-1 text-green-600 text-xs mt-1">
              <TrendingUp className="h-3.5 w-3.5" />
              {description}
            </span>
          )}
          {trend === 'down' && description && (
            <span className="flex items-center gap-1 text-red-600 text-xs mt-1">
              <TrendingDown className="h-3.5 w-3.5" />
              {description}
            </span>
          )}
          {trend === 'neutral' && description && (
            <span className="text-muted-foreground text-xs mt-1">{description}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
