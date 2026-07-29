import type { Importable } from '@/lib/types'

export interface PostIt extends Importable {
  id: string
  // Contenu riche (Tiptap) : gras, italique, taille, police et couleur sont
  // des marks dans ce HTML, au même titre que pour les notes — pas de champ
  // `font`/`color` séparé, la même toolbar partagée (StyleToolbar) gère tout.
  html: string
  createdAt: string
  // Position sur le canvas — un post-it détaché du bloc est un node React
  // Flow indépendant, sa position doit être persistée (contrairement aux
  // widgets fixes dont la position reste locale pour l'instant).
  x: number
  y: number
}
