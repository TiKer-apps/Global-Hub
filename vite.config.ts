/// <reference types="vitest/config" />
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [react(), tailwindcss(), VitePWA({
    registerType: 'autoUpdate',
    manifest: {
      name: 'Global Hub',
      short_name: 'Global Hub',
      description: 'Hub personnel d\'organisation : planning, notes, post-its, tâches, todo-list.',
      theme_color: '#ffffff',
      background_color: '#ffffff',
      display: 'standalone',
      // Icônes PWA à ajouter lors de la phase design (public/pwa-192x192.png, public/pwa-512x512.png).
      icons: []
    }
  })],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    },
    // Sans ça, le projet `component` (browser, @testing-library/react)
    // pouvait charger une deuxième copie de React distincte de celle
    // utilisée par l'app — un composant avec un hook contextuel (ex. une
    // icône `lucide-react`, qui utilise son propre Context React) plante
    // alors avec `Cannot read properties of null (reading 'useContext')`,
    // le Context ayant été créé par l'autre copie.
    dedupe: ['react', 'react-dom']
  },
  // `aria-query` (CJS, requis en transitif par @storybook/addon-vitest via
  // @testing-library/dom) fait planter le pré-bundling par défaut : Vite ne
  // détecte pas ses exports nommés (`elementRoles`...) dans le contexte de
  // Vitest en mode navigateur, alors qu'un require() Node classique les voit
  // bien. Le forcer dans optimizeDeps fait passer ce module par l'analyse
  // CJS->ESM d'esbuild en amont, qui gère correctement l'interop.
  optimizeDeps: {
    // `aria-query`/`lz-string`/`pretty-format` : cf. commentaire plus haut
    // (interop CJS->ESM). Le reste : dépendances partagées par beaucoup de
    // composants (`@base-ui/react` sous `components/ui/*`, `@xyflow/react`
    // pour le canvas) — sans les lister ici, Vite les découvre "à la volée"
    // au premier test qui les touche et se ré-optimise en cours de run, ce
    // qui peut charger transitoirement deux copies de React et planter
    // (`Cannot read properties of null` dans un hook interne).
    include: [
      'aria-query',
      'lz-string',
      'pretty-format',
      '@xyflow/react',
      // Chaque sous-chemin de `@base-ui/react` compte comme un "point
      // d'entrée" séparé pour l'optimizer Vite — lister le paquet nu ne
      // suffit pas, sinon les sous-chemins non encore vus sont découverts
      // "à la volée" au premier test qui les importe (cf. commentaire
      // au-dessus sur le risque de double copie de React).
      '@base-ui/react/dialog',
      '@base-ui/react/popover',
      '@base-ui/react/button',
      '@base-ui/react/tabs',
    ],
  },
  test: {
    // Trois projets aux besoins différents plutôt qu'un seul : la config
    // storybook ci-dessous est bornée aux stories par `storybookTest`
    // lui-même (pas de conflit avec les `include` des deux autres).
    projects: [
      {
        extends: true,
        plugins: [
        // The plugin will run tests for the stories defined in your Storybook config
        // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
        storybookTest({
          configDir: path.join(dirname, '.storybook')
        })],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{
              browser: 'chromium'
            }]
          }
        }
      },
      // Logique pure (date-utils, ics-import...) : pas besoin d'un vrai
      // navigateur, Node suffit et c'est nettement plus rapide.
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.test.ts'],
        },
      },
      // Composants React : même navigateur (Playwright/Chromium) que le
      // projet storybook, pour un comportement de rendu identique — mais des
      // `.test.tsx` classiques (render + POM), pas des stories.
      {
        extends: true,
        test: {
          name: 'component',
          include: ['src/**/*.test.tsx'],
          setupFiles: ['src/test/setup-component.ts'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{
              browser: 'chromium'
            }]
          }
        },
      },
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.stories.tsx', 'src/**/*.test.{ts,tsx}', 'src/**/*.pom.ts', 'src/main.tsx', 'src/i18n/**', 'src/test/**'],
    },
  }
});