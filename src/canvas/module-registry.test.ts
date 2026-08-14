import { describe, expect, it } from 'vitest'
import { MODULES } from './module-registry'

describe('MODULES', () => {
  it('has a unique id for every module', () => {
    const ids = MODULES.map((m) => m.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every module has a translation key under common.moduleLabels', () => {
    for (const module of MODULES) {
      expect(module.labelKey).toMatch(/^common\.moduleLabels\./)
    }
  })

  it('only Post-it and Todo-list declare an instanceKind', () => {
    const withInstances = MODULES.filter((m) => m.instanceKind)
    expect(withInstances.map((m) => m.id).sort()).toEqual(['post-it-1', 'todo-1'])
  })
})
