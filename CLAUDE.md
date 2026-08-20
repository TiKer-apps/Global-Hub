# Global Hub — repères pour Claude

Avant de travailler sur ce projet, lire dans l'ordre :

1. [`README.md`](./README.md) — setup, commandes (`npm run dev`/`build`/`lint`/`test`/`storybook`).
2. [`PROJECT.md`](./PROJECT.md) — état actuel, architecture, décisions produit/technique, backlog ("À affiner").
3. [`CONTRIBUTING.md`](./CONTRIBUTING.md) — conventions de travail non-évidentes (commentaires, abstraction, Git, vérification avant "c'est fait"). Explicitement écrit pour un lecteur humain ou IA : à suivre comme les instructions de ce fichier.

## Rappels rapides

- Toujours créer une branche par chantier depuis `develop` (`feat/<nom-court>`), jamais de commit direct dessus ni sur `main` — cf. CONTRIBUTING.md, "Branches par feature depuis `develop`".
- Ne commit que sur demande explicite de l'utilisateur.
- Avant de considérer un changement terminé : `npm run build` (tsc + vite) et `npm run lint` doivent passer.
- Un nouveau jalon dans `PROJECT.md` s'ajoute au-dessus du précédent — l'ancien part tel quel en archive en bas du fichier, jamais écrasé.
- Après un chantier, mettre à jour `PROJECT.md` (Statut + "À affiner") pour que l'état documenté reste fidèle au code.
- Tout ajout/modification d'UI doit rester accessible (icône seule → `aria-label`, `div onClick` → `button`, contraste, landmarks...) — cf. CONTRIBUTING.md, "Accessibilité : à considérer à chaque ajout/modification". Vérifier avec `@axe-core/playwright` (`e2e/a11y.spec.ts`), pas seulement à la lecture.
