export const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

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

export function addDays(date: Date, amount: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + amount)
  return d
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

const WEEK_RANGE_FORMAT = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' })

export function formatWeekRange(days: Date[]): string {
  return `${WEEK_RANGE_FORMAT.format(days[0])} – ${WEEK_RANGE_FORMAT.format(days[days.length - 1])}`
}
