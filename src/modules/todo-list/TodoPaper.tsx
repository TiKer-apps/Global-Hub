import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface TodoPaperProps {
  children: ReactNode
  className?: string
}

// Fond commun "feuille de bloc-note" (bloc fixe et fiche détachée) : blanc,
// lignes réglées, punaise rouge en haut — objet physique plutôt que
// composant UI suivant le thème général (même logique que le jaune du
// post-it), mais avec sa propre variante dark (voir `.todo-paper` dans
// index.css) plutôt que de rester figé sur un blanc identique en toute
// circonstance.
export function TodoPaper({ children, className }: TodoPaperProps) {
  return (
    <div
      className={cn(
        'paper-surface todo-paper relative min-h-96 w-full rounded-sm pt-4 text-sm shadow-inner [background-image:repeating-linear-gradient(to_bottom,transparent,transparent_27px,var(--todo-paper-line)_27px,var(--todo-paper-line)_28px)]',
        className,
      )}
    >
      <div className="absolute -top-2.5 left-1/2 size-4 -translate-x-1/2 rounded-full bg-red-600 shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
        <div className="absolute top-0.5 left-1 size-1 rounded-full bg-white/50" />
      </div>
      {children}
    </div>
  )
}
