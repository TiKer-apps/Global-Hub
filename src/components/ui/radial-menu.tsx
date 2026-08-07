import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

export interface RadialMenuItem {
  id: string
  label: string
  icon?: ReactNode
  onSelect: () => void
}

export interface RadialMenuProps {
  items: RadialMenuItem[]
  /** Position écran (viewport) du bouton qui a ouvert le menu. */
  anchor: { x: number; y: number }
  /**
   * 'arc' : les items se répartissent sur un arc autour de `anchor`, borné
   * par `arcRange` (utile près d'un bord d'écran). 'center' : les items
   * forment un cercle complet autour de `centerTarget`, position stable
   * indépendante du bord — un trait relie visuellement `anchor` au centre.
   */
  mode: 'arc' | 'center'
  /** Degrés [début, fin], sens horaire depuis l'axe des x. Ignoré en mode 'center'. */
  arcRange?: [number, number]
  /** Requis en mode 'center' : point autour duquel le cercle est dessiné. */
  centerTarget?: { x: number; y: number }
  open: boolean
  onClose: () => void
}

const ARC_RADIUS = 100
const CENTER_RADIUS = 96
// Écart minimal souhaité entre les centres de deux items adjacents (item
// ~48px + marge) — sans ça, un arc étroit (ex. 90° dans un vrai coin
// d'écran) avec plusieurs items se chevauche complètement à rayon fixe :
// constaté visuellement dans la story "Arc Near Corner" avant ce calcul.
const MIN_ITEM_SPACING = 64

// Grandit au-delà de `baseRadius` quand l'angle entre deux items adjacents
// est trop serré pour `MIN_ITEM_SPACING` à rayon de base.
function radiusForSpacing(baseRadius: number, stepRad: number) {
  if (!Number.isFinite(stepRad) || stepRad <= 0) return baseRadius
  return Math.max(baseRadius, MIN_ITEM_SPACING / stepRad)
}

// Menu radial générique : positionnement, arc/cercle, portail écran,
// ouverture/fermeture visuelle. Aucune connaissance de React Flow ou d'un
// quelconque module métier — l'adaptateur (cf. canvas/module-radial-trigger)
// fournit `anchor`/`centerTarget` déjà en coordonnées écran.
export function RadialMenu({
  items,
  anchor,
  mode,
  arcRange = [180, 270],
  centerTarget,
  open,
  onClose,
}: RadialMenuProps) {
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  const target = mode === 'center' && centerTarget ? centerTarget : anchor
  const stepRad =
    items.length <= 1
      ? Math.PI
      : mode === 'center'
        ? (2 * Math.PI) / items.length
        : ((arcRange[1] - arcRange[0]) * Math.PI) / 180 / (items.length - 1)
  const radius = radiusForSpacing(mode === 'center' ? CENTER_RADIUS : ARC_RADIUS, stepRad)

  return createPortal(
    <div
      className="fixed inset-0 z-50 animate-in bg-black/30 fade-in-0 duration-150"
      onClick={onClose}
      role="presentation"
    >
      {mode === 'center' && (
        <svg className="pointer-events-none absolute inset-0 h-full w-full">
          <line
            x1={anchor.x}
            y1={anchor.y}
            x2={target.x}
            y2={target.y}
            className="stroke-primary/60"
            strokeWidth={2}
            strokeDasharray="4 4"
          />
        </svg>
      )}
      <div role="menu" aria-label="Actions du module">
        {items.map((item, i) => {
          const angle =
            mode === 'center'
              ? (360 / items.length) * i - 90
              : arcRange[0] + ((arcRange[1] - arcRange[0]) * i) / Math.max(items.length - 1, 1)
          const rad = (angle * Math.PI) / 180
          const x = target.x + radius * Math.cos(rad)
          const y = target.y + radius * Math.sin(rad)
          return (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              aria-label={item.label}
              className={cn(
                'absolute flex -translate-x-1/2 -translate-y-1/2 animate-in flex-col items-center gap-1 zoom-in-50 fade-in-0 duration-200',
              )}
              // `animate-in` (tw-animate-css) applique déjà `animation-fill-mode:
              // both` par défaut — indispensable pour qu'un item retombe bien
              // sur son état final (opaque) après l'animation, PAS seulement
              // avant (le `delay` par item ferait sinon disparaître les items
              // sitôt l'animation terminée : `backwards` seul ne garde que
              // l'état AVANT le début, jamais l'état final).
              style={{ left: x, top: y, animationDelay: `${i * 30}ms` }}
              onClick={(e) => {
                e.stopPropagation()
                item.onSelect()
                onClose()
              }}
            >
              <span className="flex size-12 items-center justify-center rounded-full border bg-card text-foreground shadow-md transition-transform hover:scale-105 hover:bg-muted [&_svg]:size-5">
                {item.icon}
              </span>
              <span className="max-w-16 truncate text-center text-xs font-medium text-white drop-shadow">
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>,
    document.body,
  )
}
