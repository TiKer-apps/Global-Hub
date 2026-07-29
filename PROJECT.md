# Global Hub

Application personnelle d'organisation : une vue unique regroupant plusieurs
modules (planning, notes, post-its, tâches, todo-list) sous forme de widgets
disposés librement sur un canvas zoomable.

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

## Structure du projet

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
