export const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

// Indexé sur `Date#getDay()` (0 = dimanche), contrairement à `DAY_LABELS`
// (indexé sur une position dans une semaine lundi-first) — nécessaire pour
// une vue jour unique, où il n'y a pas de tableau de 7 jours pour donner une
// position implicite.
const DAY_LABELS_BY_WEEKDAY = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

export function getDayLabel(day: Date): string {
  return DAY_LABELS_BY_WEEKDAY[day.getDay()]
}

// Lundi comme premier jour de semaine (convention FR) : `getDay()` renvoie
// 0 (dimanche) à 6 (samedi), `(day + 6) % 7` ramène ça à une distance depuis
// le lundi le plus récent.
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

const WEEK_RANGE_FORMAT = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' })

export function formatWeekRange(days: Date[]): string {
  return `${WEEK_RANGE_FORMAT.format(days[0])} – ${WEEK_RANGE_FORMAT.format(days[days.length - 1])}`
}

const DAY_LABEL_FORMAT = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

export function formatDayLabel(day: Date): string {
  return DAY_LABEL_FORMAT.format(day)
}

const MONTH_YEAR_FORMAT = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' })

export function formatMonthYear(day: Date): string {
  return MONTH_YEAR_FORMAT.format(day)
}
