export interface ThemePreset {
  id: string
  // Clé de traduction (`moduleSettings.themes.<id>`), pas le libellé
  // affiché directement — résolue via `t()` au point de rendu
  // (`ModuleSettingsModal`), même pattern que `EventTypePreset.labelKey`.
  labelKey: string
  // Combine fond + texte, comme le `headerClassName` de ModuleCard — les
  // classes sont des littéraux ici (pas construites au runtime), donc le
  // scanner statique de Tailwind les génère normalement.
  headerClassName: string
}

// Les 6 premiers sont les thèmes qu'on a définis ensemble module par module
// (couleur d'origine de chaque widget) ; le reste sont des propositions
// supplémentaires dans le même esprit (fond franc + texte blanc, sauf les
// teintes claires où le noir passe mieux, comme pour le jaune).
export const THEME_PRESETS: ThemePreset[] = [
  { id: 'blue-300', labelKey: 'moduleSettings.themes.blue-300', headerClassName: 'bg-blue-300 text-white' },
  { id: 'yellow-400', labelKey: 'moduleSettings.themes.yellow-400', headerClassName: 'bg-yellow-400 text-black' },
  { id: 'orange-300', labelKey: 'moduleSettings.themes.orange-300', headerClassName: 'bg-orange-300 text-white' },
  { id: 'violet-500', labelKey: 'moduleSettings.themes.violet-500', headerClassName: 'bg-violet-500 text-white' },
  { id: 'red-500', labelKey: 'moduleSettings.themes.red-500', headerClassName: 'bg-red-500 text-white' },
  { id: 'green-600', labelKey: 'moduleSettings.themes.green-600', headerClassName: 'bg-green-600 text-white' },
  { id: 'pink-400', labelKey: 'moduleSettings.themes.pink-400', headerClassName: 'bg-pink-400 text-white' },
  { id: 'teal-500', labelKey: 'moduleSettings.themes.teal-500', headerClassName: 'bg-teal-500 text-white' },
  { id: 'indigo-500', labelKey: 'moduleSettings.themes.indigo-500', headerClassName: 'bg-indigo-500 text-white' },
  { id: 'slate-600', labelKey: 'moduleSettings.themes.slate-600', headerClassName: 'bg-slate-600 text-white' },
  { id: 'amber-300', labelKey: 'moduleSettings.themes.amber-300', headerClassName: 'bg-amber-300 text-black' },
  { id: 'sky-400', labelKey: 'moduleSettings.themes.sky-400', headerClassName: 'bg-sky-400 text-white' },
  { id: 'emerald-500', labelKey: 'moduleSettings.themes.emerald-500', headerClassName: 'bg-emerald-500 text-white' },
  { id: 'cyan-500', labelKey: 'moduleSettings.themes.cyan-500', headerClassName: 'bg-cyan-500 text-white' },
]

export function getPreset(id: string): ThemePreset | undefined {
  return THEME_PRESETS.find((preset) => preset.id === id)
}

// Juste la partie `bg-*` d'un `headerClassName` combiné — pour une vignette
// de couleur (drawer, modale) qui n'a pas besoin de la couleur de texte.
export function extractBgClass(headerClassName: string): string {
  return headerClassName.split(' ').find((c) => c.startsWith('bg-')) ?? 'bg-muted'
}
