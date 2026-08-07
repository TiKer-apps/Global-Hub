import { MoreVertical } from 'lucide-react'
import { useEffect, useRef, useState, type PropsWithChildren } from 'react'
import { useNodeId, useOnViewportChange, useReactFlow } from '@xyflow/react'
import { RadialMenu, type RadialMenuItem } from '@/components/ui/radial-menu'
import { cn } from '@/lib/utils'

const SLIDE_TRANSITION = 'transform .45s cubic-bezier(.2,.8,.2,1)'
// Au-dessus de n'importe quel node normal (aucun n'a de zIndex explicite à
// part les post-its/fiches détachés, qui utilisent 1) — RadialMenu lui-même
// est rendu via un portail vers document.body, donc toujours visuellement
// par-dessus de toute façon, quelle que soit cette valeur.
const FRONT_Z_INDEX = 1000

interface ModuleRadialTriggerProps {
  items: RadialMenuItem[]
  triggerLabel?: string
  className?: string
  /**
   * 'slide' (défaut, mobile-first) : tout le module glisse jusqu'à ce que le
   * bouton arrive exactement au centre de l'écran, où le menu complet
   * apparaît une fois arrivé.
   * 'thread' : le module ne bouge pas ; le menu complet s'ouvre directement
   * au centre de l'écran, relié au bouton par un trait (cf. RadialMenu mode
   * 'center' avec anchor ≠ centerTarget).
   */
  variant?: 'slide' | 'thread'
}

// Adaptateur entre RadialMenu (générique, cf. components/ui/radial-menu.tsx)
// et un module vivant sur le canvas React Flow. Mobile-first : quelle que
// soit la position du module à l'écran, l'ouverture (variant 'slide', défaut)
// fait toujours glisser l'intégralité du contenu (bouton compris, ils
// bougent ensemble comme un seul bloc rigide) jusqu'à ce que le bouton
// arrive exactement au centre de l'écran — jamais un simple décalage "juste
// assez pour dégager le bord". Le menu radial complet (cercle entier, jamais
// un arc partiel) n'apparaît qu'une fois ce glissement terminé. À la
// fermeture, retour à la position d'origine (cf. Décisions du projet :
// translate(0,0), jamais un calcul "inverse" dépendant du zoom courant).
export function ModuleRadialTrigger({
  items,
  triggerLabel = 'Actions du module',
  className,
  variant = 'slide',
  children,
}: PropsWithChildren<ModuleRadialTriggerProps>) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState({ x: 0, y: 0 })
  const [centerTarget, setCenterTarget] = useState({ x: 0, y: 0 })
  const openRef = useRef(open)
  openRef.current = open
  const nodeId = useNodeId()
  const { getZoom, getNode, updateNode } = useReactFlow()
  const originalZIndexRef = useRef<number | undefined>(undefined)

  // Premier plan (juste derrière le menu, lui-même toujours au-dessus via son
  // portail) le temps de l'ouverture — sinon le module glissant (ou juste
  // celui qui a ouvert son menu) peut passer SOUS un autre module du canvas.
  const bringToFront = () => {
    if (!nodeId) return
    originalZIndexRef.current = getNode(nodeId)?.zIndex
    updateNode(nodeId, { zIndex: FRONT_Z_INDEX })
  }

  const restoreZIndex = () => {
    if (!nodeId) return
    updateNode(nodeId, { zIndex: originalZIndexRef.current })
  }

  const close = () => {
    const wrapper = wrapperRef.current
    if (wrapper) {
      wrapper.style.transition = SLIDE_TRANSITION
      wrapper.style.transform = 'translate(0px, 0px)'
    }
    restoreZIndex()
    setOpen(false)
  }

  // Le zoom/pan du canvas invalide le glissement calculé à l'ouverture (les
  // coordonnées écran d'origine du bouton ne correspondent plus à rien) —
  // fermer immédiatement plutôt que laisser un menu mal positionné.
  useOnViewportChange({
    onStart: () => {
      if (openRef.current) close()
    },
  })

  // Cleanup si le module est démonté (masqué via le drawer, supprimé...)
  // pendant que le menu est ouvert, pour ne pas laisser un portail orphelin.
  useEffect(() => () => close(), [])

  const openMenu = () => {
    const btn = btnRef.current
    const wrapper = wrapperRef.current
    if (!btn || !wrapper) return

    bringToFront()

    const rect = btn.getBoundingClientRect()
    const buttonCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    const screenCenter = { x: window.innerWidth / 2, y: window.innerHeight / 2 }

    if (variant === 'thread') {
      // Le module reste en place : anchor = position réelle du bouton,
      // centerTarget = centre de l'écran — RadialMenu trace le trait entre
      // les deux points puisqu'ils diffèrent.
      setAnchor(buttonCenter)
      setCenterTarget(screenCenter)
      setOpen(true)
      return
    }

    const zoom = getZoom()
    // Décalage écran nécessaire pour amener le bouton exactement au centre,
    // divisé par le zoom courant pour rester en coordonnées locales du node
    // (sinon l'effet visuel varie selon le niveau de zoom).
    const dx = (screenCenter.x - buttonCenter.x) / zoom
    const dy = (screenCenter.y - buttonCenter.y) / zoom

    wrapper.style.transition = SLIDE_TRANSITION
    wrapper.style.transform = `translate(${dx}px, ${dy}px)`

    // Le bouton se retrouvera exactement au centre une fois le glissement
    // terminé — c'est ce point (pas sa position actuelle, pré-glissement)
    // que RadialMenu doit utiliser comme ancre/cible (anchor === centerTarget
    // ici : le trait tracé par RadialMenu a une longueur nulle, invisible).
    setAnchor(screenCenter)
    setCenterTarget(screenCenter)

    // Choréographie voulue : le module glisse D'ABORD jusqu'au centre, le
    // menu complet apparaît SEULEMENT une fois arrivé — pas en même temps.
    const handleTransitionEnd = (e: TransitionEvent) => {
      if (e.propertyName !== 'transform') return
      wrapper.removeEventListener('transitionend', handleTransitionEnd)
      setOpen(true)
    }
    wrapper.addEventListener('transitionend', handleTransitionEnd)
  }

  return (
    <div ref={wrapperRef} className={cn('relative', className)}>
      {children}
      <button
        ref={btnRef}
        type="button"
        onClick={openMenu}
        aria-label={triggerLabel}
        className="nodrag absolute top-2 right-2 z-10 flex size-7 items-center justify-center rounded-md border bg-card text-muted-foreground shadow-sm hover:bg-muted hover:text-foreground"
      >
        <MoreVertical className="size-4" />
      </button>
      <RadialMenu items={items} anchor={anchor} mode="center" centerTarget={centerTarget} open={open} onClose={close} />
    </div>
  )
}
