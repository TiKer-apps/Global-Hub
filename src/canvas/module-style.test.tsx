import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { HEADER_STYLE_OPTIONS, ModuleStyleProvider, useModuleStyleId, useSetModuleStyle } from './module-style'

const STORAGE_KEY = 'global-hub:module-styles'

function renderModuleStyle(moduleId: string, defaultStyleId: 'wave' | 'flat') {
  return renderHook(
    () => ({
      styleId: useModuleStyleId(moduleId, defaultStyleId),
      setStyleId: useSetModuleStyle(),
    }),
    { wrapper: ModuleStyleProvider },
  )
}

describe('HEADER_STYLE_OPTIONS', () => {
  it('exposes exactly the wave and flat options', () => {
    expect(HEADER_STYLE_OPTIONS.map((o) => o.id).sort()).toEqual(['flat', 'wave'])
  })
})

describe('module-style', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('falls back to the default style when nothing was customized', () => {
    const { result } = renderModuleStyle('post-it-1', 'wave')
    expect(result.current.styleId).toBe('wave')
  })

  it('updates the style after setStyleId and persists it', () => {
    const { result } = renderModuleStyle('post-it-1', 'wave')

    act(() => result.current.setStyleId('post-it-1', 'flat'))

    expect(result.current.styleId).toBe('flat')
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')).toEqual({ 'post-it-1': 'flat' })
  })

  it('throws when used outside of a ModuleStyleProvider', () => {
    expect(() => renderHook(() => useModuleStyleId('post-it-1', 'wave'))).toThrow(
      /useModuleStyleContext must be used within ModuleStyleProvider/,
    )
  })
})
