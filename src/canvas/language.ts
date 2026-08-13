import { useTranslation } from 'react-i18next'
import { LANGUAGE_STORAGE_KEY } from '@/i18n'

// Pas de Context ici (contrairement à `module-theme.tsx`/`module-style.tsx`)
// : i18next tient déjà lui-même la langue courante en mémoire et notifie
// `useTranslation` de ses changements — un Context React ferait doublon.
// Ce hook n'ajoute que la persistance localStorage par-dessus
// `i18n.changeLanguage`, même convention de clé que les autres préférences
// (`global-hub:module-themes`...).
export function useLanguage() {
  const { i18n } = useTranslation()

  const setLanguage = (language: string) => {
    i18n.changeLanguage(language)
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
    } catch {
      // localStorage indisponible (mode privé strict...) : la langue reste
      // active pour la session, juste pas persistée — pas bloquant.
    }
  }

  return { language: i18n.language, setLanguage }
}
