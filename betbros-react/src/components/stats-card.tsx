import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

interface StatsCardProps {
  title: string
  value: string
  className?: string
}

export function StatsCard({ title, value, className }: StatsCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  )
}
