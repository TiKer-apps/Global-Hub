import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Sert le vrai serveur de dev Vite : cohérent avec l'absence de pipeline
  // CI sur ce repo pour l'instant (pas besoin d'un build de prod pour ces
  // tests, contrairement aux projets Vitest qui montent les composants en
  // isolation dans un DOM de test, jamais l'app réelle).
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
})
