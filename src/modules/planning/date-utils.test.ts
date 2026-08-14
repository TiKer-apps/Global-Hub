import { describe, expect, it } from 'vitest'
import {
  addDays,
  addMonths,
  formatDayLabel,
  formatMonthYear,
  formatWeekRange,
  getDayLabel,
  getMonthGridDays,
  getWeekDayHeaderLabels,
  getWeekDays,
  isSameDay,
  toIntlLocale,
} from './date-utils'

describe('toIntlLocale', () => {
  it('maps known language codes to a full BCP 47 locale', () => {
    expect(toIntlLocale('fr')).toBe('fr-FR')
    expect(toIntlLocale('en')).toBe('en-US')
  })

  it('falls back to French for an unknown language', () => {
    expect(toIntlLocale('xx')).toBe('fr-FR')
  })
})

describe('getDayLabel', () => {
  it('returns the correct weekday label regardless of position in a week array', () => {
    // Lundi 2026-08-10, Mercredi 2026-08-12 : jours réels différents, pas
    // une simple position dans un tableau (cf. le bug corrigé qu'il évite).
    expect(getDayLabel(new Date(2026, 7, 10), 'fr')).toBe('lun.')
    expect(getDayLabel(new Date(2026, 7, 12), 'fr')).toBe('mer.')
  })

  it('adapts to the given language', () => {
    expect(getDayLabel(new Date(2026, 7, 10), 'en')).toBe('Mon')
  })
})

describe('getWeekDayHeaderLabels', () => {
  it('returns 7 labels starting on Monday', () => {
    const labels = getWeekDayHeaderLabels('fr')
    expect(labels).toHaveLength(7)
    expect(labels[0]).toBe('lun.')
    expect(labels[6]).toBe('dim.')
  })
})

describe('getWeekDays', () => {
  it('always starts on the Monday of the reference date\'s week', () => {
    // Vendredi 2026-08-14 -> lundi 2026-08-10
    const days = getWeekDays(new Date(2026, 7, 14))
    expect(days).toHaveLength(7)
    expect(days[0].getDate()).toBe(10)
    expect(days[0].getDay()).toBe(1) // lundi
    expect(days[6].getDate()).toBe(16)
  })

  it('handles a reference date that already is a Sunday', () => {
    const days = getWeekDays(new Date(2026, 7, 16)) // dimanche
    expect(days[0].getDate()).toBe(10)
    expect(days[6].getDate()).toBe(16)
  })
})

describe('getMonthGridDays', () => {
  it('always returns 42 days (6 full weeks)', () => {
    expect(getMonthGridDays(new Date(2026, 1, 1))).toHaveLength(42) // février, mois court
    expect(getMonthGridDays(new Date(2026, 7, 1))).toHaveLength(42) // août
  })

  it('starts on the Monday on or before the 1st of the month', () => {
    // 2026-08-01 est un samedi -> la grille doit démarrer lundi 2026-07-27
    const days = getMonthGridDays(new Date(2026, 7, 15))
    expect(days[0].getFullYear()).toBe(2026)
    expect(days[0].getMonth()).toBe(6)
    expect(days[0].getDate()).toBe(27)
    expect(days[0].getDay()).toBe(1)
  })
})

describe('addDays', () => {
  it('adds (or subtracts) days without mutating the input', () => {
    const original = new Date(2026, 7, 10)
    const later = addDays(original, 5)
    expect(later.getDate()).toBe(15)
    expect(original.getDate()).toBe(10)
  })

  it('rolls over into the next month', () => {
    const result = addDays(new Date(2026, 7, 30), 3)
    expect(result.getMonth()).toBe(8)
    expect(result.getDate()).toBe(2)
  })
})

describe('addMonths', () => {
  it('resets to the 1st of the target month rather than keeping the day of month', () => {
    // Cas emblématique : 31 janvier + 1 mois ne doit jamais sauter à mars.
    const result = addMonths(new Date(2026, 0, 31), 1)
    expect(result.getMonth()).toBe(1) // février
    expect(result.getDate()).toBe(1)
  })

  it('supports negative amounts', () => {
    const result = addMonths(new Date(2026, 0, 15), -1)
    expect(result.getFullYear()).toBe(2025)
    expect(result.getMonth()).toBe(11)
  })
})

describe('isSameDay', () => {
  it('ignores the time of day', () => {
    const a = new Date(2026, 7, 10, 8, 0)
    const b = new Date(2026, 7, 10, 23, 59)
    expect(isSameDay(a, b)).toBe(true)
  })

  it('returns false for different days', () => {
    expect(isSameDay(new Date(2026, 7, 10), new Date(2026, 7, 11))).toBe(false)
  })
})

describe('formatWeekRange', () => {
  it('formats the first and last day of the range', () => {
    const days = getWeekDays(new Date(2026, 7, 14))
    expect(formatWeekRange(days, 'fr')).toBe('10 août – 16 août')
  })
})

describe('formatDayLabel', () => {
  it('includes the weekday, day and month', () => {
    expect(formatDayLabel(new Date(2026, 7, 10), 'fr')).toBe('lundi 10 août')
  })
})

describe('formatMonthYear', () => {
  it('formats month and year', () => {
    expect(formatMonthYear(new Date(2026, 7, 10), 'fr')).toBe('août 2026')
  })
})
