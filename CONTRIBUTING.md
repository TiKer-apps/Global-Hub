# Conventions de travail

Ce document ne répète pas ce qui se lit dans le code (architecture,
stack, décisions produit — voir `PROJECT.md` pour ça). Il capture des
façons de faire qui ne sont pas dérivables du code seul, avec l'impact
concret constaté sur ce projet si elles ne sont pas suivies — pour
qu'un développeur (humain ou assistant IA) qui prend la suite comprenne
*pourquoi*, pas juste *quoi*, et puisse juger des cas limites plutôt que
suivre la règle aveuglément.

## Commentaires : le pourquoi, jamais le quoi

**Règle** : un commentaire n'existe que pour une contrainte cachée, un
contournement de bug précis, ou un comportement qui surprendrait à la
lecture. Le nom des identifiants doit suffire à dire *ce que* fait le
code ; le commentaire dit *pourquoi* c'est écrit ainsi et pas autrement.

**Impact si non respecté** : des commentaires qui décrivent le code
("incrémente le compteur") ne survivent pas à un refactor — ils
deviennent faux silencieusement, ou pire, personne ne les met à jour et
un lecteur futur leur fait confiance à tort. Un commentaire "pourquoi"
reste vrai même si l'implémentation change, tant que la contrainte
qu'il décrit existe encore.

**Comment l'appliquer** : avant d'écrire un commentaire, se demander
"si je le retire, est-ce qu'un lecteur serait confus ?". Si non, ne pas
l'écrire. Voir `theme-presets.ts` ou `module-card.tsx` dans ce dépôt
pour des exemples (le pourquoi de la classe littérale, le pourquoi du
`BOTTOM_BLEED`...).

## Pas d'abstraction prématurée

**Règle** : ne pas fabriquer une abstraction commune pour deux cas
d'usage seulement. Trois lignes dupliquées valent mieux qu'une
généralisation qui devine mal les besoins futurs.

**Impact si non respecté** : `module-theme.tsx` (thème de couleur) et
`module-style.tsx` (style de header) sont deux Context+localStorage
quasi identiques, volontairement gardés séparés plutôt que fusionnés en
un système générique de "préférences de module". Les fusionner
aurait ajouté une couche d'indirection (un type de préférence
paramétré) pour économiser ~30 lignes, en échange d'un code plus dur à
lire et à faire évoluer indépendamment (ex. si un jour une préférence a
besoin d'une validation ou d'une migration que l'autre n'a pas).

**Comment l'appliquer** : dupliquer d'abord. Ne factoriser que quand un
*troisième* cas d'usage réel apparaît et que le pattern commun est
alors évident (pas deviné à l'avance).

## Composant réutilisable = story Storybook obligatoire

**Règle** : tout ce qui vit sous `components/ui/*`, ou qui a la même
nature que `module-card.tsx` (partagé entre modules, sans logique
métier propre), doit avoir une story avant d'être considéré terminé.

**Impact si non respecté** : deux bugs réels de ce projet ont été
invisibles jusqu'à ce qu'une story existe pour les regarder :
l'onglet actif de `Tabs` ne se surlignait jamais (mauvais attribut
`data-*` utilisé dans le CSS, `data-selected` au lieu de `data-active`
— Base UI, pas Radix), et l'aperçu du style "Vague" dans la modale de
réglages ne montrait que la moitié de la courbe. Aucun des deux
n'aurait remonté d'erreur `tsc`/build — seule une story rendue à l'œil
les a fait apparaître.

**Comment l'appliquer** : `npm run test` (chaque story = un test
Vitest/Playwright, cf. `README.md`) doit passer, et pour un changement
visuel non trivial, ouvrir la story dans Storybook pour vérifier à
l'œil avant de considérer le travail fini.

## Boucle de vérification avant "c'est fait"

**Règle** : après un changement, avant de le déclarer terminé —
`npx tsc -b`, puis `npm run build`. Si un composant partagé ou
Storybook lui-même a été touché, ajouter `npm run test` et
`npx storybook build` (Storybook réutilise `vite.config.ts` de l'app,
donc un changement là peut casser les deux builds sans lien apparent).

**Impact si non respecté** : deux bugs de config ont été introduits
silencieusement par le scaffold initial et ne sont apparus qu'en
testant réellement `build-storybook` : le plugin PWA de l'app cassait
le build de Storybook (précache workbox essayant d'inclure les bundles
de Storybook lui-même), et Storybook ne chargeait pas `index.css` (son
point d'entrée `preview.tsx` ne passe pas par `main.tsx`). Sans lancer
concrètement la commande, ces deux régressions seraient restées
invisibles jusqu'à ce que quelqu'un ouvre Storybook en vrai.

**Comment l'appliquer** : ne pas se fier uniquement à la lecture du
diff pour juger qu'un changement de config/build est sans risque —
lancer la commande concernée.

## Vérification navigateur : à la demande, pas par défaut

**Règle** : après une modification visuelle, ne pas prendre
automatiquement le contrôle du navigateur pour vérifier — proposer le
choix (vérifier soi-même vs. laisser vérifier), sauf demande explicite
contraire.

**Impact si non respecté** : chaque vérification navigateur a un coût
(temps, tokens) qui n'est pas toujours justifié quand `tsc`/`build`
suffisent à donner confiance sur un changement mineur. À l'inverse, ne
jamais vérifier du tout laisse passer des bugs qu'aucun typecheck ne
peut attraper (ex. les deux bugs Storybook ci-dessus, ou le rendu
visuel d'une courbe SVG).

**Comment l'appliquer** : par défaut, vérifier avec `tsc`/`build`
seulement, puis demander si une vérification visuelle est souhaitée.
Basculer vers une vérification systématique seulement si
explicitement demandé (ex. "tu vas pouvoir tester toi-même").

## Discipline Git

**Règle** : ne commit que sur demande explicite. Des commits petits,
un par tranche de fonctionnalité cohérente (voir l'historique de ce
dépôt — un commit par feature, pas un gros commit fourre-tout).

**Impact si non respecté** : un commit non demandé peut capturer un
état intermédiaire que l'utilisateur ne voulait pas encore figer (ex.
un `ModuleDrawer.tsx` cassé pendant un refactor en cours), ou lui
retirer la possibilité de revoir le diff avant qu'il devienne
historique. Des commits trop gros mélangent plusieurs décisions dans
un seul point de retour arrière possible.

**Comment l'appliquer** : proposer un message de commit qui explique
le *pourquoi* du changement (pas juste *quoi*), dans le style des
messages déjà présents dans ce dépôt.

## Étendre ce document

Si une nouvelle convention non-évidente apparaît (un piège récurrent,
une préférence confirmée plusieurs fois), l'ajouter ici avec la même
structure (règle / impact concret / comment l'appliquer) plutôt que de
la laisser vivre seulement dans l'historique de conversation.
