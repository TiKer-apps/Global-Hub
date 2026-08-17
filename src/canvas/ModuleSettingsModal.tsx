import { useTranslation } from 'react-i18next'
import { headerNotchPath, NOTCH_RADIUS } from '@/components/module-card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsPanel, TabsTab } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { useModuleHeaderClassName, useModuleThemeId, useSetModuleTheme } from './module-theme'
import { HEADER_STYLE_OPTIONS, useModuleStyleId, useSetModuleStyle } from './module-style'
import { MODULES, type ModuleDefinition } from './module-registry'
import { extractBgClass, THEME_PRESETS } from './theme-presets'

// Bordure + ombre légère sur les aperçus de couleur/style — sans ça, un
// aperçu clair (ex. la moitié blanche du style "Vague") se fond dans le fond
// de la modale et devient illisible.
const PREVIEW_CLASSNAME = 'border border-border shadow-sm'

// Dimensions fictives pour le path de l'aperçu "Vague" — mêmes proportions
// que le vrai header (h-10 = 40px, NOTCH_RADIUS), `tw` fixé au milieu faute
// de vrai titre à mesurer ici. Même fonction que le vrai ModuleCard : les
// deux courbes (haut ET bas) sont donc forcément fidèles, pas une
// approximation à deux div qui ne rendait que la courbe du haut.
const PREVIEW_W = 120
const PREVIEW_H = 40
const PREVIEW_TITLE_W = 60

interface ModuleSettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Un onglet par module (pour l'instant, juste le choix de thème — d'autres
// réglages par module pourront s'ajouter ici plus tard, un onglet de plus
// n'affecte pas les autres).
export function ModuleSettingsModal({ open, onOpenChange }: ModuleSettingsModalProps) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] w-full max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('common.settingsButton')}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue={MODULES[0].id}>
          <TabsList>
            {MODULES.map((module) => (
              <TabsTab key={module.id} value={module.id}>
                {t(module.labelKey)}
              </TabsTab>
            ))}
          </TabsList>
          {MODULES.map((module) => (
            <TabsPanel key={module.id} value={module.id} className="space-y-4 pt-4">
              <ModuleStylePicker module={module} />
              <ModuleThemePicker module={module} />
            </TabsPanel>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

function ModuleThemePicker({ module }: { module: ModuleDefinition }) {
  const { t } = useTranslation()
  const currentThemeId = useModuleThemeId(module.id, module.defaultThemeId)
  const setThemeId = useSetModuleTheme()

  return (
    <div>
      <h3 className="mb-3 text-sm font-medium">{t('moduleSettings.themeTitle')}</h3>
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
                  PREVIEW_CLASSNAME,
                  preset.headerClassName,
                )}
              >
                Aa
              </div>
              <span className="text-xs">{t(preset.labelKey)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ModuleStylePicker({ module }: { module: ModuleDefinition }) {
  const { t } = useTranslation()
  const currentStyleId = useModuleStyleId(module.id, module.defaultStyleId)
  const setStyleId = useSetModuleStyle()
  const bgClass = extractBgClass(useModuleHeaderClassName(module.id, module.defaultThemeId))

  return (
    <div>
      <h3 className="mb-3 text-sm font-medium">{t('moduleSettings.styleTitle')}</h3>
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
        {HEADER_STYLE_OPTIONS.map((option) => {
          const isSelected = option.id === currentStyleId
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setStyleId(module.id, option.id)}
              aria-pressed={isSelected}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-lg border-2 p-2 transition-colors',
                isSelected ? 'border-primary' : 'border-transparent hover:border-muted-foreground/30',
              )}
            >
              <div className={cn('relative h-10 w-full overflow-hidden rounded-md', bgClass, PREVIEW_CLASSNAME)}>
                {option.id === 'wave' && (
                  <svg
                    className="absolute inset-0 h-full w-full"
                    viewBox={`0 0 ${PREVIEW_W} ${PREVIEW_H}`}
                    preserveAspectRatio="none"
                  >
                    <path
                      d={headerNotchPath(PREVIEW_W, PREVIEW_H, PREVIEW_TITLE_W, NOTCH_RADIUS)}
                      className="fill-card"
                    />
                  </svg>
                )}
              </div>
              <span className="text-xs">{t(option.labelKey)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
