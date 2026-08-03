import { useState } from 'react'
import { Eye, EyeOff, PanelLeftOpen, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PostIt } from '@/modules/post-its/types'
import type { TodoSheet } from '@/modules/todo-list/types'
import { MODULES } from './module-registry'

interface ModuleDrawerProps {
  hiddenModuleIds: Set<string>
  onToggleModule: (id: string) => void
  postIts: PostIt[]
  todoSheets: TodoSheet[]
}

interface Instance {
  id: string
  preview: string
}

function stripHtml(html: string): string {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return text || 'Vide'
}

function previewForTodoSheet(sheet: TodoSheet): string {
  const first = sheet.lines.find((l) => l.text.trim() !== '')
  return first ? first.text : 'Vide'
}

// Bouton flottant + panneau glissant listant les widgets fixes du board,
// pour les afficher/masquer sans rien supprimer (juste retirés du rendu de
// `nodes`, cf. HubCanvas — la position/l'état des modules eux-mêmes n'est
// pas touché). Post-it et Todo-list ont en plus la liste (toujours affichée,
// pas de dépliage) de leurs instances détachées (post-its/fiches
// individuels), même mécanisme de masquage que les modules eux-mêmes.
export function ModuleDrawer({ hiddenModuleIds, onToggleModule, postIts, todoSheets }: ModuleDrawerProps) {
  const [open, setOpen] = useState(false)

  const instancesFor = (kind?: 'postIt' | 'todoSheet'): Instance[] => {
    if (kind === 'postIt') return postIts.map((p) => ({ id: p.id, preview: stripHtml(p.html) }))
    if (kind === 'todoSheet') return todoSheets.map((s) => ({ id: s.id, preview: previewForTodoSheet(s) }))
    return []
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le menu des modules"
        className="fixed top-4 left-4 z-40 flex size-10 items-center justify-center rounded-lg border bg-card text-foreground shadow-md hover:bg-muted"
      >
        <PanelLeftOpen className="size-4" />
      </button>

      {open && <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setOpen(false)} />}

      <div
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-72 overflow-y-auto border-r bg-card p-4 shadow-lg transition-transform duration-200',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Modules</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fermer le menu"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="grid grid-flow-row-dense grid-cols-2 gap-3">
          {MODULES.map((module) => {
            const isVisible = !hiddenModuleIds.has(module.id)
            const Icon = module.icon
            const instances = instancesFor(module.instanceKind)

            return (
              <div
                key={module.id}
                className={cn(module.instanceKind && 'col-span-2', instances.length > 0 && 'border-b border-border pb-3')}
              >
                <button
                  type="button"
                  onClick={() => onToggleModule(module.id)}
                  aria-pressed={isVisible}
                  className={cn(
                    'flex w-full flex-col items-center gap-1.5 rounded-lg border-2 p-2.5 transition-colors',
                    isVisible ? 'border-green-500' : 'border-muted-foreground/30',
                  )}
                >
                  <div
                    className={cn(
                      'relative flex h-12 w-full items-center justify-center rounded-md text-white',
                      module.colorClass,
                    )}
                  >
                    <Icon className="size-5" />
                    <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full border bg-card">
                      {isVisible ? (
                        <Eye className="size-3 text-green-600" />
                      ) : (
                        <EyeOff className="size-3 text-muted-foreground" />
                      )}
                    </span>
                  </div>
                  <span className="text-xs font-medium">{module.label}</span>
                </button>
                {instances.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {instances.map((instance) => {
                      const instanceVisible = !hiddenModuleIds.has(instance.id)
                      return (
                        <button
                          key={instance.id}
                          type="button"
                          onClick={() => onToggleModule(instance.id)}
                          aria-pressed={instanceVisible}
                          className={cn(
                            'flex w-full items-center gap-2 rounded-md border-2 px-2 py-1 text-left text-xs transition-colors',
                            instanceVisible ? 'border-green-500' : 'border-muted-foreground/30',
                          )}
                        >
                          <span className="flex-1 truncate">{instance.preview}</span>
                          {instanceVisible ? (
                            <Eye className="size-3 shrink-0 text-green-600" />
                          ) : (
                            <EyeOff className="size-3 shrink-0 text-muted-foreground" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
