import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { ModuleThemeProvider, useModuleHeaderClassName, useModuleThemeId, useSetModuleTheme } from './module-theme'

const STORAGE_KEY = 'global-hub:module-themes'

function renderModuleTheme(moduleId: string, defaultThemeId: string) {
  return renderHook(
    () => ({
      themeId: useModuleThemeId(moduleId, defaultThemeId),
      headerClassName: useModuleHeaderClassName(moduleId, defaultThemeId),
      setThemeId: useSetModuleTheme(),
    }),
    { wrapper: ModuleThemeProvider },
  )
}

describe('module-theme', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('falls back to the default theme when nothing was customized', () => {
    const { result } = renderModuleTheme('notes-1', 'blue-300')
    expect(result.current.themeId).toBe('blue-300')
    expect(result.current.headerClassName).toBe('bg-blue-300 text-white')
  })

  it('updates the theme and derived headerClassName after setThemeId', () => {
    const { result } = renderModuleTheme('notes-1', 'blue-300')

    act(() => result.current.setThemeId('notes-1', 'red-500'))

    expect(result.current.themeId).toBe('red-500')
    expect(result.current.headerClassName).toBe('bg-red-500 text-white')
  })

  it('persists the theme map to localStorage', () => {
    const { result } = renderModuleTheme('notes-1', 'blue-300')

    act(() => result.current.setThemeId('notes-1', 'red-500'))

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')).toEqual({ 'notes-1': 'red-500' })
  })

  it('only affects the module it was set on', () => {
    const notes = renderModuleTheme('notes-1', 'blue-300')
    const tasks = renderModuleTheme('tasks-1', 'violet-500')

    act(() => notes.result.current.setThemeId('notes-1', 'red-500'))

    expect(notes.result.current.themeId).toBe('red-500')
    expect(tasks.result.current.themeId).toBe('violet-500')
  })

  it('reads a previously persisted theme map on mount', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ 'notes-1': 'emerald-500' }))

    const { result } = renderModuleTheme('notes-1', 'blue-300')

    expect(result.current.themeId).toBe('emerald-500')
  })

  it('falls back to the default theme id when the persisted theme is unknown', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ 'notes-1': 'not-a-real-preset' }))

    const { result } = renderModuleTheme('notes-1', 'blue-300')

    expect(result.current.headerClassName).toBe('bg-blue-300 text-white')
  })

  it('throws when used outside of a ModuleThemeProvider', () => {
    expect(() => renderHook(() => useModuleThemeId('notes-1', 'blue-300'))).toThrow(
      /useModuleThemeContext must be used within ModuleThemeProvider/,
    )
  })
})
