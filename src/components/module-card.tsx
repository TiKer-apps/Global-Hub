import { useEffect, useRef, type ReactNode } from 'react'
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
// - `Card` reste blanche ; `CardHeader` porte la couleur (`headerClassName`)
//   sur toute sa largeur ;
// - titre et zone d'action sont chacun une superposition de deux fonds :
//   le titre a un fond blanc dessous et la couleur par-dessus (découpe
//   arrondie en bas à droite), la zone d'action l'inverse — couleur dessous,
//   blanc par-dessus (découpe arrondie en haut à gauche). Ça crée une
//   transition en courbe entre les deux zones plutôt qu'une jonction nette.
//   `cn(headerClassName, 'bg-transparent')` sur le titre : récupère juste la
//   couleur de *texte* de `headerClassName` (tailwind-merge écrase son
//   `bg-*` par le `bg-transparent` qui suit, même catégorie d'utilitaire)
//   sans quoi son fond opaque cacherait la découpe.
export function ModuleCard({
  title,
  titleClassName,
  action,
  headerClassName,
  contentClassName,
  className,
  children,
}: ModuleCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)

  // Test : la couleur de bordure de la Card reprend le fond du header. Passe
  // par la couleur *calculée* (pas une classe `border-*` reconstruite depuis
  // `headerClassName`) car `headerClassName` est assemblé au runtime — le nom
  // de classe littéral n'apparaît jamais tel quel dans le source, donc le
  // scanner statique de Tailwind ne génère jamais la règle correspondante.
  useEffect(() => {
    if (!cardRef.current || !headerRef.current) return
    cardRef.current.style.borderColor = getComputedStyle(headerRef.current).backgroundColor
  }, [headerClassName])

  return (
    <Card ref={cardRef} className={cn('gap-0 py-0 border', className)}>
      <CardHeader ref={headerRef} className={headerClassName}>
        <div className="flex h-10 mt-1 items-center border-none">
          <div className="relative -ml-4 h-full">
            <div className="absolute top-px right-px bottom-0 left-0 bg-card" />
            <div className={cn('absolute inset-0 rounded-br-xl', headerClassName)} />
            <CardTitle
              className={cn(
                'relative z-10 flex h-full items-center border-none pr-2 pl-4 pt-0 mt-[-1px] mr-[-1px]',
                headerClassName,
                'bg-transparent',
                titleClassName,
              )}
            >
              {title}
            </CardTitle>
          </div>

          <div className="relative -mr-4 h-full flex-1">
            <div className={cn('absolute top-0 right-0 bottom-px left-px', headerClassName)} />
            <div className="absolute inset-0 rounded-t-xl bg-card" />
            <div className="nodrag relative z-10 flex h-full items-center justify-end gap-1 border-none pr-4 text-foreground">
              {action}
            </div>
          </div>
        </div>
      </CardHeader>
      {/* `-mt-px` : la hauteur du header est calculée en px fractionnaires,
          ce qui laisse parfois un liseré d'1 px du fond de la Card visible
          entre les deux — le léger chevauchement l'absorbe. */}
      <CardContent className={cn('-mt-px nodrag rounded-b-md bg-card py-4 text-foreground', contentClassName)}>
        {children}
      </CardContent>
    </Card>
  )
}
