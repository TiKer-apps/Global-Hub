import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function PostItWidget() {
  return (
    <Card className="w-64">
      <CardHeader>
        <CardTitle>Post-it</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          À implémenter — même principe que les notes + choix de police stylée.
        </p>
      </CardContent>
    </Card>
  )
}
