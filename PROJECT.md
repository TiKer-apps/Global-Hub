# Global Hub

Application personnelle d'organisation : une vue unique regroupant plusieurs
modules (planning, notes, post-its, tâches, todo-list) sous forme de widgets
disposés librement sur un canvas zoomable.

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

- Planning, indication de provenance d'un événement — **le modèle est déjà
  prêt** (`CalendarEvent.source: 'local' | 'google' | 'outlook'`, détecté
  automatiquement à l'import via `detectSource()` dans `ics-import.ts`, cf.
  PRODID du fichier `.ics`), seul l'affichage manque : rien ne distingue
  aujourd'hui un event Outlook d'un event Gmail dans la grille. Piste
  retenue : un accent visuel discret par source (ex. liseré coloré sur la
  case, distinct du remplissage) pour ne pas entrer en collision avec la
  couleur de type ci-dessous — canal visuel séparé (bordure vs fond).
- Planning, type d'événement (cinéma, médical, travail...) — pas de champ
  dédié aujourd'hui, seul `color` existe (jamais renseigné par l'UI
  actuelle). Piste retenue : liste de types curatée dans `EventFormModal`
  (même pattern que `theme-presets.ts`, déjà utilisé pour le thème des
  modules) — chaque type a une couleur préréglée appliquée automatiquement
  au choix, un seul contrôle (pas de sélecteur de couleur séparé). Nécessite
  un nouveau champ `type?: string` sur `CalendarEvent` en plus du `color`
  existant (qui devient dérivé du type plutôt que réglé à la main).
- Todo-list : le module pourrait être simplifié (rien d'acté).
- Suite du polish visuel général sur les 6 modules (notamment le langage
  visuel du toggle "important" : glyphe `!` dans les listes vs. icône
  `Star` sur les nodes canvas — deux conventions différentes, pas encore
  réconciliées).
- Planning, vue mois : pas de vue détaillée accessible au clic sur une case
  au-delà des events déjà affichés (débordement `+N` en mode étendu).
- Planning, vues jour/semaine : les événements `allDay` restent invisibles
  (filtre `!e.allDay` dans `WeekGrid`/`WeekMinimal`, non touché lors de
  l'ajout des vues jour/mois) — faute d'une zone "journée entière" dédiée
  dans la grille horaire, écart volontaire non traité dans ce chantier.
- Nettoyage : `src/modules/checklist/ChecklistWidget.tsx` est du code mort
  (Tâches a été refondu en liste + éditeur indépendant sans passer par ce
  composant, seul le type `ChecklistLine` reste utilisé, par Todo-list) —
  à supprimer, ou à réévaluer si un usage réel réapparaît.

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
