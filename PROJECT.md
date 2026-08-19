# Global Hub

Application personnelle d'organisation : une vue unique regroupant plusieurs
modules (planning, notes, post-its, tâches, todo-list) sous forme de widgets.
Sur grand écran, disposés librement sur un canvas zoomable ; sous 768px, en
liste empilée (voir jalon "version mobile").

## Statut — jalon du 2026-08-19 (corrections accessibilité)

Depuis le jalon précédent (audit, même date), 1 chantier en cours
(branche `feat/a11y-fixes` — pas encore mergée au moment de ce jalon) :
correction des 7 constats de l'audit du 2026-08-19, vérifiée par re-scan
`@axe-core/playwright` (0 violation restante sur toutes les surfaces
auditées) plutôt qu'à la seule lecture du code.

- **Dialogs** (`components/ui/dialog.tsx`, un seul fichier pour toute
  l'app) — `DialogClose` a désormais un nom accessible (`closeLabel`
  requis sur `DialogContent`, `t('common.close')` chez les 3 appelants).
  Retour de focus après fermeture (`Escape`) : `finalFocus={true}` seul
  ne suffisait pas (mesuré, toujours `<body>`) — un `Context` interne à
  `dialog.tsx` capture l'élément actif à l'ouverture et le redonne à la
  fermeture, sans changement chez les appelants (ces dialogs sont tous
  pilotés en externe, sans `<DialogTrigger>`, donc le défaut de Base UI
  ne s'appliquait pas).
- **`EventFormModal.tsx`** — les 4 inputs date/heure (début/fin) ont
  désormais un `aria-label` (`planning.form.startDateLabel`/etc.).
- **Contrastes** — l'aperçu "Aa" des 14 couleurs de thème
  (`ModuleSettingsModal.tsx`) a un badge semi-transparent derrière le
  texte, dont la couleur (clair/sombre) s'adapte à celle du texte du
  preset (un badge sombre aurait aggravé le problème sur les presets à
  texte déjà noir, ex. jaune/ambre — bug intermédiaire détecté puis
  corrigé par re-scan). Onglets inactifs de cette modale
  (`components/ui/tabs.tsx`) : `text-neutral-600` remplace
  `text-muted-foreground` (4.34:1 → sous le seuil), seul usage de `Tabs`
  dans l'app à ce jour. Libellé du jour surligné "aujourd'hui"
  (`WeekGrid.tsx`/`WeekMinimal.tsx`) : `text-foreground` au lieu de
  `text-muted-foreground` sur `bg-primary/10`.
- **Événements de planning opérables au clavier** — les chips
  (`WeekGrid`/`WeekMinimal`/`MonthGrid`) sont devenus des `<button>`
  plutôt que des `<div onClick>` — ni focusables ni activables au
  clavier auparavant. Corrige aussi, par ricochet, la violation
  `scrollable-region-focusable` de leur conteneur (qui a alors un
  descendant focusable) — mais seulement quand des événements existent :
  `tabIndex={0}` ajouté directement sur les 3 conteneurs `.max-h-96`
  pour couvrir aussi le cas d'un calendrier vide (bug intermédiaire,
  détecté par re-scan sur une base de test vide).
- **Landmark du drawer** — `ModuleDrawer.tsx` : le panneau devient un
  `<nav aria-label="Modules">`. Effet de bord découvert par re-scan :
  une fois un premier landmark posé sur la page, axe exige une structure
  complète (un `<main>`, un `<h1>`) — sans ça, tout le contenu hors du
  nouveau `<nav>` se retrouve signalé comme "hors landmark", pire qu'avant
  ce correctif isolé. `HubCanvas.tsx`/`MobileHub.tsx` ont donc chacun
  gagné un `<h1 className="sr-only">Global Hub</h1>` et un `<main>`
  autour de leur contenu — le `h1` doit être fils du `main`, pas
  seulement voisin (encore un bug intermédiaire attrapé par re-scan).
