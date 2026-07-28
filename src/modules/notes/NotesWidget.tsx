import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function NotesWidget() {
  return (
    <Card className="w-72">
      <CardHeader>
        <CardTitle>Note</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          À implémenter — édition avec couleur, taille, gras, italique.
        </p>
      </CardContent>
    </Card>
  )
}
