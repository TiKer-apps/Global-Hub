# Global Hub

Hub personnel d'organisation (planning, notes, post-its, tâches, todo-list).
Contexte produit, specs des modules et décisions techniques : voir
[`PROJECT.md`](./PROJECT.md).

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
npm run test        # lance les tests une fois (CI-friendly)
npm run test:watch  # mode watch
```

Les tests sont branchés sur l'addon Vitest de Storybook : chaque story
(`*.stories.tsx`) devient un test exécuté dans un navigateur headless
(Playwright/Chromium). Aucune story n'existe encore à ce stade du projet —
la commande `test` remontera donc `No test files found` tant qu'on n'a pas
commencé à en écrire au fil de l'implémentation des modules.

## Lint

```bash
npm run lint
```

Lint via [oxlint](https://oxc.rs/docs/guide/usage/linter).

## Stack

React + Vite + TypeScript, Tailwind v4 + shadcn/ui, React Flow (canvas des
widgets), Dexie (stockage local IndexedDB), Storybook, PWA (`vite-plugin-pwa`).
Détails et rationale dans [`PROJECT.md`](./PROJECT.md).
