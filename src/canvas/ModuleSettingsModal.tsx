import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsPanel, TabsTab } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { useModuleThemeId, useSetModuleTheme } from './module-theme'
import { MODULES, type ModuleDefinition } from './module-registry'
import { THEME_PRESETS } from './theme-presets'

interface ModuleSettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Un onglet par module (pour l'instant, juste le choix de thème — d'autres
// réglages par module pourront s'ajouter ici plus tard, un onglet de plus
// n'affecte pas les autres).
export function ModuleSettingsModal({ open, onOpenChange }: ModuleSettingsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] w-full max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Réglages des modules</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue={MODULES[0].id}>
          <TabsList>
            {MODULES.map((module) => (
              <TabsTab key={module.id} value={module.id}>
                {module.label}
              </TabsTab>
            ))}
          </TabsList>
          {MODULES.map((module) => (
            <TabsPanel key={module.id} value={module.id} className="pt-4">
              <ModuleThemePicker module={module} />
            </TabsPanel>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

function ModuleThemePicker({ module }: { module: ModuleDefinition }) {
  const currentThemeId = useModuleThemeId(module.id, module.defaultThemeId)
  const setThemeId = useSetModuleTheme()

  return (
    <div>
      <h3 className="mb-3 text-sm font-medium">Thème (fond et texte du titre)</h3>
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
        {THEME_PRESETS.map((preset) => {
          const isSelected = preset.id === currentThemeId
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => setThemeId(module.id, preset.id)}
              aria-pressed={isSelected}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-lg border-2 p-2 transition-colors',
                isSelected ? 'border-primary' : 'border-transparent hover:border-muted-foreground/30',
              )}
            >
              <div
                className={cn(
                  'flex h-10 w-full items-center justify-center rounded-md text-xs font-medium',
                  preset.headerClassName,
                )}
              >
                Aa
              </div>
              <span className="text-xs">{preset.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
