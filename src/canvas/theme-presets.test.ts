import { describe, expect, it } from 'vitest'
import { extractBgClass, getPreset, THEME_PRESETS } from './theme-presets'

describe('THEME_PRESETS', () => {
  it('has a unique id for every preset', () => {
    const ids = THEME_PRESETS.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every headerClassName contains a literal bg- utility (Tailwind JIT scan requirement)', () => {
    for (const preset of THEME_PRESETS) {
      expect(preset.headerClassName).toMatch(/\bbg-[a-z]+-\d+\b/)
    }
  })
})

describe('getPreset', () => {
  it('finds a preset by id', () => {
    expect(getPreset('blue-300')).toMatchObject({ id: 'blue-300', label: 'Bleu' })
  })

  it('returns undefined for an unknown id', () => {
    expect(getPreset('not-a-real-id')).toBeUndefined()
  })
})

describe('extractBgClass', () => {
  it('extracts the bg- utility from a combined className', () => {
    expect(extractBgClass('bg-blue-300 text-white')).toBe('bg-blue-300')
  })

  it('finds bg- regardless of position', () => {
    expect(extractBgClass('text-black bg-yellow-400')).toBe('bg-yellow-400')
  })

  it('falls back to bg-muted when there is no bg- class', () => {
    expect(extractBgClass('text-white')).toBe('bg-muted')
  })
})
