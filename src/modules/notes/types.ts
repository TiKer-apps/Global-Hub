import type { Importable } from '@/lib/types'

export interface Note extends Importable {
  id: string
  title: string
  html: string // contenu avec mise en forme minimale (couleur, taille, gras, italique)
  createdAt: string
  updatedAt: string
}
