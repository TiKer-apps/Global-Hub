# Global Hub

Hub personnel d'organisation (planning, notes, post-its, tâches, todo-list).
Contexte produit, specs des modules et décisions techniques : voir
[`PROJECT.md`](./PROJECT.md). Conventions de travail (avec l'impact
concret de chacune) : voir [`CONTRIBUTING.md`](./CONTRIBUTING.md).

## Prérequis

- Node 20+
- npm

## Installation

```bash
npm install
```

## Lancer en local

```bash
npm run dev
```

App servie sur http://localhost:5173 (HMR activé).

Build de production :

```bash
npm run build     # typecheck (tsc -b) + build Vite dans dist/
npm run preview   # sert le build de production en local
```

## Storybook (librairie de composants)

```bash
npm run storybook
```

Storybook sur http://localhost:6006 — permet de développer/tester chaque
widget (composants `src/components/ui` et `src/modules/*`) isolément, sans
lancer toute l'appli.

Build statique de Storybook (déploiement) :

```bash
npm run build-storybook
```

## Tests

```bash
npm run test           # lance les 3 projets une fois (CI-friendly)
npm run test:watch     # mode watch
npm run test:coverage  # avec rapport de couverture (texte + HTML dans coverage/)
```

Première utilisation : `npx playwright install chromium` (télécharge le
navigateur headless utilisé par les tests — pas fait automatiquement par
`npm install`).

`vite.config.ts` déclare 3 projets Vitest, chacun avec son rôle :

- **`storybook`** — chaque story (`*.stories.tsx`) devient un test exécuté
  dans un navigateur headless (Playwright/Chromium) : aucune assertion à
  écrire à la main, la story qui render sans erreur suffit à faire passer
  le test. Tout composant réutilisable (`components/ui/*`,
  `module-card.tsx`) doit avoir une story avant d'être considéré terminé
  (cf. `PROJECT.md`, "Definition of done").
- **`unit`** — logique pure (`*.test.ts`, ex. `date-utils.ts`,
  `ics-import.ts`), exécutée en Node (pas de navigateur, nettement plus
  rapide).
- **`component`** — comportement de composants React (`*.test.tsx`), même
  navigateur que le projet `storybook` mais des tests classiques
  (`render` + interactions), pas des stories. Convention Page Object Model
  pour les locators/actions un peu élaborés : un fichier `Component.pom.ts`
  à côté du `Component.test.tsx` (voir `TaskList.pom.ts`/`TaskList.test.tsx`
  comme gabarit).

⚠️ Si `npm run test` échoue au démarrage avec une erreur d'import du genre
`does not provide an export named ...` ou `exports is not defined` sur un
paquet CJS transitif (`aria-query`, `lz-string`, `pretty-format`...), c'est
que le pré-bundling Vite ne l'a pas détecté — l'ajouter à
`optimizeDeps.include` dans `vite.config.ts` (cf. `PROJECT.md`, "Gotchas").

## Lint

```bash
npm run lint
```

Lint via [oxlint](https://oxc.rs/docs/guide/usage/linter).

## Stack

React + Vite + TypeScript, Tailwind v4 + shadcn/ui, React Flow (canvas des
widgets), Dexie (stockage local IndexedDB), Storybook, PWA (`vite-plugin-pwa`).
Détails et rationale dans [`PROJECT.md`](./PROJECT.md).
