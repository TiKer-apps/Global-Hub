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

## Jalons de PROJECT.md : empiler, jamais écraser

**Règle** : un nouveau jalon ne décrit que le delta depuis le précédent
(pas un résumé cumulatif) et s'ajoute comme nouvelle section
"Statut — jalon du X" au-dessus des autres — la pile entière de jalons
passés reste en dessous, chacun sous son propre titre "Statut — jalon du
Y", jamais fusionnée ni réécrite en place. Pas de section "Archive"
séparée : l'ordre (plus récent en premier) et les dates suffisent à
signaler ce qui est historique, un wrapper dédié n'ajouterait rien.

**Impact si non respecté** : le contenu exact d'un jalon passé
(formulations, ce qui était encore "pas construit" à l'époque) est perdu
dès qu'il est réécrit ou fusionné en place — seul un `git log` sur
`PROJECT.md` permettrait de le retrouver, ce qui va à l'encontre du but
du fichier (donner un état lisible sans creuser l'historique).

**Comment l'appliquer** : avant d'ajouter du contenu à un jalon déjà
écrit, se demander s'il s'agit bien du jalon en cours ou si un nouveau
jalon devrait être ouvert à la place. Ne jamais reformuler un jalon déjà
clos après coup — seulement en ajouter un nouveau au-dessus.

## Branches par feature depuis `develop`

**Règle** : chaque chantier vit sur sa propre branche (`feat/<nom-court>`)
créée depuis `develop`, avec une PR vers `develop` à la fin. Jamais de
travail direct sur `main` ni sur `develop`.

**Impact si non respecté** : un chantier non isolé sur sa propre branche
mélange son diff avec celui du chantier suivant, rendant la revue et un
éventuel rollback ciblé impossibles. C'est aussi ce qui permet à deux
chantiers de progresser en parallèle sans se marcher dessus (ex.
`feat/plannin-view` et `feat/important-extend` ont touché les mêmes
fichiers planning en parallèle — la divergence ne s'est réglée qu'au
rebase, proprement, grâce à l'isolation par branche).

**Comment l'appliquer** : `git checkout -b feat/<nom-court> develop`
avant de commencer un nouveau chantier ; ouvrir la PR vers `develop` une
fois terminé (jamais vers `main`, réservé aux releases).

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

## Accessibilité : à considérer à chaque ajout/modification

**Règle** : tout nouvel élément interactif (bouton, champ, dialog,
zone scrollable...) ou toute modification de l'UI existante doit
rester accessible — pas seulement fonctionnelle à la souris/au tactile.
Points à vérifier par réflexe :
- Icône seule (bouton de fermeture, action sans texte visible) →
  `aria-label`, jamais juste l'icône.
- Champ de formulaire sans `<label>` visible → `aria-label` explicite
  (cf. les inputs date/heure d'`EventFormModal.tsx`).
- Élément cliquable qui n'est pas un vrai contrôle interactif
  (`<div onClick>` à la place d'un `<button>`) → ni focusable ni
  activable au clavier. Utiliser un `<button type="button">` (les
  classes Tailwind existantes suffisent, pas besoin de reset — le
  preflight de Tailwind gère déjà l'apparence par défaut).
- Nouvelle couleur de texte sur un fond coloré (thème, badge, aperçu...)
  → vérifier le contraste WCAG AA (4.5:1 pour du texte normal), pas
  seulement "ça se lit à l'œil".
- Nouvelle zone scrollable avec du contenu qui pourrait être vide
  (liste, grille) → `tabIndex={0}` sur le conteneur si son contenu n'est
  pas garanti d'inclure un élément focusable.
- Nouveau landmark (`nav`, `main`...) → vérifier qu'il ne fait pas
  apparaître de nouvelles violations "hors landmark" sur le contenu
  voisin (axe applique une structure plus stricte dès qu'un premier
  landmark existe sur la page).

**Impact si non respecté** : l'audit du 2026-08-19 (voir `PROJECT.md`)
a trouvé 7 violations concrètes accumulées sans qu'aucune ne soit
volontaire — chacune issue d'un pattern ci-dessus répété sans y penser
(icône seule, `div onClick`, texte blanc sur couleur vive...). Corriger
après coup a demandé de re-vérifier toute l'app plutôt que de coûter
quelques minutes au moment de l'écrire. Plusieurs "corrections" ont
elles-mêmes introduit un nouveau bug (badge de contraste sombre sur du
texte déjà noir, structure de landmarks incomplète) — un changement a11y
n'est fiable que vérifié, pas juste "plausible à la lecture".

**Comment l'appliquer** : `@axe-core/playwright` est installé
(`devDependencies`) — avant de considérer un changement d'UI terminé,
un scan rapide (`new AxeBuilder({ page }).analyze()` sur la page/le
dialog concerné, cf. `e2e/a11y.spec.ts` pour le pattern) confirme
l'absence de régression, plus fiable qu'une relecture du JSX. Le test
`e2e/a11y.spec.ts` existant couvre déjà les surfaces principales
(board desktop/mobile, modale de création d'événement, modale de
réglages) — l'étendre si une nouvelle surface significative apparaît.

## Étendre ce document

Si une nouvelle convention non-évidente apparaît (un piège récurrent,
une préférence confirmée plusieurs fois), l'ajouter ici avec la même
structure (règle / impact concret / comment l'appliquer) plutôt que de
la laisser vivre seulement dans l'historique de conversation.
