// Module transverse : agrège tout élément flaggé `important`, quel que soit
// son module d'origine. En v1 seul le planning implémente le flag.

export type ImportantItemKind = 'event' | 'note' | 'post-it'

export interface ImportantItemRef {
  kind: ImportantItemKind
  id: string
}
