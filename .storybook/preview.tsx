import type { Preview } from '@storybook/react-vite'
// Storybook a son propre point d'entrée (`preview.tsx`), qui ne passe pas
// par `src/main.tsx` : sans cet import, Tailwind, les tokens du thème
// (--color-card, --radius-xl...) et les `@layer components` custom
// (important-surface, placeholder Tiptap) n'existaient pas du tout dans son
// iframe — d'où les composants qui rendaient sans styles ou cassés.
import '../src/index.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    }
  },
};

export default preview;