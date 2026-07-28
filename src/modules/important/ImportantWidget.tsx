import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function ImportantWidget() {
  return (
    <Card className="w-72">
      <CardHeader>
        <CardTitle>Important</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          À implémenter — regroupe les éléments (événements, notes, post-its...)
          flaggés important, sans filtre de date.
        </p>
      </CardContent>
    </Card>
  )
}
