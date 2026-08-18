import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useIsMobile } from './use-is-mobile'

const QUERY = '(max-width: 767.98px)'

// `matchMedia` factice minimal : un seul média écouté à la fois dans ces
// tests (celui du hook), pas besoin de gérer plusieurs requêtes en
// parallèle.
function installMatchMedia(initialMatches: boolean) {
  let matches = initialMatches
  let listener: (() => void) | null = null
  const mql = {
    get matches() {
      return matches
    },
    media: QUERY,
    addEventListener: (_: string, cb: () => void) => {
      listener = cb
    },
    removeEventListener: () => {
      listener = null
    },
  }
  window.matchMedia = () => mql as unknown as MediaQueryList
  return {
    setMatches(next: boolean) {
      matches = next
      listener?.()
    },
  }
}

describe('useIsMobile', () => {
  const originalMatchMedia = window.matchMedia

  afterEach(() => {
    window.matchMedia = originalMatchMedia
  })

  it('reflects the initial matchMedia state', () => {
    installMatchMedia(true)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('updates when the media query changes', () => {
    const media = installMatchMedia(false)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)

    act(() => media.setMatches(true))

    expect(result.current).toBe(true)
  })
})
