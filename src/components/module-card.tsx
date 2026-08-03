import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type HeaderStyle = 'wave' | 'flat'

interface ModuleCardProps {
  title: ReactNode
  titleClassName?: string
  action?: ReactNode
  headerClassName?: string
  contentClassName?: string
  className?: string
  children: ReactNode
  // 'wave' (défaut) : encoche SVG entre titre et actions, cf. headerNotchPath.
  // 'flat' : header à plat, une seule couleur pleine sur toute la largeur.
  variant?: HeaderStyle
}

export const NOTCH_RADIUS = 14
// Le bas du path (bord droit) déborde de 1px sous la vraie hauteur du
// header : la hauteur de celui-ci se calcule en px fractionnaires, ce qui
// laisse parfois un liseré de sa couleur visible juste avant le contenu.
// Le SVG grandit d'autant pour que ce débord soit réellement peint (pas
// juste dans le viewBox) et chevauche `CardContent`. Ne touche pas au calcul
// de la courbe (`h - r`), seulement au bord bas droit du rectangle.
const BOTTOM_BLEED = 1

// Découpe entre le titre et la zone d'action, en un seul path SVG : une
// forme vectorielle n'a par définition aucune frontière entre deux boîtes
// DOM, donc plus de liseré possible au zoom (non entier) du canvas React
// Flow — contrairement à la technique précédente (deux div superposées par
// zone), qui exigeait des rustines en pixels pour chaque bord partagé.
// `tw` (largeur du titre) est mesurée au runtime car le texte est variable.
// La frontière est un S : le calque coloré du titre a son propre coin
// arrondi convexe en bas (rounded-br), le calque blanc de l'action le sien
// en haut (rounded-tl) — pas une simple encoche unique.
export function headerNotchPath(w: number, h: number, tw: number, r: number) {
  return [
    `M ${tw + r} 0`,
    `L ${w} 0`,
    `L ${w} ${h + BOTTOM_BLEED}`,
    `L ${tw - r} ${h + BOTTOM_BLEED}`,
    `L ${tw - r} ${h}`,
    `A ${r} ${r} 0 0 0 ${tw} ${h - r}`,
    `L ${tw} ${r}`,
    `A ${r} ${r} 0 0 1 ${tw + r} 0`,
    'Z',
  ].join(' ')
}

export function ModuleCard({
  title,
  titleClassName,
  action,
  headerClassName,
  contentClassName,
  className,
  children,
  variant = 'wave',
}: ModuleCardProps) {
  const isWave = variant === 'wave'
  const cardRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const [shape, setShape] = useState<{ w: number; h: number; tw: number } | null>(null)

  // La bordure ET le fond de la Card reprennent celui du header. Passe par
  // la couleur *calculée* (pas une classe `border-*`/`bg-*` reconstruite
  // depuis `headerClassName`) car `headerClassName` est assemblé au runtime —
  // le nom de classe littéral n'apparaît jamais tel quel dans le source, donc
  // le scanner statique de Tailwind ne génère jamais la règle correspondante.
  // Le fond coloré (pas seulement la bordure) évite qu'un liseré blanc/gris
  // n'apparaisse aux bords si un pixel du contenu ne recouvre pas tout à fait
  // la Card.
  useEffect(() => {
    if (!cardRef.current || !headerRef.current) return
    const color = getComputedStyle(headerRef.current).backgroundColor
    cardRef.current.style.borderColor = color
    cardRef.current.style.backgroundColor = color
  }, [headerClassName])

  // `offsetWidth`/`offsetHeight` (mesure de mise en page locale) plutôt que
  // `getBoundingClientRect` : le canvas applique un `transform: scale(...)`
  // non entier, qui fausserait la mesure avec les coordonnées écran.
  useLayoutEffect(() => {
    if (!isWave) {
      setShape(null)
      return
    }
    const header = headerRef.current
    const titleEl = titleRef.current
    if (!header || !titleEl) return
    const measure = () => setShape({ w: header.offsetWidth, h: header.offsetHeight, tw: titleEl.offsetWidth })
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(header)
    observer.observe(titleEl)
    return () => observer.disconnect()
  }, [title, action, isWave])

  return (
    <Card ref={cardRef} className={cn('gap-0 py-0 border', className)}>
      <CardHeader ref={headerRef} className={cn('relative p-0', headerClassName)}>
        {isWave && shape && (
          <svg
            className="pointer-events-none absolute inset-x-0 top-0 w-full"
            style={{ height: shape.h + BOTTOM_BLEED }}
            viewBox={`0 0 ${shape.w} ${shape.h + BOTTOM_BLEED}`}
            preserveAspectRatio="none"
          >
            <path d={headerNotchPath(shape.w, shape.h, shape.tw, NOTCH_RADIUS)} className="fill-card" />
          </svg>
        )}
        <div className="relative flex h-10 items-center">
          <CardTitle
            ref={titleRef}
            className={cn(
              'relative z-10 flex h-full items-center pl-4',
              isWave ? [headerClassName, 'bg-transparent', 'pr-4'] : 'pr-2',
              titleClassName,
            )}
          >
            {title}
          </CardTitle>
          <div
            className={cn(
              'nodrag relative z-10 flex h-full flex-1 items-center justify-end gap-1 pr-4',
              isWave && 'text-foreground',
            )}
          >
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
