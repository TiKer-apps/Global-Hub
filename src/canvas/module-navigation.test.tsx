import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ModuleNavigationProvider, useModuleNavigation } from './module-navigation'

function renderNavigation() {
  return renderHook(() => useModuleNavigation(), { wrapper: ModuleNavigationProvider })
}

describe('module-navigation', () => {
  it('starts with no pending request', () => {
    const { result } = renderNavigation()
    expect(result.current.request).toBeNull()
  })

  it('requestOpen sets the pending request', () => {
    const { result } = renderNavigation()

    act(() => result.current.requestOpen('notes', 'note-1'))

    expect(result.current.request).toEqual({ module: 'notes', id: 'note-1' })
  })

  it('consumeOpenRequest clears the pending request', () => {
    const { result } = renderNavigation()

    act(() => result.current.requestOpen('tasks', 'task-1'))
    act(() => result.current.consumeOpenRequest())

    expect(result.current.request).toBeNull()
  })

  it('a later requestOpen replaces the previous pending request', () => {
    const { result } = renderNavigation()

    act(() => result.current.requestOpen('notes', 'note-1'))
    act(() => result.current.requestOpen('planning', 'event-1'))

    expect(result.current.request).toEqual({ module: 'planning', id: 'event-1' })
  })

  it('throws when used outside of a ModuleNavigationProvider', () => {
    expect(() => renderHook(() => useModuleNavigation())).toThrow(
      /useModuleNavigation must be used within ModuleNavigationProvider/,
    )
  })
})
