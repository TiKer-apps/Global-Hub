import '@/i18n'
import i18n from '@/i18n'
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { LANGUAGE_STORAGE_KEY } from '@/i18n'
import { useLanguage } from './language'

describe('useLanguage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(async () => {
    await i18n.changeLanguage('fr')
  })

  it('exposes the current i18next language', async () => {
    await i18n.changeLanguage('fr')
    const { result } = renderHook(() => useLanguage())
    expect(result.current.language).toBe('fr')
  })

  it('setLanguage changes the active language and persists it', async () => {
    const { result } = renderHook(() => useLanguage())

    await act(async () => {
      await result.current.setLanguage('en')
    })

    expect(result.current.language).toBe('en')
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en')
  })
})
