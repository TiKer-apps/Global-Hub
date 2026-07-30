import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface TodoPaperProps {
  children: ReactNode
  className?: string
}

// Fond commun "feuille de bloc-note" (bloc fixe et fiche détachée) : blanc,
// lignes réglées, punaise rouge en haut — en dur (`bg-white`/`bg-red-600`)
// plutôt que les tokens du thème, pour rendre l'objet physique plutôt que
// suivre le dark mode (même logique que le jaune du post-it).
export function TodoPaper({ children, className }: TodoPaperProps) {
  return (
    <div
      className={cn(
        'relative min-h-96 w-full rounded-sm bg-white pt-4 text-sm shadow-inner [background-image:repeating-linear-gradient(to_bottom,transparent,transparent_27px,var(--border)_27px,var(--border)_28px)]',
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
