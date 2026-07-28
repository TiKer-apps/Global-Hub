import type { Importable } from '@/lib/types'

export type PostItFont = 'sans' | 'handwritten' | 'marker' | 'typewriter'

export interface PostIt extends Importable {
  id: string
  html: string
  font: PostItFont
  color?: string
  createdAt: string
}
