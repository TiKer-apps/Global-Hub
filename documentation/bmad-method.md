# BMAD-METHOD : résumé et ce qu'il faudrait pour l'adopter ici

Cinquième pièce du dossier `documentation/`. Contrairement aux quatre
précédentes, ce document ne décrit pas ce projet mais un framework externe
évalué pour un usage possible dessus — à traiter comme une note
d'évaluation, pas une décision actée.

## Qu'est-ce que BMAD-METHOD

Framework open source (dépôt
[`bmad-code-org/BMAD-METHOD`](https://github.com/bmad-code-org/BMAD-METHOD))
pour structurer le développement assisté par IA façon "équipe agile" :
plutôt qu'une seule conversation générique avec un assistant, le travail est
découpé entre plusieurs **agents spécialisés** (personas), chacun avec un
rôle borné et un artefact versionné en sortie, qui se passent le relais.

Gratuit, 100 % open source, s'intègre à Claude Code, Cursor, Windsurf, VS
Code.

## Concepts clés

**La boucle de livraison**, en 4 phases : *Clarify* (partir d'une idée
vague) → *Plan* (la préciser en spec exploitable) → *Build and Verify*
(implémenter par petits changements testables) → *Learn and Adjust*
(itérer sur le résultat réel). Le framework revendique un "process à la
bonne taille" : un correctif simple va droit à l'implémentation, un
chantier complexe reçoit la profondeur de planification nécessaire.

**Les agents/personas principaux** (rôle borné, un artefact en sortie
chacun) :

| Agent | Rôle | Produit |
|---|---|---|
| Analyst | Recherche domaine/marché/faisabilité technique | Product Brief (vision, personas, métriques) |
| PM | Formalise les besoins | PRD (exigences fonctionnelles, format Given/When/Then) |
| Architect | Décisions techniques + découpage | ADRs (Architecture Decision Records), épics/stories, validation de "prêt à démarrer" |
| UX Expert | Specs de design (si le projet a une UI) | Composants, patterns d'interaction, design system |
| Scrum Master | Découpe en tickets exploitables | Fichiers de story individuels |
| Dev | Implémente | Code + revue |
| QA | Vérifie | Validation qualité/tests |

Plus un Orchestrator/Master qui coordonne l'ensemble. Chaque agent a un
contexte volontairement limité à sa tâche (pas tout l'historique du
projet) — le relais se fait **via les documents produits**, pas via la
mémoire de conversation : le PRD écrit par le PM est ce que l'Architect
lit, pas un résumé oral de ce qui s'est dit avant.

## Ce que l'installation ajoute à un repo

`npx bmad-method install` crée un dossier caché à la racine (`_bmad/` dans
les versions récentes, `.bmad-core/` dans les plus anciennes — vérifier la
version au moment de l'essai) contenant :

- `agents/` — définitions des personas ;
- `workflows/` — les workflows guidés (50+ selon la doc du projet) ;
- `templates/` — gabarits de documents (PRD, architecture...) ;
- `tasks/`, `checklists/`, `data/` — briques réutilisées par les agents ;
- un dossier de sortie séparé (`_bmad-output/` dans les versions récentes)
  pour les artefacts générés par les agents (PRD, stories...) sur le projet
  courant.

L'installeur ajoute aussi des fichiers d'intégration spécifiques à l'outil
choisi (commandes slash, configuration de mode) pour que les agents/
workflows BMAD apparaissent dans la palette de commandes de l'IDE — pour
Claude Code, ça prendrait la forme de skills/commandes supplémentaires.

**Prérequis techniques** : Node.js 20.12+, Python 3.10+, `uv`.

## Tension avec le fonctionnement déjà en place ici

Ce projet a déjà un workflow structuré, mais différent, décrit dans
`CONTRIBUTING.md`/`CLAUDE.md` : mode plan de Claude Code (exploration →
plan écrit → validation explicite avant code) + `PROJECT.md` comme mémoire
persistante des décisions (jalons empilés, section "À affiner" comme
backlog vivant) + une branche par chantier. C'est, en plus informel,
conceptuellement proche de ce que fait BMAD (agents remplacés par les
phases du mode plan, PRD/architecture remplacés par les jalons de
`PROJECT.md`).

Adopter BMAD ne serait donc pas ajouter une structure là où il n'y en a
aucune, mais **remplacer ou faire cohabiter** deux systèmes qui jouent un
rôle similaire — le vrai travail d'adoption n'est pas l'installation
(triviale, une commande) mais de décider laquelle des deux mémoires fait
foi.

## Ce qu'il faudrait mettre en place pour l'essayer ici

1. **Décider du périmètre de l'essai** — sur un chantier réel et
   suffisamment substantiel pour juger (pas un correctif d'une ligne), en
   parallèle du fonctionnement actuel plutôt qu'en remplacement direct.
2. **Installer** (`npx bmad-method install`) et vérifier les prérequis
   (Node/Python/uv) sont satisfaits sur la machine de dev.
3. **Trancher la cohabitation avec `PROJECT.md`** : les artefacts BMAD
   (PRD, stories) remplacent-ils les jalons `PROJECT.md` pour ce chantier,
   ou les deux coexistent (risque de double mémoire qui diverge) ?
4. **Vérifier le support Claude Code précisément** (versions/skills
   disponibles peuvent évoluer vite sur un projet aussi actif) avant de
   s'engager, plutôt que de se fier à ce document.

## Points ouverts

- Le projet n'est pas solo (au moins deux personnes y travaillent) — c'est
  justement le cas d'usage que BMAD cible (coordination entre plusieurs
  personnes/sessions IA désynchronisées via des artefacts formels partagés,
  plutôt qu'une mémoire de conversation propre à chacun). Reste à savoir
  si `PROJECT.md` + le mode plan suffisent déjà à cet usage à deux, ou si
  la coordination actuelle (qui se passe comment aujourd'hui entre les deux
  personnes ? à préciser) justifie ce formalisme en plus.
- Si essai : sur quel prochain chantier, et avec quel critère de "ça vaut
  le coup" vs "on revient au fonctionnement actuel" ?

Sources : [dépôt GitHub bmad-code-org/BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD),
[guide d'installation](https://github.com/bmad-code-org/BMAD-METHOD/blob/main/docs/how-to/install-bmad.md),
recherches complémentaires sur les rôles d'agents (contenu tiers, à
recouper avec la doc officielle si adoption sérieuse envisagée).
