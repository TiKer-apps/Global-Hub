import { useEffect, useState } from 'react'

// Même seuil que le préfixe Tailwind `md:` (768px) — garde les breakpoints
// JS et CSS cohérents entre eux (ex. la largeur responsive de
// PlanningWidget bascule exactement en même temps que ce hook).
const QUERY = '(max-width: 767.98px)'

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(QUERY).matches)

  useEffect(() => {
    const mql = window.matchMedia(QUERY)
    const handleChange = () => setIsMobile(mql.matches)
    mql.addEventListener('change', handleChange)
    return () => mql.removeEventListener('change', handleChange)
  }, [])

  return isMobile
}
