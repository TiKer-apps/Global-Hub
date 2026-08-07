# Menu radial — spécification & décisions

Document de reprise pour implémenter le menu radial dans global-hub. Contexte
complet ci-dessous ; les décisions actées sont dans "Décisions" ; le code est
un point de départ à adapter, pas du copier-coller final.

## Contexte / objectif

Chaque module (`ModuleCard`) n'expose qu'un seul bouton, qui ouvre un menu
radial regroupant les sous-actions du module (au lieu d'une en-tête chargée
de plusieurs boutons). Problème à résoudre : le bouton peut être proche d'un
bord de l'écran (les modules sont des nodes React Flow positionnés librement
sur un canvas zoomable/pannable), ce qui rend un menu radial classique
partiellement inaccessible ou coupé.

Deux scénarios envisagés, pensés pour le mobile :

1. **Glissement du fond** — au clic, le contenu du `ModuleCard` glisse en
   diagonale pour éloigner le bouton du bord, libérant l'espace nécessaire à
   l'arc du menu radial.
2. **Fil vers le centre** — au clic, un trait se trace du bouton vers le
   centre de l'écran, et le menu radial apparaît centré (position stable,
   indépendante de la position du bouton).

Une maquette interactive comparant les deux a été validée en amont (rendu
Claude, non versionné) — le scénario 1 a été retenu comme option par défaut
pour l'instant, mais rien n'empêche de proposer les deux (voir "Ouvert").

## Décisions actées

- **Le glissement (scénario 1) est purement visuel** : un `transform:
  translate()` CSS appliqué au conteneur de contenu à l'intérieur du
  `ModuleCard`. On ne touche **jamais** aux coordonnées `x`/`y` du node React
  Flow, ni à `setViewport()` (globalement, ça déplacerait tous les autres
  modules et casserait leur position persistée). Chaque `ModuleCard` est
  indépendant, sans notion de voisinage — le glissement reste local à la
  card qui a été cliquée.
- **Le menu doit être rendu en repère écran (viewport), pas en repère
  canvas.** Le bouton vit à l'intérieur d'une node soumise au zoom/pan de
  React Flow ; le menu, lui, doit avoir une taille et un rayon constants à
  l'écran. Solution : `createPortal` vers `document.body`, positionnement en
  `position: fixed` avec des coordonnées issues de `getBoundingClientRect()`.
