import type { Importable } from '@/lib/types'

export type EventSource = 'local' | 'google' | 'outlook'

export interface CalendarEvent extends Importable {
  id: string
  title: string
  start: string // ISO 8601
  end: string // ISO 8601
  allDay: boolean
  description?: string
  location?: string
  color?: string
  source: EventSource
  externalId?: string // id côté source externe, pour dédup à l'import
  recurrence?: string // RRULE, champ réservé — non géré en v1
}

export type PlanningView = 'day' | 'week' | 'month'
export type PlanningMode = 'compact' | 'extended'

export interface PlanningWidgetConfig {
  view: PlanningView
  mode: PlanningMode
}

// Plage horaire sélectionnée par glisser dans WeekGrid (heures entières,
// `endHour` exclusif) — remonté au parent pour pré-remplir la future modale
// de création d'event.
export interface TimeRangeSelection {
  day: Date
  startHour: number
  endHour: number
  allDay?: boolean // vue mois : pas d'axe horaire, la case représente la journée entière
}
