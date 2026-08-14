import { describe, expect, it } from 'vitest'
import { sourceBorderClass, sourceLabelKey } from './source-style'
import type { EventSource } from './types'

const SOURCES: EventSource[] = ['local', 'google', 'outlook']

describe('sourceBorderClass', () => {
  it('gives local events a neutral (transparent) border', () => {
    expect(sourceBorderClass('local')).toBe('border-l-transparent')
  })

  it('gives each imported source a distinct, non-transparent color', () => {
    const classes = SOURCES.filter((s) => s !== 'local').map(sourceBorderClass)
    expect(new Set(classes).size).toBe(classes.length)
    for (const cls of classes) {
      expect(cls).not.toContain('transparent')
    }
  })
})

describe('sourceLabelKey', () => {
  it('returns a translation key namespaced under planning.source', () => {
    for (const source of SOURCES) {
      expect(sourceLabelKey(source)).toBe(`planning.source.${source}`)
    }
  })
})
