import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface ModuleCardProps {
  title: ReactNode
  titleClassName?: string
  action?: ReactNode
  headerClassName?: string
  contentClassName?: string
  className?: string
  children: ReactNode
}

// Coquille commune à tous les widgets du canvas :
// - `nodrag` posé une fois pour toutes sur le contenu (indispensable pour
//   qu'un widget reste interactif sur un node React Flow — sinon le premier
//   mousedown est capté par le drag du node plutôt que par le widget) ;
// - la couleur (`headerClassName`) se pose sur la carte entière ; la zone
//   d'action et `CardContent` repassent sur un fond neutre (`bg-card`), ne
//   laissant la couleur visible qu'autour du titre.
// - la zone d'action est une simple `div` (pas le `CardAction` de shadcn,
//   qui imposerait sa propre grille limitant sa largeur au contenu) en
//   `flex-1`, pour occuper tout l'espace restant après le titre — les
//   boutons, eux, restent alignés à droite dedans (`justify-end`).
// - le padding vertical et l'espacement entre header/content normalement
//   portés par `Card` sont retirés (`gap-0 py-0`) puis reportés comme
//   padding propre à `CardContent`, pour que le blanc touche l'en-tête sans
//   marge colorée résiduelle entre les deux.
export function ModuleCard({
  title,
  titleClassName,
  action,
  headerClassName,
  contentClassName,
  className,
  children,
}: ModuleCardProps) {
  return (
    <Card className={cn(headerClassName, 'gap-0 py-0', className)}>
      <CardHeader>
        <div className="flex h-10 items-center">
          <CardTitle className={cn('pt-4 pr-2', titleClassName)}>{title}</CardTitle>
          <div className="nodrag -mr-4 -mb-px flex h-[90%] flex-1 items-center justify-end gap-1 self-end rounded-t-md bg-card py-0.5 pr-4 pl-1 text-foreground">
            {action}
          </div>
        </div>
      </CardHeader>
      <CardContent className={cn('nodrag rounded-b-md bg-card py-4 text-foreground', contentClassName)}>
        {children}
      </CardContent>
    </Card>
  )
}
