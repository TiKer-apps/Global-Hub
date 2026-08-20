import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

// Élément à refocaliser à la fermeture — capturé ici (au niveau de `Dialog`,
// qui connaît `open`) et consommé par `DialogContent` (qui rend le
// `Popup` et son `finalFocus`). Nécessaire car ces dialogs sont tous
// pilotés en externe (`open`/`onOpenChange` React state, pas de
// `<DialogTrigger>`) : le comportement par défaut de Base UI ("retour au
// trigger ou à l'élément précédemment focusé") ne s'applique alors pas,
// mesuré à `<body>` dans l'audit accessibilité du 2026-08-19. Un Context
// plutôt qu'un prop sur chaque appelant : ça corrige tous les dialogs de
// l'app sans toucher leurs call sites.
const RestoreFocusContext = React.createContext<React.RefObject<HTMLElement | null> | null>(null)

function Dialog({ open, ...props }: DialogPrimitive.Root.Props) {
  const restoreFocusRef = React.useRef<HTMLElement | null>(null)
  React.useEffect(() => {
    if (open) restoreFocusRef.current = document.activeElement as HTMLElement | null
  }, [open])
  return (
    <RestoreFocusContext.Provider value={restoreFocusRef}>
      <DialogPrimitive.Root data-slot="dialog" open={open} {...props} />
    </RestoreFocusContext.Provider>
  )
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogBackdrop({ className, ...props }: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-backdrop"
      className={cn(
        "fixed inset-0 z-50 bg-black/50 duration-150 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

interface DialogContentProps extends DialogPrimitive.Popup.Props {
  // Requis plutôt qu'un défaut anglais en dur : ce composant `ui/*` ne
  // dépend pas de i18n (comme le reste de `components/ui`), donc chaque
  // appelant doit fournir sa propre chaîne traduite (`t('common.close')`)
  // pour le bouton de fermeture — sans nom accessible sinon (icône `X`
  // seule), constat critique de l'audit accessibilité du 2026-08-19.
  closeLabel: string
  // `false` pour un contenu qui fournit son propre bouton de fermeture
  // (ex. le menu radial Planning, croix au centre de la roue plutôt qu'en
  // coin) — `true` par défaut, inchangé pour les appelants existants.
  showCloseButton?: boolean
}

function DialogContent({ className, children, closeLabel, showCloseButton = true, ...props }: DialogContentProps) {
  const restoreFocusRef = React.useContext(RestoreFocusContext)
  return (
    <DialogPrimitive.Portal>
      <DialogBackdrop />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        // Cf. `RestoreFocusContext` ci-dessus : `finalFocus={true}` seul ne
        // suffisait pas (mesuré, toujours `<body>`) — il faut désigner
        // explicitement l'élément capturé à l'ouverture.
        finalFocus={() => restoreFocusRef?.current ?? true}
        className={cn(
          "fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-card p-4 text-card-foreground shadow-lg outline-hidden duration-150 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogClose
            aria-label={closeLabel}
            className="absolute top-3 right-3 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </DialogClose>
        )}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("mb-3 flex flex-col gap-0.5 pr-6", className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("mt-4 flex items-center justify-end gap-2", className)}
      {...props}
    />
  )
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-base font-semibold", className)}
      {...props}
    />
  )
}

function DialogDescription({ className, ...props }: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
