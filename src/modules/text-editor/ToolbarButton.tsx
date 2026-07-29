import type { ComponentProps } from 'react'
import { Button } from '@/components/ui/button'

type ButtonProps = ComponentProps<typeof Button>

interface ToolbarButtonProps extends Omit<ButtonProps, 'variant'> {
  active?: boolean
}

// Bouton de toolbar standard : fond plein (secondary) quand actif, ghost
// sinon. Utilisé pour gras/italique et tout futur toggle simple (post-its...).
export function ToolbarButton({ active, size = 'icon-sm', type = 'button', ...props }: ToolbarButtonProps) {
  return <Button type={type} size={size} variant={active ? 'secondary' : 'ghost'} {...props} />
}
