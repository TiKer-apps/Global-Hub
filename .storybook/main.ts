import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-mcp"
  ],
  "framework": "@storybook/react-vite",
  // Storybook réutilise le vite.config.ts de l'appli, qui inclut VitePWA —
  // ça fait échouer `build-storybook` (le manifeste de précache workbox
  // tente d'y inclure les gros bundles de Storybook lui-même, ex.
  // sb-manager/globals-runtime.js à 3+ Mo, largement au-dessus de la limite
  // par défaut). Storybook n'a rien à voir avec le PWA de l'appli : on
  // retire simplement ce plugin pour son propre build.
  async viteFinal(viteConfig) {
    const plugins = (viteConfig.plugins ?? [])
      .flat(Infinity)
      .filter((plugin) => {
        if (!plugin || typeof plugin !== 'object' || !('name' in plugin)) return true
        return !String(plugin.name).startsWith('vite-plugin-pwa')
      })
    return { ...viteConfig, plugins }
  },
};
export default config;