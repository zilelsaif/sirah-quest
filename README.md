# Sirah Quest

A future bilingual Bahasa Melayu / English educational exploration RPG with a
classic fantasy JRPG feel.

This repository contains the web application foundation and a small Phaser
exploration prototype with movement, radial fog of war, and reusable Sirah
question interactions. Version 0.14.0 expands all three Area Maps with
data-driven environmental zones while preserving the existing clues, gameplay,
progression, fog coordinates, and save structure. Backend services,
authentication, database, and mobile packaging have not been added yet.

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
run remains stable across map transitions and browser refreshes. Question
assignments and answer order are stored locally; no personal information is stored. The
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
kept while switching maps and browser refreshes.

## Multi-area foundation

Kampung Ilmu and Bazar Lama are both playable through the same configurable
Phaser Area Map engine. A centralized area registry supplies each area's stable
ID, bilingual name, dimensions, spawn, obstacles, landmarks, and three clues.
Bazar Lama uses a fictional sandstone market layout and is not presented as a
historical reconstruction or sacred location.

Player position, fog exploration, and clue state are stored separately for each
area. XP, upgrades, Hints, Sirah Mastery, quests, and the three-active-quest
limit remain global. The six clue questions are selected together—one pair per
topic without duplicate question IDs in the same run—and do not reshuffle while
travelling between areas.

Save schema v3 migrates the existing v2 Kampung Ilmu state into the multi-area
structure and creates a clean Bazar Lama state. New Test Run resets both areas,
all six assignments, fog, positions, clues, quests, and Hints while preserving
RPG progression, the XP reward ledger, upgrade ranks, and Sirah Mastery.

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
travel and closing a question do not. Progression is restored from local browser
storage after a refresh.

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

## Sirah Mastery

**Penguasaan Sirah** records evidence of learning by stable question ID. It is
separate from player XP, Levels, Upgrade Points, and upgrade ranks, and it does
not grant RPG rewards. A correct answer earns 6 points, plus 2 for a correct
first attempt and 2 when no Hint was used, for a maximum of 10 per question.
Wrong answers and Hints never reduce an existing score.

Only the best score for each question is retained. Repeating a question with a
lower score cannot farm or reduce Mastery; a better later attempt replaces the
old score. Topic and overall percentages are derived from the current question
bank, while coverage separately shows how many questions have evidence. The
gameplay bands are Permulaan, Membina Asas, Berkembang, Kukuh, and Cemerlang;
they are learning-progress labels and are not formal religious certification.

Encounter flags for an incorrect attempt and Hint use are saved, so refreshing
mid-question cannot restore either bonus. Save schema v2 adds Mastery and these
flags. A valid v1 save is migrated without changing its XP, upgrades, quests,
questions, Hint count, world state, position, or fog. Migrated saves begin with
no Mastery evidence because v1 did not contain reliable learning-quality data.

New Test Run resets the current run and encounter flags but preserves best
Mastery scores. **Padam Semua Kemajuan** resets both RPG progression and Sirah
Mastery. All 24 current questions remain pending editorial review. Materially
changing a question's learning objective may require a future content-version
or Mastery migration policy even if wording corrections retain its stable ID.

## Development releases

### v0.14.0 — Area Map Expansion and Exploration Foundation

All three existing maps now extend primarily to the right and bottom. Existing
spawns, clues, obstacles, coordinate origins, Area IDs, and established core
routes retain their previous coordinates.

| Area | Previous size | Expanded size | Added environmental zones |
| --- | ---: | ---: | --- |
| Kampung Ilmu | 1600×1200 | 2200×1600 | Kawasan Kediaman, Kebun dan Ladang, Balai Ilmu, Pinggir Kampung |
| Bazar Lama | 1680×1240 | 2304×1568 | Lorong Pedagang, Kawasan Gudang, Halaman Kafilah, Dataran Pasar |
| Perpustakaan Hikmah | 1728×1280 | 2304×1568 | Dewan Bacaan, Sayap Arkib, Taman Ilmu, Bilik Kajian |

- Adds stable bilingual zone data, representative access points, environmental
  identities, and neutral future-content notes through the shared
  `AreaDefinition`/`AreaRegistry` architecture.
- Extends the shared Phaser `EnvironmentRenderer` with zone surfaces, labels,
  and typed obstacle treatments. It does not introduce separate area scenes or
  external artwork.
- Keeps the 32-pixel A* grid, 18-pixel player radius, eight-direction movement,
  corner-cut prevention, blocked-target fallback, camera behavior, and all
  existing clue coordinates.
- Fog discovery remains serialized as world-space `{x, y, radius}` points, so
  previous exploration does not shift when map dimensions grow. Added regions
  begin unexplored.
- Keeps save schema v3. Existing valid positions and all progression data remain
  structurally compatible; map expansion does not reset saves.
- The new zones contain no new quest, clue, question, reward, NPC, or historical
  claim. They reserve connected space for later reviewed content.
- `npm run areas:verify` checks zone IDs, access points, existing clue routes,
  blocked-target fallback, and spawn-to-zone A* reachability.
