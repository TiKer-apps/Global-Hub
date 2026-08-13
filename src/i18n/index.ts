import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import fr from './locales/fr.json'

export const LANGUAGE_STORAGE_KEY = 'global-hub:language'

function loadStoredLanguage(): string {
  try {
    return localStorage.getItem(LANGUAGE_STORAGE_KEY) ?? 'fr'
  } catch {
    return 'fr'
  }
}

// Un seul fichier de traduction plat par langue (pas de namespace par
// module) — choix délibéré pour rester simple tant qu'un seul module
// (Planning) est traduit, cf. PROJECT.md/CONTRIBUTING.md "pas d'abstraction
// prématurée". À scinder si les fichiers deviennent difficiles à naviguer
// une fois les autres modules traduits.
i18next.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
  },
  lng: loadStoredLanguage(),
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
})

export default i18next
