// Doit être importé avant tout module qui touche `db.ts` (Dexie) : les
// widgets ouvrent la base au premier appel, donc `indexedDB` doit déjà être
// polyfillé à ce moment. Une vraie base IndexedDB (en mémoire) plutôt que de
// mocker `useLiveQuery` à la main — le comportement réactif de Dexie reste
// donc réel dans les tests, pas simulé approximativement.
import 'fake-indexeddb/auto'
// Matchers `toBeInTheDocument`/`toBeDisabled`/... utilisés dans tous les
// tests `component` — cet import les enregistre ET fournit les types pour
// `tsc` (sans lui, les tests passent bien à l'exécution mais `npm run
// build` échoue en typecheck sur chaque matcher jest-dom).
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import { db } from '@/lib/db'
import i18n from '@/i18n'

afterEach(async () => {
  // Base partagée par tous les tests `component` (même singleton `db` que
  // l'app) : la vider entre chaque test évite qu'un enregistrement créé
  // dans un test fuite dans le suivant.
  await Promise.all(db.tables.map((table) => table.clear()))
  // Même chose pour la langue i18next (singleton global) : un test qui
  // bascule en anglais (ex. le sélecteur FR/EN du Drawer) la laisserait
  // sinon active pour tous les tests suivants, quel que soit le fichier.
  await i18n.changeLanguage('fr')
})

// `@testing-library/react` ne détecte pas automatiquement le framework de
// test ici (les tests importent `describe`/`it`/`afterEach` explicitement
// de `vitest`, pas de globals) — sans cet appel manuel, le DOM d'un test
// reste monté pour le suivant dans le même fichier, ce qui fait échouer
// tout `getByText`/`getByRole` qui matche alors deux fois le même élément.
afterEach(() => {
  cleanup()
})
