import { describe, expect, it } from 'vitest'
import { EVENT_TYPE_PRESETS, getEventTypePreset } from './event-type-presets'

describe('getEventTypePreset', () => {
  it('finds a preset by id', () => {
    expect(getEventTypePreset('travail')).toMatchObject({ id: 'travail', labelKey: 'planning.type.travail' })
  })

  it('returns undefined for an unknown id', () => {
    expect(getEventTypePreset('inconnu')).toBeUndefined()
  })

  it('returns undefined when no id is given', () => {
    expect(getEventTypePreset(undefined)).toBeUndefined()
  })
})

describe('EVENT_TYPE_PRESETS', () => {
  it('has a unique id and a valid CSS hex color for every preset', () => {
    const ids = EVENT_TYPE_PRESETS.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const preset of EVENT_TYPE_PRESETS) {
      expect(preset.color).toMatch(/^#[0-9a-f]{6}$/i)
      expect(preset.labelKey).toBe(`planning.type.${preset.id}`)
    }
  })
})