- Visuals remain lightweight Phaser-generated prototype art. Physical Android
  performance and complete device playthroughs remain release QA requirements.
- Area Map camera presentation is now responsive: desktop retains zoom `1.0`,
  tablet-sized canvases use `0.9`, phone landscape uses `0.82`, and phone
  portrait uses `0.76`. An optional **Paparan Luas** setting reduces the current
  responsive zoom by `0.08`, bounded to `0.68–1.0`; **Paparan Biasa** restores
  the responsive default. This preference is deliberately session-only.
- Camera zoom never changes the world-space Vision Radius (`320` base, `+40`
  per rank), fog discovery, player collision, clue range, or navigation grid.
  Pointer targets are explicitly transformed through the active Phaser camera.
- `npm run camera:verify` reports representative canvas/zoom/worldView sizes and
  checks the safe zoom bounds plus Vision Rank 0/1/5 values.

### v0.13.0 — Visual / Art Pass Phase 1

- Establishes a centralized warm parchment, sandstone, teal, lapis, navy, and
  restrained-gold visual palette with accessible text-supported states.
- Gives Kampung Ilmu, Bazar Lama, and Perpustakaan Hikmah distinct ground and
  environmental treatments while preserving their dimensions, obstacles,
  clue positions, and pathfinding topology.
- Standardizes panel surfaces, headings, button hierarchy, focus treatment,
  touch target sizes, HUD grouping, tracked quest presentation, and World Map
  overlays.
- Introduces shared discovered/completed clue styling, a clearer temporary
  explorer marker, and slightly softer fog presentation without changing
  visibility or persistence rules.
- Uses only CSS and Phaser-generated shapes. Final artwork, character sprite
  animation, FFT-style travel animation, and a complete asset pipeline remain
  future work.
- Keeps save schema v3 and has not created a v0.13.0 release archive.

### v0.12.0 — Perpustakaan Hikmah / Area Expansion 3

- Makes Perpustakaan Hikmah the third playable World Map destination while
  keeping Bukit Pengintai locked.
- Adds a distinct library layout, three clues, and three data-driven quests
  through the existing `AreaDefinition` and `AreaRegistry` architecture.
- Expands each run to nine topic-correct question assignments: three unique
  Early Life, three First Revelation, and three Hijrah questions where the bank
  has sufficient alternatives.
- Keeps player position, fog, and clue state independent for Kampung Ilmu,
  Bazar Lama, and Perpustakaan Hikmah while quests, XP, upgrades, Hints, and
  Sirah Mastery remain global.
- Keeps save schema v3. Existing valid v3 saves are normalized on load by
  preserving Kampung/Bazar data and adding clean Library defaults without a
  structural migration.
- New Test Run resets run-specific state across all three areas but preserves
  RPG progression, upgrades, the XP ledger, and Sirah Mastery.
- Uses placeholder geometry rather than final artwork, and this development
  version has not been archived yet.

### v0.11.1 — Tracked Quest UX and pathfinding patch

- Makes the tracked quest clearer with `★ DIJEJAK`, a World Map location
  indicator, and a compact Area Map progress summary.
- Adds shared 32-pixel grid A* pathfinding for mouse and touch movement in both
  Kampung Ilmu and Bazar Lama.
- Routes around collision obstacles, resolves blocked targets to a nearby safe
  point, and reduces unnecessary waypoints with collision-safe smoothing.
- Cancels automatic movement immediately when WASD, arrow keys, or modal panels
  take control.
- Keeps save schema v3, World Map travel timing, questions, quest content,
  rewards, Mastery rules, and both Area Map layouts unchanged.
- This development patch has not been archived yet.

### v0.11.0 — Bazar Lama / Multi-Area development

- Makes Bazar Lama the second playable World Map destination.
- Reuses one Area Map engine through centralized area definitions.
- Adds three Bazar clues and three data-driven quests using the existing bank.
- Adds independent position, fog, and clue state for both playable areas.
- Introduces save schema v3 with a v2→v3 migration.
- Perpustakaan Hikmah and Bukit Pengintai remain locked.
- Preserved as an immutable archived release.
- Backlog: when a visible FFT-style travelling character sprite is introduced,
  World Map travel should become distance-aware and show its walk/run animation
  along the route. The current placeholder marker timing remains unchanged.

### v0.10.0 — Sirah Mastery System development

- Adds best-score learning evidence for Early Life, First Revelation, and Hijrah.
- Adds responsive overall/topic Mastery and coverage presentation.
- Persists encounter quality and Mastery through save schema v2.
- Migrates valid v1 saves without inventing historical Mastery evidence.
- This development version has not been archived yet.

### v0.9.0 — Save & Persistence System development

- Saves progression, upgrades, quests, clues, questions, hints, map state,
  player position, and explored fog locally in the browser.
- Validates stored data before loading and safely falls back from corrupt or
  incompatible saves.
- Autosaves with a short delay and flushes pending state when the page is hidden.
- Adds a Bahasa Melayu confirmation flow to delete only Sirah Quest save data.
- No account, cloud synchronization, database, or v0.9.0 archive has been added.

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
