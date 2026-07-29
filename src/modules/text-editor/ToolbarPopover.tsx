import type { ReactNode } from 'react'
import { buttonVariants } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface ToolbarPopoverProps {
  trigger: ReactNode
  triggerLabel: string
  children: ReactNode
  contentClassName?: string
}

// Sous-menu de toolbar : déclenché par un bouton compact (ex. "Aa", "A"
// souligné), pour regrouper des options qui prendraient trop de place en
// ligne (tailles, couleurs, polices...).
export function ToolbarPopover({ trigger, triggerLabel, children, contentClassName }: ToolbarPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger
        className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }), 'relative')}
        aria-label={triggerLabel}
      >
        {trigger}
      </PopoverTrigger>
      {/* `nodrag` : le contenu est porté par un portail React, hors de l'arbre
          DOM du widget — sans ça React Flow ne le reconnaît pas comme
          protégé du drag. */}
      <PopoverContent className={cn('nodrag w-auto flex-row gap-1 p-1', contentClassName)}>
        {children}
      </PopoverContent>
    </Popover>
  )
}