- Nouveau `e2e/a11y.spec.ts` (permanent, contrairement au script jetable
  de l'audit) : 0 violation attendue sur le board desktop, mobile, la
  modale de création d'événement, la modale de réglages, + le test de
  retour de focus — régression pour ces 7 points à l'avenir.

## Statut — jalon du 2026-08-18 (version mobile)

Depuis le dernier jalon, 1 chantier en cours (branche `feat/mobile-layout`
— pas encore mergée au moment de ce jalon), le premier vrai chantier
d'architecture depuis le scaffold initial :

- **Layout mobile dédié** — l'app n'avait aucune logique responsive.
  Sous 768px (`useIsMobile`, `src/canvas/use-is-mobile.ts`, seuil aligné
  sur le préfixe Tailwind `md:`), `App.tsx` rend désormais `MobileHub.tsx`
  (nouveau) à la place de `HubCanvas.tsx` : les widgets en liste empilée
  scrollable plutôt que sur le canvas React Flow zoomable/pannable —
  choix délibéré plutôt que de rendre le canvas existant utilisable au
  doigt (pinch-zoom en conflit avec le scroll de page, sélection de plage
  horaire au glisser-souris dans `WeekGrid` non tactile).
  ⚠️ **Découverte clé qui a évité un refactor massif** : la plupart des
  widgets (`PostItWidget`, `TodoListWidget`, `NotesWidget`,
  `PlanningWidget`, `ImportantWidget`) appellent `useNodeId()`/
  `useReactFlow()` — mais uniquement pour calculer une position de spawn
  (jamais relue ailleurs que par `HubCanvas.tsx`) ou un `fitView` de
  confort (recentrage caméra). En enveloppant `MobileHub` dans un
  `<ReactFlowProvider>` **nu** (jamais de `<ReactFlow>` monté), ces hooks
  continuent de fonctionner sans throw, juste en no-op silencieux — zéro
  changement requis dans ces 5 fichiers.
  Deux extractions de `HubCanvas.tsx` pour être partagées avec
  `MobileHub.tsx` : `src/canvas/widget-components.tsx` (table id de
  module → composant, `type` de node simplifié pour valoir le même id
  plutôt qu'un vocabulaire séparé) et `src/canvas/module-visibility.ts`
  (hook `useModuleVisibility`, hiddenModuleIds+toggleModule — corrige au
  passage un petit bug existant : cet état n'était pas persisté avant,
  perdu à chaque reload).
  Seul `PlanningWidget.tsx` avait une largeur fixe cassant sur petit écran
  (`w-[640px]` → `w-full md:w-[640px]`) ; les autres widgets (160–320px)
  tenaient déjà sur un écran de téléphone standard.
  ⚠️ **Hors périmètre, limitations connues** : la sélection de plage
  horaire au glisser-souris dans `WeekGrid` (création rapide d'événement)
  ne fonctionne pas au doigt — le bouton "Nouvel événement" (tap) reste
  le chemin de création sur mobile, pas de fix du geste dans ce chantier.
  `ImportantWidget.focusNode` (recentrage caméra vers un post-it/fiche
  détaché) est un no-op silencieux en mobile — l'item reste visible dans
  la liste, juste pas auto-scrollé vers lui. Un seul breakpoint (768px),
  pas de mode "tablette" intermédiaire.
  Nouveau spec e2e `e2e/mobile-hub.spec.ts` (`test.use({ viewport:
  {width:390, height:844} })`, gabarit iPhone) : les widgets sont listés
  verticalement, aucune erreur console, création d'événement via le
  bouton.
  ⚠️ **Bug découvert après coup (signalé par l'utilisateur) : le titre
  "Planning — semaine" passait sur 3 lignes en mobile et débordait du
  cadre du header** — deux causes empilées dans `module-card.tsx`, pas une
  seule : (1) `CardTitle`, en flex item sans `min-w-0`, ne descend jamais
  sous la largeur de son texte non wrappé (`min-w-0` + `truncate` ajoutés)
  ; (2) `CardHeader`, en `display:grid`, agrandissait sa piste pour
  accueillir la largeur *naturelle non contrainte* de la rangée
  titre+actions plutôt que de la limiter à la largeur réelle du header —
  même piège "grid blowout", un niveau plus haut (`min-w-0` ajouté sur la
  rangée). Une fois ces deux corrigés, un **second bug est apparu** :
  avec beaucoup de boutons d'action (toolbar Planning), les derniers
  (`Vue mois`...) débordaient du `Card` (`overflow-hidden`) — présents
  dans le DOM, cliquables par l'automatisation Playwright, mais
  invisibles et inatteignables au doigt, sans le moindre indice visuel.
  Un premier correctif (`overflow-x-auto` posé directement sur le
  conteneur `justify-end` des actions) a introduit un **troisième bug** :
  `overflow-x-auto` + `justify-content: flex-end` déborde par le
  *début* du contenu (pas la fin), donc au scroll initial (0) c'était le
  bouton "Nouvel événement" qui se retrouvait hors champ, superposé au
  titre. Résolu avec un wrapper de scroll interne dédié (contenu aligné
  au début en son sein) à l'intérieur du conteneur externe `justify-end`
  (inchangé, pousse le tout à droite quand ça rentre) — le comportement
  desktop reste identique, et en mobile les boutons en trop restent
  atteignables par un swipe horizontal dans le header (bouton coupé à
  bord visible, signal de scrollabilité standard), plutôt qu'invisibles.
  Chaque étape vérifiée par mesure géométrique réelle (`boundingBox()`
  via un script Playwright jetable), pas seulement par lecture du code —
  les deux bugs intermédiaires n'auraient pas été visibles autrement.

## Statut — jalon du 2026-08-19 (audit accessibilité)

Depuis le dernier jalon, 1 chantier en cours (branche `feat/a11y-audit` —
pas encore mergée au moment de ce jalon). **Audit seulement, aucune
correction dans ce chantier** (décision explicite : comprendre l'ampleur
avant de corriger). Outillage : `@axe-core/playwright` ajouté en
devDependency (réutilisable pour le chantier de corrections à venir),
scan automatisé (règles WCAG via axe-core) sur le board desktop, le board
mobile, le drawer ouvert, la modale de réglages et la modale de création
d'événement — complété par une vérification manuelle du focus (piège de
focus et retour de focus dans les dialogs, qu'axe ne détecte pas).

**Constat global : pas de trou béant (pas de `<div onClick>` à la place
de `<button>`, focus trap correct dans les dialogs — Base UI fait bien
son travail à ce niveau), mais plusieurs vraies violations concrètes,
certaines systémiques (un seul point de correction touche toute l'app) :**

- **[critique] Bouton de fermeture des dialogs sans nom accessible** —
  `DialogClose` dans `components/ui/dialog.tsx` (icône `X` seule, aucun
  `aria-label`) : présent dans **tous** les dialogs de l'app
  (`EventFormModal`, `ModuleSettingsModal`, `DayDetailModal`). Un seul
  fichier à corriger pour résoudre partout.
- **[critique] Champs de formulaire sans label** — dans `EventFormModal.tsx`,
  les 4 inputs date/heure (début/fin) n'ont ni `<label>` ni `aria-label`
  (repérés seulement par leur position visuelle). `titlePlaceholder`/
  `locationPlaceholder`/etc. utilisent un `placeholder` seul comme unique
  indice, qui ne remplace pas un vrai label pour un lecteur d'écran.
- **[modéré, à trancher] Focus perdu après fermeture d'un dialog** — testé
  manuellement : `Escape` ferme bien la modale (piège de focus respecté
  pendant l'ouverture), mais le focus retombe sur `<body>` plutôt que de
  revenir au bouton qui l'a ouverte. Cause probable : tous les dialogs
  sont pilotés en externe (`open`/`onOpenChange` React state) plutôt que
  via `<DialogTrigger>` de Base UI, qui saurait alors à qui rendre le
  focus. Un utilisateur clavier perd sa position dans la page à chaque
  fermeture de modale.
- **[sérieux] Contraste insuffisant sur les 14 couleurs de thème** —
  `ModuleSettingsModal`, aperçu "Aa" en blanc sur les swatches de couleur
  (`theme-presets.ts`) : ratios mesurés de 1.7:1 à 4.4:1, aucun n'atteint
  le minimum WCAG AA (4.5:1) pour du texte. Concerne aussi les onglets de
  module inactifs de cette modale (texte gris `#737373` sur fond
  `#f5f5f5`, 4.34:1, juste sous le seuil).
- **[sérieux, systémique] Zones scrollables non accessibles au clavier**
  — toute zone `.nowheel` (listes Notes/Tâches, grilles WeekGrid/MonthGrid,
  liste d'instances du drawer...) : scrollable à la souris/tactile
  seulement, pas de moyen clavier de faire défiler sans `tabindex`/rôle
  adapté. Motif répété dans beaucoup de composants (même classe
  utilitaire), pas un cas isolé.
- **[sérieux] Contraste insuffisant sur l'en-tête "aujourd'hui" en vue
  mois/semaine** — le jour courant surligné (`bg-primary/10`) rend le
  texte gris du libellé de jour illisible-limite (3.86:1, sous 4.5:1).
- **[modéré] Contenu du drawer hors d'une landmark** — le panneau
  "Modules" (`ModuleDrawer`) n'est dans aucune région sémantique
  (`nav`/`aside`/`role="region"`), signalé par axe comme contenu de page
  non rattaché à une landmark.

**Pas testé dans cet audit** (à couvrir si un futur chantier corrections
s'étend) : navigation clavier complète module par module (au-delà du
focus trap des dialogs), lecteur d'écran réel (axe/Playwright ne simulent
pas VoiceOver/NVDA), les 3 vues de Planning au clavier (sélection de
plage horaire par glisser-souris déjà identifiée non tactile, également
non clavier).

## Statut — jalon du 2026-08-18 (icône "important" unifiée)

Depuis le dernier jalon, 1 chantier en cours (branche
`feat/important-icon-consistency` — pas encore mergée au moment de ce
jalon) qui traite le dernier point de "À affiner" restant de ce type
(incohérence visuelle) :

- **Toggle "important" unifié sur l'icône `Star`** — `NoteList.tsx` et
  `TaskList.tsx` utilisaient un glyphe texte `!` tandis que
  `PostItNote.tsx`/`TodoSheetNote.tsx` (post-its/fiches détachés) et le
  module Important lui-même (`module-registry.ts`) utilisaient déjà
  l'icône `lucide-react` `Star` — deux conventions différentes pour la
  même action. `NoteList`/`TaskList` convertis sur `Star` (même style
  `fill-amber-500 text-amber-500` quand actif que sur les nodes détachés),
  le glyphe `!` disparaît de l'app.

## Statut — jalon du 2026-08-17 (Planning : allDay + détail de jour)

Depuis le jalon précédent (E2E, même date), 1 PR mergée sur `develop`
(tests end-to-end), plus le chantier ci-dessous (branche
`feat/planning-allday-daydetail` — pas encore mergée au moment de ce
jalon), qui traite les deux premiers points de "À affiner" (les plus
prioritaires, de vrais trous fonctionnels) :

- **Événements `allDay` visibles en vues jour/semaine** — `WeekGrid.tsx`
  et `WeekMinimal.tsx` filtraient `!e.allDay`, faisant disparaître ces
  événements de ces deux vues (visibles seulement en vue mois). Ajout
  d'une rangée dédiée dans `WeekGrid` (au-dessus de la grille horaire) et
  d'une section dédiée par jour dans `WeekMinimal` (label "Journée
  entière" à la place de la plage horaire). `eventOccursOnDay` (logique de
  chevauchement `[event.start, event.end)` × jour, gérant les allDay
  multi-jours) extraite de `MonthGrid.tsx` vers `date-utils.ts` — 3 usages
  réels (`MonthGrid`, `WeekGrid`, `WeekMinimal`) justifiaient la
  factorisation.
- **Vue mois : détail d'un jour chargé** — cliquer une case avec
  débordement (`+N`) ouvrait directement la création d'un nouvel
  événement, sans moyen de voir la liste complète. Nouveau
  `DayDetailModal.tsx` : un jour avec au moins un événement ouvre
  désormais ce détail (liste triée allDay-puis-horaire, clic sur un
  événement → édition, bouton "+" → création) ; un jour vide garde le
  chemin rapide existant (création directe). Aucune nouvelle clé i18n
  (réutilise les clés `planning.form.*`/`planning.toolbar.*` existantes).
- **`ModuleSettingsModal` traduite** — dernier point non traduit de l'app
  (voir "À affiner" des jalons précédents). Titres de section ("Thème
  (fond et texte du titre)"/"Style du header") et les 14 noms de couleur
  de `theme-presets.ts` + les 2 noms de style de `module-style.tsx`
  convertis en `labelKey` résolues via `t()`, même pattern que
  `EventTypePreset`/`ModuleDefinition` (nouveau namespace i18n
  `moduleSettings.*` dans `fr.json`/`en.json`). 100 % de l'UI de l'app est
  désormais traduite.

## Statut — jalon du 2026-08-17 (tests end-to-end)

Depuis le dernier jalon (2026-08-14), 1 PR mergée sur `develop` (tests
coverage), plus le nettoyage et le chantier E2E ci-dessous (branche
`feat/e2e-tests` — pas encore mergée au moment de ce jalon) :

- **Nettoyage** — `src/modules/checklist/ChecklistWidget.tsx` (code mort
  identifié depuis le jalon du 08-11) supprimé, commit direct sur
  `develop` (dérogation ponctuelle à la convention branche-par-chantier,
  changement d'une ligne sans risque). `types.ts` du module conservé
  (`ChecklistLine`/`ChecklistWidgetData` toujours utilisés par Todo-list).
- **Tests end-to-end** — infrastructure posée avec `@playwright/test`
  (config séparée de `vite.config.ts`, `playwright.config.ts` +
  `e2e/*.spec.ts`, script `npm run test:e2e`) : un vrai navigateur piloté
  contre l'app servie par `npm run dev`, plutôt qu'un composant monté en
  isolation. Contourne (sans le résoudre) le blocage connu de
  `App.tsx`/`HubCanvas.tsx` en environnement de test isolé — `hub.spec.ts`
  est le premier test qui rend réellement l'arbre complet de l'app.
  4 scénarios pour ce premier jalon : rendu des 6 widgets, création d'un
  événement planning via la modale, création d'une note avec sauvegarde
  réelle (debounce non mocké), drag d'un post-it détaché + persistance
  après un vrai `page.reload()`. Ce dernier scénario vérifie la position
  directement dans IndexedDB (table `postIts` de la base `global-hub`,
  requêtée via l'API native `indexedDB` dans `page.evaluate`) plutôt que
  par comparaison de coordonnées écran : `fitView` (React Flow) recalcule
  zoom/pan au montage à partir des positions de tous les nodes, donc le
  viewport après reload peut différer de celui d'avant le drag même si la
  position logique du post-it n'a pas bougé — comparer des pixels écran
  entre les deux aurait été un test fragile pour la mauvaise raison.
  Portée volontairement resserrée à 4 scénarios critiques (pas une
  couverture exhaustive module par module, déjà faite par l'unitaire/
  composant) ; pas de Page Object Model pour ce premier lot (cf.
  CONTRIBUTING.md "pas d'abstraction prématurée" — à introduire si de
  nouveaux scénarios rendent les specs redondantes).

## Statut — jalon du 2026-08-14

Depuis le dernier jalon (2026-08-11), 3 PRs mergées sur `develop`
(2026-08-12 → 2026-08-13), plus le chantier tests unitaires ci-dessous
(2026-08-14, branche `feat/unit-tests` — pas encore mergée au moment de ce
jalon) :

- **Planning** — indication de provenance d'un événement : liseré coloré à
  gauche de la case (bleu Google / indigo Outlook / neutre local),
  `sourceBorderClass`/`sourceLabelKey` dans le nouveau `source-style.ts`,
  appliqué aux 3 vues (`WeekGrid`/`WeekMinimal`/`MonthGrid`) ; type
  d'événement (Travail/Perso/Santé/Loisirs/Autre) via un nouveau
  champ `CalendarEvent.type`, liste curatée dans `EventFormModal`
  (`event-type-presets.ts`, même pattern que `theme-presets.ts`) — chaque
  type pilote automatiquement `color`, un seul contrôle.
- **Internationalisation** — infrastructure `react-i18next` posée pour
  toute l'app (`src/i18n/`, hook `useLanguage`, sélecteur FR/EN dans le
  Drawer) ; **tous les modules traduits** (Planning, Notes, Post-its,
  Tâches, Todo-list, Important) + le moteur d'édition riche partagé
  (`StyleToolbar`, `fonts.ts`) et le Drawer. Reste en français : la modale
  de réglages (`ModuleSettingsModal` — titres de section "Thème"/"Style du
  header" et les 14 noms de couleur de `theme-presets.ts`), volontairement
  hors périmètre (UI secondaire, moins prioritaire).
- **Tests unitaires** — infrastructure posée (`vite.config.ts` : 3 projets
  Vitest — `storybook` existant, `unit` pour la logique pure en Node,
  `component` pour des tests de composants React classiques en navigateur —
  + `npm run test:coverage`) **et objectif de couverture atteint** : 80 %
  statements / 82 % lignes (parti de ~21 %), 170 tests. Quasiment tous les
  modules couverts (widgets Notes/Tâches/Post-its/Todo-list/Important/
  Planning, hooks `canvas/`, `ModuleDrawer`) ; `ModuleSettingsModal` couvert
  par ricochet (rendu par `ModuleDrawer`) sans fichier de test dédié.
  Convention Page Object Model pour les tests de composants
  (`Component.pom.ts` à côté de `Component.test.tsx`) — `TaskList.pom.ts`/
  `TaskList.test.tsx` sert de gabarit. Toujours à 0 % : `App.tsx`/
  `HubCanvas.tsx` (bloqué, cf. gotcha ci-dessous), `checklist/ChecklistWidget.tsx`
  (code mort, cf. "À affiner" — à supprimer plutôt qu'à tester).
  ⚠️ Playwright doit avoir ses navigateurs installés localement
  (`npx playwright install chromium`) — pas fait par `npm install`, sans ça
  `npm run test`/`test:coverage` échouent au démarrage (`storybook` et
  `component` tournent tous deux en navigateur headless).
  ⚠️ Le rapport texte de `test:coverage` a un bug d'affichage constaté :
  certains fichiers pourtant bien testés (ex. `date-utils.ts`, 100 % réel)
  disparaissent du tableau récapitulatif imprimé dans le terminal — les
  données sont correctes dans le rapport HTML (`coverage/index.html`),
  c'est un souci d'agrégation du reporter texte entre projets, pas un vrai
  trou de couverture. Vérifier dans le HTML en cas de doute plutôt que de
  se fier au tableau terminal seul.
  ⚠️ **Rendre un composant qui utilise une icône `lucide-react`, un
  composant `@base-ui/react` (`Button`/`Dialog`/`Popover`/`Tabs`) ou plus
  généralement un hook contextuel, dans le projet `component`, pouvait
  planter avec `Cannot read properties of null (reading 'useContext'/...)`**
  — deux copies distinctes de React chargées (l'app + celle découverte "à
  la volée" par le pré-bundling Vite quand un nouveau test touche une
  dépendance pour la première fois). Fixé par `resolve.dedupe: ['react',
  'react-dom']` **et** en listant explicitement dans `optimizeDeps.include`
  chaque sous-chemin `@base-ui/react/*` réellement importé (le nom de
  paquet nu ne suffit pas, chaque sous-chemin est son propre point d'entrée
  pour l'optimizer) — si un nouveau composant `components/ui/*` apparaît
  avec un nouveau sous-chemin `@base-ui/react`, l'ajouter à cette liste
  plutôt que de laisser Vite le découvrir tout seul en cours de run.
  ⚠️ `@testing-library/react` ne s'auto-configure pas ici (pas de
  `globals: true` dans la config Vitest, les tests importent `describe`/
  `it`/`afterEach` explicitement) : `src/test/setup-component.ts`
  (`setupFiles` du projet `component`) doit donc appeler `cleanup()`
  manuellement après chaque test (sinon le DOM d'un test précédent reste
  monté et fait échouer les `getByRole`/`getByText` suivants avec "multiple
  elements found"), importer `@testing-library/jest-dom/vitest` (matchers
  `toBeInTheDocument`/`toBeDisabled`/... — présents à l'exécution sans lui,
  mais `tsc` échoue sans les types qu'il apporte), et réinitialiser tout
  état global partagé entre fichiers de test : la base Dexie (même
  singleton `db` que l'app, polyfillée en mémoire via `fake-indexeddb/auto`
  plutôt que de mocker `useLiveQuery` à la main — le comportement réactif
  de Dexie reste donc réel) et la langue i18next (un test qui bascule en
  anglais, ex. le sélecteur du Drawer, la laisserait sinon active pour tous
  les tests suivants qui s'exécutent après dans le même run).
  ⚠️ **`App.tsx`/`HubCanvas.tsx` restent non testés : leur rendu bloque
  indéfiniment** dans le projet `component` (React Flow, probablement une
  boucle de mesure de layout en environnement headless/zéro-taille) — pas
  élucidé plus avant faute de temps, à creuser avant de s'y attaquer plutôt
  que de re-essayer un `render()` direct.

Le paragraphe "Statut — jalon du 2026-08-11" ci-dessous reste tel qu'écrit à
l'époque.

---

## Statut — jalon du 2026-08-11

Depuis le dernier jalon (2026-08-03), 3 PRs mergées sur `develop`
(2026-08-07 → 2026-08-10) :

- **Planning** — vues jour et mois construites (seule la semaine existait) ;
  détail/édition d'un événement existant (clic sur un event, plus seulement
  création/suppression).
- **Important** — étendu au planning et aux post-its/todo-list détachés
  (ne couvrait que les notes).
- **Correction doc** : le bullet Tâches/Todo-list ci-dessous décrivait
  encore l'ancien moteur `checklist` partagé — Tâches a en réalité été
  refondu en liste + éditeur indépendant (même architecture que Notes) sans
  que ce jalon-ci ne le documente ; le composant `ChecklistWidget` partagé
  initial est aujourd'hui du code mort (`src/modules/checklist/ChecklistWidget.tsx`),
  seul le type `ChecklistLine` reste partagé avec Todo-list.

Le paragraphe "Statut — jalon du 2026-08-03" ci-dessous reste tel qu'écrit à
l'époque (voir remarque ci-dessus sur le point Tâches/Todo-list, seul
élément qui y est désormais inexact).

## Statut — jalon du 2026-08-03

Six jours de développement itératif (17 commits, 2026-07-28 → 2026-08-03).
Les six modules du board sont fonctionnels et personnalisables (thème de
couleur + style de header) depuis un menu de réglages ; reste du polish
(voir "À affiner").

- **Notes** — implémenté : liste + éditeur riche (Tiptap), sauvegarde
  debouncée, suppression avec confirmation, création d'un post-it à partir
  d'une note.
- **Post-it** — implémenté : bloc fixe (brouillon local) + post-its détachés
  indépendants (nodes React Flow dragables), même moteur d'édition riche que
  Notes, position persistée dans Dexie.
- **Tâches** / **Todo-list** — implémenté via un moteur `checklist` partagé
  (`src/modules/checklist/`) : texte libre, une ligne commençant par `-` est
  cochable/rayable au clic.
- **Planning** — vue **semaine** implémentée (grille étendue / récap
  compact, 5 ou 7 jours), création d'événement via modale
  (`EventFormModal`), **import ponctuel de fichier `.ics`** (pas de
  synchro live — voir `ics-import.ts`). Vues jour/mois du modèle initial
  (`PlanningView = 'day' | 'week' | 'month'`) **pas encore construites**.
- **Important** — implémenté pour les notes uniquement (agrégation par type,
  ouverture directe dans Notes). Pas encore branché sur planning/tâches.
- **Drawer + Réglages des modules** (nouveau ce jalon) — panneau
  afficher/masquer chaque module (et, pour Post-it/Todo-list, chaque
  instance détachée individuellement, avec masquage en cascade
  module→instances mais pas l'inverse) + modale de réglages par module
  (thème de couleur et style de header "Vague"/"Plein", persistés en
  localStorage, cf. "Théming des modules" plus bas).
- **Storybook consolidé** — composants réutilisables (`components/ui/*`,
  `module-card.tsx`) couverts par des stories ; `npm run test` (chaque story
  = un test Vitest/Playwright) fonctionne réellement (voir "Gotchas" plus
  bas — cassé jusqu'à ce jalon, corrigé le 2026-08-03).

## Architecture

```
global-hub/
├── PROJECT.md
├── README.md
├── vite.config.ts             # plugins react/tailwind/pwa + alias @/* + config vitest
├── .storybook/
│   ├── main.ts                 # retire VitePWA du build Storybook (cf. Gotchas)
│   └── preview.tsx             # importe src/index.css (cf. Gotchas)
└── src/
    ├── App.tsx                 # rend <HubCanvas />
    ├── index.css                # Tailwind + thème shadcn
    ├── components/
    │   ├── ui/                  # design system réutilisable : button, card,
    │   │                        # dialog, popover, tabs — chacun avec une
    │   │                        # story Storybook (sauf button/card)
    │   └── module-card.tsx      # coquille commune à tous les widgets
    │                            # (nodrag, header full-bleed, variant
    │                            # wave/flat) — cf. module-card.stories.tsx
    ├── canvas/                  # orchestration transverse, pas de logique
    │   │                        # métier d'un module en particulier
    │   ├── HubCanvas.tsx          # canvas React Flow + nodeTypes
    │   ├── ModuleDrawer.tsx       # panneau afficher/masquer les modules
    │   ├── ModuleSettingsModal.tsx # modale de réglages (thème + style)
    │   ├── module-registry.ts     # liste des 6 modules fixes + leurs défauts
    │   ├── module-navigation.tsx  # coordination Important -> Notes
    │   ├── module-theme.tsx       # Context+localStorage : thème par module
    │   ├── module-style.tsx       # Context+localStorage : style par module
    │   └── theme-presets.ts       # presets de couleur (14 au 2026-08-03)
    ├── lib/
    │   ├── db.ts                 # schéma Dexie (events, notes, postIts, tasks, todos)
    │   ├── types.ts              # type partagé Importable
    │   └── utils.ts              # helper cn() (shadcn)
    └── modules/                 # un dossier par module métier
        ├── planning/              # PlanningWidget, WeekGrid/WeekMinimal,
        │                          # MonthGrid, EventFormModal, ics-import,
        │                          # date-utils
        ├── notes/                 # NotesWidget, NoteList
        ├── text-editor/           # moteur Tiptap partagé (notes + post-its)
        ├── post-its/              # PostItWidget (bloc), PostItNote (détaché)
        ├── checklist/             # moteur partagé (tasks + todo-list)
        ├── tasks/                 # TasksWidget (wrapper de ChecklistWidget)
        ├── todo-list/             # TodoListWidget + TodoSheetNote (détaché)
        └── important/             # ImportantWidget — agrège les éléments flaggés
```

**Règle de placement** pour du nouveau code : un comportement propre à *un*
module → `modules/<nom>/` ; une coordination *entre* modules ou une
personnalisation transverse (thème, visibilité, navigation) → `canvas/` ; un
composant sans aucune connaissance du domaine (bouton, card, modale) →
`components/ui/`, avec une story Storybook (voir "Definition of done").

## Théming des modules (thème + style)

Chaque module a un thème de couleur (`defaultThemeId`, `theme-presets.ts`)
et un style de header (`defaultStyleId`, `'wave'` par défaut — encoche SVG
entre titre et actions — ou `'flat'` — une seule couleur pleine, sans
découpe). Les deux sont personnalisables par module dans la modale de
réglages (accessible depuis le bouton en bas du drawer) et persistés
séparément dans localStorage (`ModuleThemeProvider`/`ModuleStyleProvider`,
deux Context+localStorage distincts plutôt qu'un seul générique — chacun est
volontairement petit et à une seule responsabilité).

- **Pourquoi Context+localStorage et pas Dexie ici** : ce sont des
  préférences d'apparence UI, pas de la donnée applicative (pas besoin
  d'index, de requêtes, de versioning de schéma). Dexie reste réservé aux
  vraies entités métier (notes, tâches, événements...).
- **Pourquoi deux providers séparés plutôt qu'un seul** : générer une
  abstraction commune pour seulement deux cas d'usage aurait ajouté de la
  complexité sans bénéfice réel — trois lignes dupliquées valent mieux
  qu'une fausse généralisation prématurée.

## Decisions & gotchas techniques

- **Type d'appli** : PWA (desktop + mobile, un seul codebase, installable,
  offline-first).
- **Frontend** : React + Vite + TypeScript. **UI** : Tailwind + shadcn/ui
  (composants construits sur `@base-ui/react`, pas Radix).
- **`ModuleCard`** (`src/components/module-card.tsx`) : coquille commune à
  tous les widgets.
  - `headerClassName` colore le header en entier ; `CardContent` repasse
    sur fond neutre.
  - ⚠️ Ne jamais construire `headerClassName` en concaténant des bouts de
    classe au runtime (ex. `` `bg-${color}-300` ``) : le scanner statique de
    Tailwind (JIT) ne détecte que des noms de classe qui apparaissent comme
    littéraux quelque part dans le source. `theme-presets.ts` définit donc
    chaque `headerClassName` comme une chaîne littérale complète.
  - ⚠️ Ne pas passer de classe custom type `.important-surface` à
    `headerClassName` : la couche Tailwind `utilities` (dont `bg-card`)
    passe après `components` dans la cascade, donc une classe
    `@layer components` perdrait à spécificité égale. Toujours des
    utilitaires Tailwind directs.
- **Éditeur de texte partagé** (`src/modules/text-editor/`) : notes et
  post-its utilisent le même moteur Tiptap — indispensable pour qu'un
  post-it créé à partir d'une note garde exactement sa mise en forme.
- **Stockage** : local-first via Dexie (IndexedDB) pour la donnée
  applicative ; localStorage pour les préférences UI (thème/style/drawer).
  ⚠️ IndexedDB n'accepte pas les booléens comme clé d'index valide (les
  enregistrements avec une valeur non indexable sont silencieusement
  exclus de l'index) — le flag `important` est indexé dans le schéma Dexie
  mais on ne s'appuie jamais sur `.where('important')`, on lit toute la
  table et on filtre en mémoire. Garder ce réflexe pour toute future source
  (events, post-its).
- **Planning, vue mois** : `addMonths` (`date-utils.ts`) recale toujours au
  1er du mois cible plutôt que de conserver le quantième courant (évite le
  saut de mois que `setMonth` provoquerait sur les fins de mois, ex. 31
  janvier + 1 mois → 3 mars). Conséquence assumée : `referenceDate` est
  partagé entre les 3 vues (pas d'état séparé par vue) — naviguer en mois
  puis rebasculer en jour/semaine atterrit donc sur le 1er du mois affiché.
- **Navigation "Important" → post-it/fiche todo-list détachée** : passe par
  `fitView({ nodes: [{ id }] })` (React Flow) plutôt que par
  `requestOpen`/état interne, car ces nodes n'ont pas de widget parent
  persistant à faire basculer (chaque node EST l'item). Si le node ciblé
  n'est pas monté (masqué via le drawer), l'appel ne fait simplement rien —
  même esprit que la limite déjà acceptée pour Notes/Tâches (pas de pan si
  le widget est hors écran).
- **Storybook réutilise `vite.config.ts`** de l'app, qui inclut `VitePWA` —
  ça faisait planter `build-storybook` (précache workbox tentant d'inclure
  les bundles de Storybook lui-même). Fixé via un `viteFinal` dans
  `.storybook/main.ts` qui retire ce plugin pour le build de Storybook
  uniquement.
- **Storybook a son propre point d'entrée** (`preview.tsx`), qui ne passe
  pas par `main.tsx` — `src/index.css` (Tailwind + thème) n'y était donc
  jamais chargé, rendant les composants non stylés dans l'iframe Storybook.
  Fixé par un simple `import '../src/index.css'` dans `preview.tsx`.
- **`npm run test` (Storybook + Vitest, chaque story = un test navigateur)**
  échouait au démarrage même : plusieurs dépendances transitives CJS
  (`aria-query`, `lz-string`, `pretty-format`, requises par
  `@testing-library/*` via `@storybook/addon-vitest`) n'étaient pas
  détectées par le pré-bundling automatique de Vite en mode navigateur —
  erreurs d'interop ESM/CJS (`does not provide an export named ...`,
  `exports is not defined`) alors qu'un `require()` Node classique les
  voyait très bien. Fixé en les listant explicitement dans
  `optimizeDeps.include` (`vite.config.ts`) pour forcer leur pré-bundling
  par esbuild. Si une nouvelle story fait apparaître une erreur similaire
  sur un autre paquet CJS, même fix : l'ajouter à cette liste.

## Definition of done (composants réutilisables)

Tout composant sous `components/ui/*` ou de la même nature que
`module-card.tsx` (partagé, sans logique métier) doit avoir une story
Storybook avant d'être considéré terminé. Ça a déjà attrapé deux bugs réels
ce jalon (surlignage de l'onglet actif qui ne s'appliquait jamais faute du
bon attribut `data-*`, aperçu du style "Vague" ne montrant que la moitié de
la courbe) — sans la story pour aller vérifier visuellement, ces deux bugs
seraient passés inaperçus.

## Convention de commentaires (ce document et le code)

Les commentaires expliquent le **pourquoi**, jamais le **quoi** (le nom des
identifiants suffit) : une contrainte cachée, un contournement pour un bug
précis, un comportement qui surprendrait à la lecture. Si retirer le
commentaire ne rendrait rien confus, il ne devrait pas exister. Même
principe dans ce fichier : les sections "Gotchas"/"Pourquoi" ci-dessus
documentent des décisions non évidentes, pas une redite de ce que le code
dit déjà.

## Reporté à plus tard (objectif long terme, pas en cours)

- **Comptes / authentification.**
- **Synchronisation multi-appareils** — objectif à long terme, pas engagé
  pour l'instant. Le code appelle Dexie directement dans chaque widget
  (`db.notes.toArray()`...), **pas** de couche repository aujourd'hui :
  si ce chantier démarre un jour, prévoir cette abstraction à ce moment-là
  plutôt que de supposer qu'elle existe déjà.
- **Import calendrier externe live** (Google/Outlook, synchro continue) —
  seul l'import ponctuel d'un fichier `.ics` est fait à ce jour (voir
  Statut). Le modèle de données (`source`, `externalId`) est déjà prêt pour
  ça.

## À affiner

- ~~Accessibilité : 7 constats de l'audit~~ tous corrigés le 2026-08-19
  (voir Statut) — vérifiés par re-scan axe (0 violation) + régression
  permanente `e2e/a11y.spec.ts`. Pas couvert par cet audit ni ce chantier
  (à traiter séparément si besoin) : navigation clavier complète au-delà
  des dialogs, test avec un vrai lecteur d'écran (VoiceOver/NVDA), la
  sélection de plage horaire par glisser-souris dans `WeekGrid` (déjà
  identifiée non tactile/non clavier lors du chantier mobile).
- **Tests unitaires** — objectif 80 % atteint (voir Statut). Reste à 0 % :
  `App.tsx`/`HubCanvas.tsx` (cf. gotcha ci-dessous — pas juste "pas encore
  fait", un vrai blocage technique à lever), `ModuleSettingsModal.tsx`
  (couvert à 90 % par ricochet via le test `ModuleDrawer`, pas de fichier
  dédié) — `checklist/ChecklistWidget.tsx` supprimé depuis (code mort, voir
  plus bas), donc plus concerné. Reste aussi à faire monter les branches
  (74 %) et fonctions (73 %), en retard sur les lignes (82 %) — surtout des
  cas d'erreur/branches secondaires non exercés dans les widgets déjà
  couverts, pas des fichiers entiers à zéro.
- **Tests end-to-end** — infrastructure posée (voir Statut) : 4 scénarios
  critiques (rendu du board, création d'événement, création de note,
  drag + persistance post-reload d'un post-it). Reste : pas de couverture
  E2E pour Post-it/Todo-list/Tâches/Important en tant que tels (seul un
  chemin post-it sert de véhicule au test de persistance), pas de scénario
  multi-widgets (ex. masquer/afficher via le Drawer), pas de CI pour les
  lancer automatiquement (repo sans pipeline CI pour l'instant, `npm run
  test:e2e` reste manuel). À enrichir si un bug réel émerge dans une zone
  non couverte plutôt que d'ajouter des scénarios par anticipation.
- **Internationalisation (i18n)** — reste : la modale de réglages
  (`ModuleSettingsModal`) n'est pas traduite — titres "Thème (fond et texte
  du titre)"/"Style du header", et les 14 noms de couleur de
  `theme-presets.ts` (`Bleu`, `Jaune`...) + les 2 noms de style (`Vague`/
  `Plein`) resteraient à convertir en clés (`labelKey`, même pattern que
  `EventTypePreset`/`ModuleDefinition`) si on veut couvrir 100 % de l'UI.
  Volontairement hors périmètre pour l'instant (UI secondaire, moins
  prioritaire que le contenu des modules eux-mêmes, déjà tous traduits).
- **Mobile** — voir Statut. Reste : sélection de plage horaire au
  glisser-souris dans `WeekGrid` non fonctionnelle au doigt (le bouton
  "Nouvel événement" reste le chemin de création sur mobile) ;
  `ImportantWidget.focusNode` sans effet visible en mobile (l'item est
  déjà dans la liste, juste pas auto-scrollé) ; pas de mode "tablette"
  intermédiaire (un seul breakpoint, 768px).
- Todo-list : le module pourrait être simplifié (rien d'acté).
- ~~Toggle "important" : glyphe `!` vs icône `Star`~~ fait le 2026-08-18
  (voir Statut) — `Star` partout.
- ~~Planning, vue mois : pas de vue détaillée au clic sur une case au-delà
  du débordement `+N`~~ fait le 2026-08-17 : `DayDetailModal.tsx` (voir
  Statut).
- ~~Planning, vues jour/semaine : événements `allDay` invisibles~~ fait le
  2026-08-17 : rangée/section dédiée dans `WeekGrid`/`WeekMinimal` (voir
  Statut).
- ~~Nettoyage `ChecklistWidget.tsx`~~ fait le 2026-08-17 : composant mort
  supprimé (`src/modules/checklist/`), `types.ts` conservé (`ChecklistLine`/
  `ChecklistWidgetData` toujours utilisés par Todo-list/Tâches).

---

## Archive — état au 2026-07-28 (scaffold initial)

Conservé tel quel pour retrouver la description/les specs initiales du
projet, avant l'implémentation des modules. Ne reflète plus l'état actuel
du code (voir "Statut" en haut de ce fichier) — certains points (ex.
"Reporté à plus tard : import calendrier") sont depuis partiellement faits.

## Statut

Scaffolding posé (Vite/React/TS, Tailwind, shadcn/ui, React Flow, Dexie,
Storybook, PWA) avec un placeholder par module sur le canvas. Reste à
implémenter le comportement réel de chaque widget.

## Objectifs

- Centraliser dans une seule vue : planning (jour/semaine/mois), notes,
  post-its, tâches, todo-list.
- Retrouver le même hub sur plusieurs postes (dev, perso) et sur téléphone.
- Ne pas se préoccuper du design pour l'instant, se concentrer sur les
  fonctionnalités.

## Modules envisagés (v1)

- **Planning** : vue jour / semaine / mois. Pas de source externe pour le
  moment — événements créés et stockés localement.
  - Chaque widget planning est une **instance indépendante** avec sa propre
    config (vue + mode) — on peut avoir plusieurs instances en même temps
    dans le hub (ex : une hebdo + une daily + une mensuelle).
  - Chaque vue a deux modes d'affichage :
    - **Semaine étendu** : grille horaire complète pour chaque jour.
      **Semaine compact** : récap des créneaux occupés uniquement (heures
      en info), jours vides = rien affiché.
    - **Jour étendu** : grille horaire complète de la journée avec les
      événements positionnés dedans. **Jour compact** : liste des
      créneaux occupés, sans grille.
    - **Mois étendu** : grille mensuelle avec le titre des événements
      affiché dans chaque case (type Google Calendar). **Mois compact** :
      grille mensuelle avec juste un indicateur (point/nombre) par jour
      chargé, sans détail.
  - **Modèle d'événement** — pensé iso avec les futurs imports
    (Google/Outlook/iCal) : `title`, `start`, `end`, `allDay`,
    `description`, `location`, `color`, `source`
    (`local`/`google`/`outlook`), `externalId` (dédup à l'import),
    `recurrence` (champ réservé, non géré en v1). Champ `important`
    (booléen) propre à Global Hub, pas un champ standard externe.

- **Notes** : édition simple avec une petite barre d'outils partagée avec
  les post-its (`StyleToolbar`, voir plus bas) — couleur de texte, taille,
  police, gras, italique. Pas de mise en forme avancée (titres, listes
  imbriquées...), on reste minimal.
  - Bouton à droite du champ titre (vue éditeur) pour créer un post-it à
    partir du contenu courant (brouillon ou note sélectionnée, tel quel).
  - Une seule instance du widget gère une **liste** de notes (pas une note
    fixe par widget). Deux vues : **Liste** (titre de chaque note + toggle
    important) et **Éditeur** (champ titre + éditeur riche).
  - En-tête contextuel par vue, un seul bouton pertinent visible à la fois :
    - Vue **Liste** : uniquement **+** (nouvelle note).
    - Vue **Éditeur** : **Liste** (y retourner) + soit **Enregistrer**
      (brouillon non encore persisté, désactivé si vide) soit **Supprimer**
      (note déjà réelle) — jamais les deux, jamais "+" ici.
    Pas de bouton "Éditeur" séparé — redondant avec la sélection d'un item
    ou "+". Suppression retirée de la liste (elle vit dans l'éditeur).
  - L'éditeur reflète la sélection courante de la liste : pas de sélection
    → brouillon local non persisté (vide tant que rien n'est tapé) ;
    sélection → édition directe de la note, sauvegarde debouncée comme
    avant. Un brouillon non vide est enregistré soit explicitement (bouton
    Enregistrer, reste ouvert dans l'éditeur), soit en filet de sécurité en
    quittant la vue éditeur (retour liste ou nouvelle note via « + »).
  - Suppression d'une note depuis la liste (confirmation avant suppression).

- **Post-its** : **implémenté**, modèle différent des notes — un "bloc"
  (`PostItWidget`, widget fixe) et des post-its détachés indépendants
  (`PostItNote`, un node React Flow par post-it, dragable). Même moteur
  d'édition riche (Tiptap) et même toolbar que les notes (`StyleToolbar`) —
  voir "Éditeur de texte partagé" plus bas.
  - Le bloc affiche un carré jaune avec sa toolbar toujours visible (pas de
    bascule affichage/édition ici, c'est un widget fixe comme les autres) ;
    on y écrit un brouillon local (non persisté). Le bouton "Détacher"
    transforme ce brouillon en un vrai enregistrement `PostIt` (Dexie) — à
    ce moment il apparaît sur le canvas comme un post-it indépendant, et le
    bloc repart à vide.
  - Un post-it détaché est dragable par défaut (`nodrag` seulement pendant
    l'édition, sinon on ne pourrait jamais le déplacer en le saisissant).
    Cliquer dessus l'active : le texte devient éditable directement sur le
    fond jaune, et la toolbar apparaît flottante au-dessus (centrée), avec
    en plus un bouton de suppression. Se ferme au clic en dehors (listener
    `mousedown` en phase **capture** sur `document` — la phase bulle ne
    suffit pas, React Flow stoppe la propagation de certains clics pour son
    propre suivi de drag/sélection).
  - Position persistée dans Dexie (`x`/`y` sur `PostIt`). Les nodes
    dynamiques passent par le même state `nodes` + `applyNodeChanges` que
    les widgets fixes (pas de circuit séparé) — Dexie ne sert que de
    persistance, synchronisé dans `nodes` à l'ajout/suppression et écrit
    depuis `nodes` en fin de drag. Les faire suivre un circuit différent
    avait cassé le suivi interne du drag par React Flow (le node
    disparaissait).

- **Tâches** et **Todo-list** : deux composants distincts (styles
  probablement très différents à terme), mais avec le même comportement
  côté feature pour l'instant :
  - Le contenu est un texte libre ; une ligne commençant par `-` est un
    item cochable.
  - Clic sur un item → texte barré (terminé). Deuxième clic → annule le
    barré.
  - Clic sur une ligne qui n'est *pas* un item (pas de `-`) → le texte
    grise et une coche s'affiche à côté (pas de barré dans ce cas). Un
    second clic annule ce grisé + coche.
  - Le module todo-list pourrait être simplifié plus tard (à revoir, rien
    d'acté).

- **Important** : module transverse, pas lié à un seul type de contenu.
  Regroupe tous les éléments (événements de planning, notes, post-its...)
  ayant le statut `important` activé (ex : case à cocher sur un événement).
  - Basé uniquement sur l'état `important`, pas de filtre par date — tout
    élément flaggé apparaît, peu importe quand.
  - **Implémenté** pour les notes (seule source réelle à ce stade — le
    planning n'a pas encore d'UI). Affichage en **rubriques par type**
    (« Notes », puis plus tard « Événements », « Tâches »...) — lecture
    seule, pas de gestion du flag ici (ça reste à la source, ex. le "!" dans
    la liste des notes). Étendre à d'autres sources plus tard = une requête
    + une rubrique de plus, même principe.
  - Cliquer un item note l'ouvre directement dans le widget Notes (bascule
    en vue éditeur sur cette note). Coordination entre les deux widgets via
    `NotesNavigationProvider` (`src/canvas/notes-navigation.tsx`), un
    contexte React fourni au niveau du canvas — les nodes React Flow sont
    sinon complètement indépendants. Limite actuelle : ça ne déplace pas la
    vue sur le canvas si le widget Notes est hors écran, ça met juste à jour
    son état.
  - ⚠️ IndexedDB n'accepte pas les booléens comme clé d'index valide (les
    enregistrements avec une valeur non indexable sont silencieusement
    exclus de l'index). Le flag `important` est indexé dans le schéma Dexie
    mais on ne s'appuie jamais sur `.where('important')` — on lit toute la
    table et on filtre en mémoire. Garder ce réflexe pour toute future
    source (events, post-its).
  - Présentation (liste chronologique vs groupée) à affiner une fois
    plusieurs types d'éléments réellement flaggables.

## Structure du projet (scaffold initial)

```
global-hub/
├── PROJECT.md
├── index.html
├── components.json           # config shadcn/ui
├── vite.config.ts            # plugins react, tailwind, pwa + alias @/*
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── .storybook/
│   ├── main.ts
│   └── preview.tsx
├── public/
│   ├── favicon.svg
│   └── icons.svg
└── src/
    ├── main.tsx
    ├── App.tsx                # rend <HubCanvas />
    ├── index.css              # imports Tailwind + thème shadcn
    ├── components/
    │   ├── ui/                 # composants shadcn (button, card, popover)
    │   └── module-card.tsx     # coquille commune à tous les widgets (nodrag,
    │                           # en-tête full-bleed) — chaque module l'utilise
    │                           # au lieu d'implémenter Card directement
    ├── canvas/
    │   ├── HubCanvas.tsx       # canvas React Flow + nodeTypes des modules
    │   └── notes-navigation.tsx # contexte de coordination entre widgets
    │                           # indépendants (ex. Important -> ouvrir une note)
    ├── lib/
    │   ├── db.ts               # schéma Dexie (events, notes, postIts, tasks, todos)
    │   ├── types.ts            # type partagé Importable
    │   └── utils.ts            # helper cn() (shadcn)
    └── modules/
        ├── planning/           # PlanningWidget.tsx, types.ts (CalendarEvent...) — placeholder
        ├── notes/              # NotesWidget.tsx (Dexie), NoteList.tsx
        ├── text-editor/        # useRichTextEditor, StyleToolbar, RichTextEditor,
        │                       # TextStyleExtras (Tiptap), Toolbar{Button,Popover,
        │                       # Divider}, fonts.ts — partagé par notes/ et post-its/
        ├── post-its/           # PostItWidget.tsx (bloc), PostItNote.tsx (note
        │                       # détachée, node dynamique), types.ts
        ├── checklist/          # ChecklistWidget.tsx, types.ts — partagé par tasks/todo-list
        ├── tasks/              # TasksWidget.tsx (wrapper de ChecklistWidget) — placeholder
        ├── todo-list/          # TodoListWidget.tsx (wrapper de ChecklistWidget) — placeholder
        └── important/          # ImportantWidget.tsx, types.ts — agrège les notes flaggées
```

Le module **notes** est implémenté (éditeur Tiptap minimal : gras, italique,
taille et couleur en sous-menus, correcteur orthographique désactivable,
persistance Dexie débouncée). Les autres modules restent des placeholders
affichés sur le canvas, sans logique métier.

### Scripts npm

- `npm run dev` — serveur de développement Vite
- `npm run build` — typecheck (`tsc -b`) + build de production
- `npm run preview` — sert le build de production en local
- `npm run lint` — lint via oxlint
- `npm run storybook` — Storybook en local (port 6006)
- `npm run build-storybook` — build statique de Storybook

## Décisions techniques (à date)

- **Type d'appli** : PWA (couvre desktop + mobile avec un seul codebase,
  installable, offline-first). Un exécutable desktop (Tauri) reste possible
  plus tard en surcouche si besoin.
- **Frontend** : React + Vite + TypeScript.
- **UI** : Tailwind + shadcn/ui pour les composants des widgets.
- **ModuleCard** (`src/components/module-card.tsx`) : coquille commune à tous
  les widgets, chaque module l'utilise plutôt que d'implémenter `Card`
  (shadcn) directement.
  - Pose `nodrag` une fois pour toutes sur le contenu (obligatoire pour
    rester interactif sur un node React Flow).
  - `headerClassName` colore **`Card` en entier** (identité visuelle du
    module) ; la zone d'action et `CardContent` repassent explicitement sur
    fond neutre (`bg-card`/`text-foreground`), ne laissant la couleur
    visible qu'autour du titre.
  - La zone d'action est une `div` maison (pas le `CardAction` shadcn, qui
    imposerait sa propre grille limitant sa largeur au contenu) en `flex-1`
    pour occuper l'espace restant, hauteur de ligne fixe (`h-10`) avec la
    zone d'action à 90 % de cette hauteur.
  - ⚠️ Ne pas passer de classe custom type `.important-surface` à
    `headerClassName` : `Card` a sa propre classe utilitaire `bg-card`, et
    la couche Tailwind `utilities` passe après `components` dans la
    cascade — une classe `@layer components` perdrait face à `bg-card` à
    spécificité égale. Toujours passer des utilitaires Tailwind directs
    (`bg-orange-300 text-white`, etc.).
- **Éditeur de texte partagé** (`src/modules/text-editor/`) : notes et
  post-its utilisent le même moteur riche (Tiptap), pas deux implémentations
  parallèles — indispensable pour qu'un post-it créé à partir d'une note
  garde exactement sa mise en forme (`html` transféré tel quel).
  - `TextStyleExtras` (`text-style.ts`) : extension Tiptap portant `color`,
    `fontSize` et `fontFamily` sur le même mark `textStyle`.
  - `useRichTextEditor` : hook créant l'éditeur + l'état dérivé pour la
    toolbar (bold/italic/taille/police/couleur) + le correcteur
    orthographique. Prend un paramètre `editable` (les post-its détachés
    basculent affichage figé ↔ édition active ; les widgets fixes restent
    toujours éditables).
  - `StyleToolbar` : la toolbar elle-même, un slot `extra` pour les boutons
    propres à l'appelant (ex. suppression sur un post-it détaché) sans
    qu'elle ait besoin de les connaître. Icône "Aa" = police (rendue dans la
    police active, ouvre un menu listant les polices), icône `ALargeSmall` =
    taille (icône différente de la police pour ne pas les confondre).
  - `RichTextEditor` : composition inline (toolbar au-dessus + contenu),
    utilisée par les notes et le bloc post-it. Un post-it détaché compose
    `useRichTextEditor` + `StyleToolbar` séparément à la place, pour que la
    toolbar flotte au-dessus du post-it plutôt que de pousser son contenu.
- **Style "important"** : classe partagée `.important-surface` (définie dans
  `src/index.css` via `@layer components`, fond orange pâle + texte blanc)
  — utilisée pour les **lignes/items** flaggés important dans une liste (ex.
  notes), pas pour la couleur d'en-tête d'un module (cf. limite ci-dessus).
- **Storybook** : pour tester/valider les widgets visuellement, indépendamment
  de l'appli.
- **Layout** : React Flow — canvas zoomable/pannable, chaque module est un
  "node" déplaçable librement (pas de grille figée).
- **Stockage** : local-first via Dexie (IndexedDB) — chaque module fonctionne
  offline dès le départ ; positions du layout persistées de la même manière.

## Reporté à plus tard (volontairement)

- **Comptes / authentification.**
- **Synchronisation multi-appareils** : la couche data est pensée en
  repository pattern pour qu'un backend (Supabase, ou Node+SQLite
  auto-hébergé) puisse être branché plus tard sans réécriture.
- **Import calendrier externe** : le modèle de données du planning prévoit
  dès maintenant un champ `source` (`local` / `google` / `outlook`) pour
  accueillir l'agrégation de calendriers externes sans refonte.

## À affiner

Détail des fonctionnalités de chaque module (planning, notes, post-its,
tâches, todo-list) avant de démarrer le développement.
