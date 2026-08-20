import { useState, type ReactNode } from 'react'
import { EllipsisVertical, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface PlanningAction {
  id: string
  ariaLabel: string
  icon: ReactNode
  onClick: () => void
  active?: boolean
  disabled?: boolean
}

// Diamètre de la roue et de son trou central (bouton de fermeture) —
// choisis pour rester centrés confortablement dans un viewport mobile
// étroit (~360-390px), vérifié visuellement par capture d'écran.
const WHEEL_SIZE = 300
const HUB_SIZE = 76
const ICON_RADIUS = (WHEEL_SIZE / 2 + HUB_SIZE / 2) / 2

function wedgeAngle(index: number, total: number): number {
  // `index + 0.5` : le MILIEU du secteur, pas sa frontière de départ —
  // sinon l'icône se retrouve à cheval entre deux secteurs (constaté à
  // l'écran). Secteur du milieu en haut (comme la référence visuelle),
  // pas à droite (0° = droite par convention trigonométrique standard).
  return (360 * (index + 0.5)) / total - 90
}

// Alterne deux teintes neutres proches par secteur (effet "camembert"
// divisé) via `conic-gradient` plutôt qu'une géométrie SVG à la main —
// beaucoup plus simple à calculer pour un nombre de secteurs variable (5
// à 7 selon la vue Planning). Le secteur actif (vue courante) reçoit la
// couleur `primary` à son emplacement exact dans les stops.
function wheelBackground(actions: PlanningAction[]): string {
  const step = 100 / actions.length
  const stops = actions.map((action, i) => {
    const start = i * step
    const end = start + step
    const color = action.active
      ? 'var(--color-primary)'
      : i % 2 === 0
        ? 'var(--color-muted)'
        : 'var(--color-card)'
    return `${color} ${start}% ${end}%`
  })
  return `conic-gradient(${stops.join(', ')})`
}

// Remplace, en mobile, toute la rangée de boutons d'action de
// PlanningWidget (jusqu'à 7 : import, nouvel événement, vues, modes
// d'affichage) par un seul déclencheur ouvrant une roue radiale plein
// écran — la rangée ne rentre pas dans la largeur d'un header de carte
// mobile (cf. PROJECT.md, jalon "version mobile"). Design demandé par
// l'utilisateur (référence visuelle fournie) : modale centrée sur fond
// sombre plutôt qu'un menu ancré près du bouton — d'où `Dialog` plutôt
// que `Popover` (la première version) : `DialogContent` a déjà le
// centrage, le fond semi-transparent (`DialogBackdrop`) et le retour de
// focus à la fermeture (`RestoreFocusContext`, cf. dialog.tsx) construits
// pour les dialogs pilotés en externe de cette app — rien à refaire ici.
//
// Pas de rôle ARIA `menu`/`menuitem` (la navigation flèches spatiale d'un
// vrai menu radial est difficile à faire correctement) : de simples
// `<button>` avec leur `aria-label` existant, parcourus au Tab (secteurs
// puis bouton central de fermeture).
export function PlanningActionsMenu({ actions }: { actions: PlanningAction[] }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('planning.toolbar.moreActions')}
        className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
      >
        <EllipsisVertical className="size-3.5" />
      </button>
      <DialogContent
        closeLabel={t('common.close')}
        showCloseButton={false}
        aria-label={t('planning.toolbar.moreActions')}
        className="h-auto w-auto border-0 bg-transparent p-0 shadow-none"
      >
        <div className="relative" style={{ width: WHEEL_SIZE, height: WHEEL_SIZE }}>
          <div className="absolute inset-0 rounded-full" style={{ background: wheelBackground(actions) }} />
          {actions.map((action, i) => {
            const angleRad = (wedgeAngle(i, actions.length) * Math.PI) / 180
            const x = Math.cos(angleRad) * ICON_RADIUS
            const y = Math.sin(angleRad) * ICON_RADIUS
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => {
                  action.onClick()
                  setOpen(false)
                }}
                disabled={action.disabled}
                aria-label={action.ariaLabel}
                aria-pressed={action.active}
                title={action.ariaLabel}
                className={cn(
                  'absolute top-1/2 left-1/2 flex size-11 items-center justify-center rounded-full text-[10px] leading-none disabled:opacity-40',
                  action.active ? 'text-primary-foreground' : 'text-foreground',
                )}
                style={{ transform: `translate(-50%, -50%) translate(${x}px, ${y}px)` }}
              >
                {action.icon}
              </button>
            )
          })}
          <DialogClose
            aria-label={t('common.close')}
            className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border bg-card text-foreground shadow-md hover:bg-muted"
            style={{ width: HUB_SIZE, height: HUB_SIZE }}
          >
            <X className="size-5" />
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}
