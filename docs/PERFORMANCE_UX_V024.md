# v0.24.0 Performance and Player Experience Report

## Baseline integrity

The audit began from released v0.23.0 on `main`, with HEAD matching `origin/main`, annotated tag `v0.23.0`, complete `releases/v0.23.0/`, save schema 3, 24 unchanged question records and six unchanged World Objects. Two pre-existing owner working-tree changes were preserved: the unused `sirahquestbg1.mp3` deletion and its backup-path `.gitignore` entry.

The chosen `sirahquestbg2.mp3` was already owner-optimized to 2,264,024 bytes at 96 kbps. It was not re-encoded during this work.

## Before measurements

An untouched v0.23.0 production build produced:

| Output | Size | Gzip |
| --- | ---: | ---: |
| Main JavaScript | 1,540.52 kB | 421.82 kB |
| CSS | 50.20 kB | 9.95 kB |
| World Map image | 603.68 kB | not reported by Vite |
| Music | 2,264.02 kB | not reported by Vite |

The HTML referenced one JavaScript and one CSS asset. The first World Map also uses the 603,684-byte map image. Exact browser-transferred bytes and runtime timings were unavailable because browser automation could not safely verify the active Windows browser URL; no such measurements are claimed.

The identified bottleneck was architectural: `App.tsx` statically imported `GameCanvas`, which imported Phaser and every Area-only subsystem into the first-load JavaScript even though the application starts on the React World Map. The root audio component also created an `Audio` element with metadata preload before the player requested music.

## Implemented optimizations

### Deferred Phaser Area runtime

`GameCanvas` is loaded with `React.lazy` and `Suspense` only after entering an Area Map. Phaser, the scene, fog, pathfinding, clues, NPCs, World Objects and Area navigation remain together in one natural deferred chunk. This is a lifecycle boundary, not artificial warning suppression.

### Deferred music initialization

The root music controls remain mounted across map transitions, but `new Audio()` now runs only inside `ensureAudio()` reached by the visible **Main** action. The MP3 uses `preload="none"`. Existing loop, mute, volume, user-intent, visibility pause/resume, preference storage and cleanup behavior remains intact.

### Honest loading feedback

The Area panel shows a lightweight BM status while the deferred module loads, followed by `Menyediakan peta kawasan…` until `TestScene.create()` finishes. The scene sends a real ready callback; there are no fake percentages or timers. The indicator animation is disabled by `prefers-reduced-motion`.

## After measurements

The optimized v0.24.0 build produced:

| Output | Size | Gzip | Change from baseline |
| --- | ---: | ---: | ---: |
| Initial main JavaScript | 284,100 bytes | 87.36 kB | −1,256.42 kB raw (about −81.6%) |
| Deferred Area/Phaser chunk | 1,257,965 bytes | 336.35 kB | loaded only on Area entry |
| CSS | 50,886 bytes | 10.10 kB | +0.68 kB for loading UI |
| World Map image | 603,684 bytes | — | unchanged |
| Music | 2,264,024 bytes | — | unchanged |

The optimized HTML still has only two direct asset references: the initial main JavaScript and CSS. The World Map image loads for the initial screen. The deferred Area chunk is requested only on Area entry, and the MP3 is not initialized until a user presses **Main**.

## Runtime and lifecycle audit

- One Phaser game is created per mounted Area canvas and destroyed through the existing React effect cleanup.
- Scene resize and manager cleanup paths remain registered once and removed on shutdown.
- The NPC, clue and World Object populations are small; replacing their clear per-frame proximity code with additional caching was not justified by measurable browser timings and was deliberately avoided.
- Fog, movement, camera, pathfinding, priority and React/Phaser session synchronization were not changed.
- No dependency was added.

## Mobile and accessibility

Existing deterministic checks cover the requested desktop, tablet, portrait and landscape camera layouts. The new loading surfaces fit the existing GameCanvas bounds, use BM text and status semantics, block no controls after readiness, and respect reduced motion. Existing context-menu clamping, touch targets, modal focus/input locking, Mini Map, Compass, audio controls and safe-area behavior remain unchanged.

Automated live-browser viewport QA remains pending under the URL-safety rule. Physical-device performance, audio buffering and touch testing remain manual QA.

## Compatibility and warnings

- Save schema remains 3; no gameplay key or migration was added.
- Audio preferences remain under `sirahQuest.audio.preferences.v1`.
- Quests, clues, XP, Mastery, Journal, NPC dialogue, World Map graph, fog and six World Objects are unchanged.
- Historical archives are not modified.
- Vite still reports a >500 kB advisory for the genuine deferred Phaser chunk. Further splitting was not attempted without runtime evidence because it would mainly conceal the warning rather than improve the first-load path.
