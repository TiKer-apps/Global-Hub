import { useState } from 'react'
import { Eye, EyeOff, PanelLeftOpen, Settings, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { ToolbarButton } from '@/modules/text-editor/ToolbarButton'
import type { PostIt } from '@/modules/post-its/types'
import type { TodoSheet } from '@/modules/todo-list/types'
import { useColorScheme } from './color-scheme'
import { useLanguage } from './language'
import { ModuleSettingsModal } from './ModuleSettingsModal'
import { MODULES, type ModuleDefinition } from './module-registry'
import { useModuleHeaderClassName } from './module-theme'
import { extractBgClass } from './theme-presets'

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

function stripHtml(html: string, fallback: string): string {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return text || fallback
}

function previewForTodoSheet(sheet: TodoSheet, fallback: string): string {
  const first = sheet.lines.find((l) => l.text.trim() !== '')
  return first ? first.text : fallback
}

// Bouton flottant + panneau glissant listant les widgets fixes du board,
// pour les afficher/masquer sans rien supprimer (juste retirés du rendu de
// `nodes`, cf. HubCanvas — la position/l'état des modules eux-mêmes n'est
// pas touché). Post-it et Todo-list ont en plus la liste (toujours affichée,
// pas de dépliage) de leurs instances détachées (post-its/fiches
// individuels), même mécanisme de masquage que les modules eux-mêmes.
export function ModuleDrawer({ hiddenModuleIds, onToggleModule, postIts, todoSheets }: ModuleDrawerProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { language, setLanguage } = useLanguage()
  const { scheme, setScheme } = useColorScheme()

  const instancesFor = (kind?: 'postIt' | 'todoSheet'): Instance[] => {
    if (kind === 'postIt') return postIts.map((p) => ({ id: p.id, preview: stripHtml(p.html, t('common.empty')) }))
    if (kind === 'todoSheet') return todoSheets.map((s) => ({ id: s.id, preview: previewForTodoSheet(s, t('common.empty')) }))
    return []
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('common.openMenu')}
        className="fixed top-4 left-4 z-40 flex size-10 items-center justify-center rounded-lg border bg-card text-foreground shadow-md hover:bg-muted"
      >
        <PanelLeftOpen className="size-4" />
      </button>

      {open && <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setOpen(false)} />}

      <nav
        aria-label={t('common.modulesTitle')}
        className={cn(
          'fixed top-0 left-0 z-50 flex h-full w-72 flex-col border-r bg-card shadow-lg transition-transform duration-200',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between p-4 pb-4">
          <h2 className="text-sm font-semibold">{t('common.modulesTitle')}</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={t('common.closeMenu')}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4">
          <div className="grid grid-flow-row-dense grid-cols-2 gap-3">
            {MODULES.map((module) => {
              const isVisible = !hiddenModuleIds.has(module.id)
              const instances = instancesFor(module.instanceKind)

              return (
                <div
                  key={module.id}
                  className={cn(module.instanceKind && 'col-span-2', instances.length > 0 && 'border-b border-border pb-3')}
                >
                  <ModuleTile module={module} isVisible={isVisible} onToggle={() => onToggleModule(module.id)} />
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
        <div className="space-y-2 border-t p-4">
          <div className="flex items-center justify-center gap-1">
            <ToolbarButton active={language === 'fr'} size="sm" onClick={() => setLanguage('fr')} aria-label="Français">
              FR
            </ToolbarButton>
            <ToolbarButton active={language === 'en'} size="sm" onClick={() => setLanguage('en')} aria-label="English">
              EN
            </ToolbarButton>
          </div>
          <div className="flex items-center justify-center gap-1">
            <ToolbarButton
              active={scheme === 'light'}
              aria-pressed={scheme === 'light'}
              size="sm"
              onClick={() => setScheme('light')}
            >
              {t('common.lightMode')}
            </ToolbarButton>
            <ToolbarButton
              active={scheme === 'dark'}
              aria-pressed={scheme === 'dark'}
              size="sm"
              onClick={() => setScheme('dark')}
            >
              {t('common.darkMode')}
            </ToolbarButton>
          </div>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <Settings className="size-4" />
            {t('common.settingsButton')}
          </button>
        </div>
      </nav>

      <ModuleSettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  )
}

interface ModuleTileProps {
  module: ModuleDefinition
  isVisible: boolean
  onToggle: () => void
}

// Vignette d'un module dans le drawer — composant à part pour pouvoir
// appeler le hook de thème par module (nombre de modules fixe, donc l'ordre
// des hooks reste stable d'un rendu à l'autre).
function ModuleTile({ module, isVisible, onToggle }: ModuleTileProps) {
  const { t } = useTranslation()
  const Icon = module.icon
  const bgClass = extractBgClass(useModuleHeaderClassName(module.id, module.defaultThemeId))

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={isVisible}
      className={cn(
        'flex w-full flex-col items-center gap-1.5 rounded-lg border-2 p-2.5 transition-colors',
        isVisible ? 'border-green-500' : 'border-muted-foreground/30',
      )}
    >
      <div
        className={cn(
          'relative flex h-12 w-full items-center justify-center rounded-md border border-border text-white shadow-sm',
          bgClass,
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
      <span className="text-xs font-medium">{t(module.labelKey)}</span>
    </button>
  )
}