- **Fermeture = retour explicite à `translate(0, 0)`**, jamais un calcul
  "inverse" dépendant du zoom au moment de la fermeture (le zoom peut avoir
  changé entre l'ouverture et la fermeture). `0, 0` est le seul état de repos
  fiable puisque les coordonnées réelles du node n'ont jamais changé.
- **Si le zoom React Flow change pendant que le menu est ouvert**, fermer
  automatiquement le menu (le `transform` calculé à l'ouverture devient faux
  sinon). Écouter via `onMove`/`onViewportChange` du hook `useReactFlow`.
- **Nettoyage au démontage** : si le `ModuleCard` est masqué (drawer) ou
  supprimé pendant que le menu est ouvert, fermer le menu dans le cleanup
  d'un `useEffect` pour éviter un portail orphelin.
- **Placement des fichiers** (cf. règle du projet — comportement propre à un
  module vs coordination transverse vs composant sans logique métier) :
  - `components/ui/radial-menu.tsx` — composant "bête" : positionnement,
    arc, ouverture/fermeture visuelle, rendu des items. Aucune connaissance
    de React Flow. **Story Storybook obligatoire** (definition of done du
    projet).
  - `canvas/module-radial-trigger.tsx` — adaptateur : sait qu'on est dans un
    `ModuleCard` sur un canvas React Flow, calcule le zoom, détecte la
    proximité d'un bord, gère le `transform` du contenu, fournit les items
    par module appelant.

## Points techniques à respecter

- **Diviser le décalage par le zoom courant** (`getZoom()` de
  `useReactFlow()`) avant de l'appliquer en `transform` : un décalage voulu
  de "100px écran" doit devenir `100 / zoom` en coordonnées locales du node,
  sinon l'effet visuel varie selon le niveau de zoom.
- **Toujours animer via `transform`, jamais `left`/`top`** — permet
  l'interpolation propre par le navigateur même si l'utilisateur retouche le
  bouton pendant l'animation d'ouverture (pas de gestion manuelle
  nécessaire).
- **Détection de bord** : comparer `getBoundingClientRect()` du bouton aux
  bords du viewport avec un seuil (`EDGE_THRESHOLD`, ~120px écran) pour
  décider si un traitement anti-bord est nécessaire, ou si le module est déjà
  assez loin des bords pour un arc simple sans glissement.

## Esquisse de code (point de départ, à retravailler)

```tsx
// components/ui/radial-menu.tsx
import { createPortal } from 'react-dom'

type RadialMenuItem = {
  id: string
  label: string
  icon?: React.ReactNode
  onSelect: () => void
}

type RadialMenuProps = {
  items: RadialMenuItem[]
  anchor: { x: number; y: number }        // position écran du bouton (viewport)
  mode: 'arc' | 'center'
  arcRange?: [number, number]              // ex. [180, 270] pour un bouton en bas-droite
  centerTarget?: { x: number; y: number }  // requis si mode === 'center'
  open: boolean
  onClose: () => void
}

export function RadialMenu({
  items, anchor, mode, arcRange = [180, 270], centerTarget, open, onClose,
}: RadialMenuProps) {
  if (!open) return null

  const target = mode === 'center' && centerTarget ? centerTarget : anchor
  const radius = mode === 'center' ? 90 : 100

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/30" onClick={onClose}>
      {mode === 'center' && (
        <svg className="pointer-events-none absolute inset-0 h-full w-full">
          <line
            x1={anchor.x} y1={anchor.y} x2={target.x} y2={target.y}
            className="stroke-primary" strokeWidth={2} strokeDasharray="4 4"
          />
        </svg>
      )}
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
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-card border shadow-md h-14 w-14 text-xs"
            style={{ left: x, top: y }}
            onClick={(e) => { e.stopPropagation(); item.onSelect(); onClose() }}
          >
            {item.label}
          </button>
        )
      })}
    </div>,
    document.body,
  )
}
```

```tsx
// canvas/module-radial-trigger.tsx
import { useReactFlow } from '@xyflow/react'
import { useEffect, useRef, useState } from 'react'
import { RadialMenu } from '@/components/ui/radial-menu'

const EDGE_THRESHOLD = 120 // px écran
const OFFSET = { x: -90, y: -110 } // décalage voulu à l'écran, scénario "glissement"

type RadialMenuItemInput = Omit<Parameters<typeof RadialMenu>[0]['items'][number], never>

export function ModuleRadialTrigger({ items }: { items: RadialMenuItemInput[] }) {
  const btnRef = useRef<HTMLButtonElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState({ x: 0, y: 0 })
  const { getZoom } = useReactFlow()

  const close = () => {
    if (contentRef.current) contentRef.current.style.transform = 'translate(0, 0)'
    setOpen(false)
  }

  const openMenu = () => {
    const rect = btnRef.current!.getBoundingClientRect()
    const point = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    setAnchor(point)

    const nearEdge =
      point.x < EDGE_THRESHOLD || point.y < EDGE_THRESHOLD ||
      point.x > window.innerWidth - EDGE_THRESHOLD ||
      point.y > window.innerHeight - EDGE_THRESHOLD

    if (nearEdge && contentRef.current) {
      const zoom = getZoom()
      contentRef.current.style.transition = 'transform .45s cubic-bezier(.2,.8,.2,1)'
      contentRef.current.style.transform = `translate(${OFFSET.x / zoom}px, ${OFFSET.y / zoom}px)`
    }
    setOpen(true)
  }

  // ferme le menu si le canvas bouge (zoom/pan) pendant qu'il est ouvert
  // -> à câbler sur l'évènement de viewport de React Flow (onMove / onViewportChange)

  useEffect(() => () => close(), []) // cleanup si le node est démonté

  return (
    <>
      <div ref={contentRef}>{/* contenu du ModuleCard */}</div>
      <button ref={btnRef} onClick={openMenu}>+</button>
      <RadialMenu
        items={items}
        anchor={anchor}
        mode="arc"
        arcRange={[180, 270]}
        open={open}
        onClose={close}
      />
    </>
  )
}
```

## Ouvert / à trancher dans Claude Code

- Un seul scénario partout, ou choix selon le module (ex. planning en vue
  grille étendue = plutôt scénario "fil vers le centre" pour ne pas déformer
  la grille horaire ; modules à contenu simple = "glissement" acceptable) ?
- Câblage exact de la fermeture sur mouvement du canvas (`onMove` vs
  `onViewportChange` — vérifier lequel est disponible selon la version de
  `@xyflow/react` utilisée dans le repo).
- Items du menu radial par module — à définir un par un (ex. Notes : + note
  / vue liste ; Post-it : détacher ; etc.).
- Story Storybook de `radial-menu.tsx` (obligatoire avant de considérer le
  composant terminé, cf. Definition of done du projet).
