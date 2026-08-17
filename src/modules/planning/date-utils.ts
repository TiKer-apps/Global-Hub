import type { CalendarEvent } from './types'

// Locale complète (BCP 47) attendue par `Intl.DateTimeFormat` à partir du
// code de langue court tenu par i18next (`i18n.language`, 'fr'/'en').
const INTL_LOCALES: Record<string, string> = { fr: 'fr-FR', en: 'en-US' }

export function toIntlLocale(language: string): string {
  return INTL_LOCALES[language] ?? INTL_LOCALES.fr
}

// Calculé à la volée via `Intl` plutôt qu'un tableau de libellés en dur par
// langue (avant l'i18n) — s'étend à toute langue future sans retoucher ce
// fichier, la donnée vient du navigateur.
export function getDayLabel(day: Date, language: string): string {
  return new Intl.DateTimeFormat(toIntlLocale(language), { weekday: 'short' }).format(day)
}

// Étiquettes d'en-tête Lun-Dim pour la vue mois (`MonthGrid`) : mêmes
// jours que `getWeekDays` (semaine de référence arbitraire, seul l'ordre
// Lun→Dim compte), calculées dans la locale courante.
export function getWeekDayHeaderLabels(language: string): string[] {
  return getWeekDays(new Date()).map((day) => getDayLabel(day, language))
}

// Lundi comme premier jour de semaine (convention FR, gardée pour toutes
// les langues supportées) : `getDay()` renvoie 0 (dimanche) à 6 (samedi),
// `(day + 6) % 7` ramène ça à une distance depuis le lundi le plus récent.
export function getWeekDays(reference: Date): Date[] {
  const diffToMonday = (reference.getDay() + 6) % 7
  const monday = new Date(reference)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(monday.getDate() - diffToMonday)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

// Grille fixe de 6 semaines (42 jours), même si certains mois n'en
// demandent que 5 pour être couverts entièrement : garder toujours 6 lignes
// évite que la hauteur du widget varie d'un mois à l'autre.
export function getMonthGridDays(reference: Date): Date[] {
  const firstOfMonth = new Date(reference.getFullYear(), reference.getMonth(), 1)
  const diffToMonday = (firstOfMonth.getDay() + 6) % 7
  const start = addDays(firstOfMonth, -diffToMonday)
  return Array.from({ length: 42 }, (_, i) => addDays(start, i))
}

export function addDays(date: Date, amount: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + amount)
  return d
}

// Recale toujours au 1er du mois cible plutôt que de conserver le quantième
// courant : la vue mois ne se soucie que du mois/année affiché, pas d'un
// jour précis — évite les sauts de mois que `setMonth` provoquerait sur les
// fins de mois (31 janvier + 1 mois → 3 mars) lors d'une navigation répétée.
export function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

// Chevauchement `[event.start, event.end)` avec `[jour 00h, jour+1 00h)`
// plutôt qu'un simple `isSameDay(start, day)` : un event `allDay` multi-jours
// (fin exclusive, même convention que l'import .ics) doit apparaître sur
// chaque jour qu'il couvre, pas seulement son jour de départ.
export function eventOccursOnDay(event: CalendarEvent, day: Date): boolean {
  const dayStart = new Date(day)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = addDays(dayStart, 1)
  const start = new Date(event.start)
  const end = new Date(event.end)
  return start < dayEnd && end > dayStart
}

export function formatWeekRange(days: Date[], language: string): string {
  const format = new Intl.DateTimeFormat(toIntlLocale(language), { day: 'numeric', month: 'short' })
  return `${format.format(days[0])} – ${format.format(days[days.length - 1])}`
}

export function formatDayLabel(day: Date, language: string): string {
  return new Intl.DateTimeFormat(toIntlLocale(language), { weekday: 'long', day: 'numeric', month: 'long' }).format(day)
}

export function formatMonthYear(day: Date, language: string): string {
  return new Intl.DateTimeFormat(toIntlLocale(language), { month: 'long', year: 'numeric' }).format(day)
}
