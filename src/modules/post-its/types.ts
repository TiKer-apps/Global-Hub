import type { Importable } from '@/lib/types'

export type PostItFont = 'sans' | 'handwritten' | 'marker' | 'typewriter'

export interface PostIt extends Importable {
  id: string
  html: string
  font: PostItFont
  color?: string
  createdAt: string
  // Position sur le canvas — un post-it détaché du bloc est un node React
  // Flow indépendant, sa position doit être persistée (contrairement aux
  // widgets fixes dont la position reste locale pour l'instant).
  x: number
  y: number
}
