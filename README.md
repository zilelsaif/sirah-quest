# Sirah Quest

A future bilingual Bahasa Melayu / English educational exploration RPG with a
classic fantasy JRPG feel.

This repository contains the web application foundation and a small Phaser
exploration prototype with movement, radial fog of war, and reusable Sirah
question interactions. Version 0.8.0 adds functional Movement Speed, Vision
Radius, and Hint Capacity upgrades. Backend services, authentication,
database, and mobile packaging have not been added yet.

## Requirements

- [Node.js](https://nodejs.org/) (a current LTS version is recommended)
- npm (included with Node.js)

## Install dependencies

Open a terminal in the project directory and run:

```bash
npm install
```

You only need to repeat this after dependencies change or after downloading a
fresh copy of the project.

## Run the development server

```bash
npm run dev
```

Vite will print a local address, usually `http://localhost:5173`. Open it in a
browser. The server automatically refreshes the page when source files change.

## Play the movement prototype

The test map supports both desktop and touch-friendly controls:

- Move with WASD or the arrow keys.
- Click a map destination with a mouse.
- Tap a map destination on a phone or tablet.
- Press E near a discovered clue, or click/tap its marker or prompt.
- Answer the bilingual multiple-choice question to complete a clue.
- Use **PETUNJUK** to eliminate one incorrect answer when enough choices remain.
- An incorrect answer provides feedback and can be attempted again.
- Reopen a completed clue to review its correct answer and learning explanation.

Keyboard movement cancels an active click or tap destination. The prototype uses
placeholder shapes only; it does not contain final game art or content.

During development, **New Test Run** selects a fresh set of three questions and
resets clue, quest, answer-order, player-position, and remaining-Hint run state.
It deliberately preserves player XP, level, purchased upgrade ranks, Upgrade
Points, and the reward ledger. The control is excluded from production builds.

The player's configurable vision radius reveals unexplored map areas. Previously
visited areas remain visible in a dimmed explored state.

## Question content and replay

The starter bank contains 24 bilingual editorial drafts covering early life,
the first revelation, and Hijrah. All items are pending editorial review; their
presence is not a claim of religious or historical approval. The review process
is documented in [docs/QUESTION_EDITORIAL_REVIEW.md](docs/QUESTION_EDITORIAL_REVIEW.md).

Each run assigns one topic-correct question to each of the three clues and shuffles the
answer order while checking correctness through stable option IDs. The current
run remains stable until a new test run or page reload. Only the previous run's
question IDs are stored in the browser; no personal information is stored. The
selector prefers questions not used in the previous run. If too few alternatives
exist, it fills the remaining slots from the full bank without duplicating a
question within the current run.

The two-mode map design is documented in
[docs/WORLD_STRUCTURE.md](docs/WORLD_STRUCTURE.md). The React World Map connects
to the Phaser Area Map while preserving the current session during transitions.

## Multi-quest prototype

Open **Log Quest** from either the World Map or Area Map. Three demonstration
quests are available in Kampung Ilmu. Players explicitly accept quests, may keep
up to three active quests at once, and may track one active quest or none.
Completing a related clue progresses its active quest without blocking other
quests. A clue completed before quest acceptance is recognized when that quest
is accepted. Quest, clue, question-order, player-position, and travel state are
kept while switching maps. Permanent refresh persistence is not implemented yet.

## Player XP and levels

Player progression is separate from the replayable run state. Completing a clue
awards 10 XP once, a main quest awards 60 XP once, and a side quest awards 40 XP
once. Wrong answers, clue discovery, travel, tracking changes, and reopening
completed content award no XP and apply no penalty.

Every reward uses a stable event ID recorded in an in-memory ledger. This stops
map transitions, repeated processing, and **New Test Run** from farming the same
normal clue or quest reward during the current application session.

Cumulative level thresholds are:

| Level | Total XP required |
| --- | ---: |
| 1 | 0 |
| 2 | 100 |
| 3 | 220 |
| 4 | 360 |
| 5 | 520 |
| 6 | 700 |
| 7 | 900 |
| 8 | 1120 |
| 9 | 1360 |
| 10 | 1620 |

Each level gained after Level 1 grants one unspent Upgrade Point. Open **Naik
Taraf** from either map to spend points on Movement Speed, Vision Radius, or
Hint Capacity. Each category has five ranks and costs one point per rank.

Movement Speed adds 10% of the base speed per rank without compounding. Vision
Radius adds 40 pixels per rank. Hint Capacity begins at one Hint per run and
adds one per rank. Purchased ranks survive World Map/Area Map transitions and
New Test Run. A New Test Run refills Hints to the current capacity, while map
travel and closing a question do not. All progression still resets after a full
browser refresh because permanent saving is not implemented.

## Sirah question editorial review

The printable review snapshot is
[docs/SIRAH_QUESTIONS_FOR_REVIEW.md](docs/SIRAH_QUESTIONS_FOR_REVIEW.md). It
contains all questions and stable IDs directly exported from
`src/game/questions/questionBank.ts`. It is pending review by a qualified ustaz
and must not be treated as approved content.

For a new, unreviewed snapshot, first preserve or rename any existing reviewed
document, then run:

```bash
npm run questions:export
```

The exporter deliberately refuses to overwrite the existing Markdown file so
human notes cannot be lost silently. Apply approved corrections to the source
bank by stable question ID, create a fresh snapshot, and submit changed content
for review again.

Verify that the snapshot still contains every exact source record and no checked
approval boxes with:

```bash
npm run questions:verify
```

## Development releases

### v0.8.0 — Upgrade System development

- Makes Upgrade Points spendable through a responsive BM upgrade panel.
- Adds immediate Movement Speed and Vision Radius effects from centralized stats.
- Adds consumable per-run Hints that safely eliminate incorrect answer options.
- Preserves purchases across map transitions and New Test Run.
- This development version has not been archived yet.

### v0.7.0 — XP and Level System

- Adds idempotent XP rewards for clue and quest completion.
- Adds the configurable Level 1–10 curve and one Upgrade Point per level gained.
- Adds responsive progression HUD and level-up notification to both map modes.
- Separates persistent-in-session player progression from resettable run state.
- Preserved as an immutable archived release.

### v0.6.0 — Multi-Quest development

- Adds three data-driven Kampung Ilmu quests with independent progress.
- Adds a responsive BM Quest Log shared by World Map and Area Map.
- Keeps clue questions randomized but aligned with each quest topic.
- Adds a complete pending-review question-bank export for manual ustaz review.
- Preserved as an immutable archived release.

### v0.5.1 — Final World Map polish

- Adds a clearer first-entry **Mula Pengembaraan** call to action.
- Improves World Map location status, travel feedback, touch targets, and
  responsive spacing without changing gameplay or question content.
- Preserves the v0.5.0 World Map Foundation as an immutable archived build.

## Create a production build

```bash
npm run build
```

This checks the TypeScript code and creates an optimized production build in the
`dist` directory. It also copies every archived release into `dist/releases`, so
the latest app and all old releases can be deployed together.

To preview that build locally, run:

```bash
npm run preview
```

## Archive a release

Create an archive when a version is ready to preserve. Versions must use the
`vMAJOR.MINOR.PATCH` format. For example, to archive version `v0.0.1`, run:

```bash
npm run release -- v0.0.1
```

The command builds the current app with relative asset paths and saves the
complete result in `releases/v0.0.1`. Each archive contains its own JavaScript,
CSS, images, and other assets, so it does not depend on the latest build.

Archived releases are immutable: the command stops with an error if that version
already exists. To publish the latest app together with all archives, run
`npm run build`. After deployment, the latest version is available at `/` and
the example archive is available at `/releases/v0.0.1/`.

## Project structure

```text
src/
├── game/        Phaser scene, clues, questions, quests, fog, input, and movement
├── App.tsx      Starter screen
├── main.tsx     React entry point
└── styles.css   Responsive global styles
releases/         Self-contained, immutable release archives
scripts/          Release creation and production-copy scripts
docs/             Editorial workflow and locked world structure
```
