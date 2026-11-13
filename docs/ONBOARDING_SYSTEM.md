# Sirah Quest Onboarding System

Project version: v0.21.0

## State model

The onboarding controller is a small, data-driven observer in
`src/game/onboarding/tutorialController.ts`. Its status is one of
`NOT_STARTED`, `ACTIVE`, `COMPLETED` or `SKIPPED`. Completed stages use stable
IDs: `movement`, `npc-interaction`, `quest-guidance`, `exploration` and
`journal`.

Tutorial state is React session state only. It is not part of `SavePayload`,
does not add a storage key and does not change save schema 3. A browser refresh
therefore starts a fresh optional guide and immediately reconciles any accepted
quests or discovered clues restored from the authoritative save.

## Tutorial stages and triggers

1. **Pergerakan** observes a genuine player-position change emitted by the
   existing Phaser input/session path. WASD, arrows and pointer/touch movement
   all use this same signal.
2. **Interaksi NPC** completes when the existing Penjaga Balai Ilmu dialogue is
   successfully opened. Proximity and the existing E/pointer controls remain
   authoritative.
3. **Misi** reconciles against existing accepted quest IDs, including quests
   previously accepted through dialogue or Log Quest. It never accepts or
   tracks a quest.
4. **Penerokaan** reconciles when any authoritative clue state is `discovered`
   or `completed`. Hidden clue data is never passed to the tutorial UI.
5. **Jurnal Pengembara** completes when the existing Journal open handler runs.
   Journal selectors and content are unchanged.

Events may occur in any order. Completed step IDs are de-duplicated, and the
controller always presents the first remaining step. Reconciliation never
repeats quests, XP rewards, question events or Mastery updates.

## Skip, close and reopen

**Tutup** hides the compact panel without changing progress. **Langkau
Panduan** changes the session status to `SKIPPED` and leaves gameplay fully
available. The fixed **Panduan** button reopens help; a skipped guide resumes at
the first incomplete step. A New Test Run or full progress reset creates a new
session guide.

## Platform controls

Desktop guidance names WASD, arrow keys and E. Touch guidance names tap-to-move
and the existing large **Bercakap** button. Both platforms feed the same
authoritative movement and dialogue callbacks.

## Accessibility and input safety

The panel is non-modal and does not participate in `isInterfaceLocked`, so it
does not disable movement, map travel or normal controls. All actions have a
minimum 44px target and shared `:focus-visible` treatment. Escape closes the
panel. Responsive bounds, internal scrolling, safe-area offsets and reduced-
motion rules prevent the guide from requiring hover or overflowing the page.

## Save compatibility

No save type, validation, migration, field or key is added. Existing v1→v2→v3
migration and v3 normalization are unchanged. Tutorial activity cannot change
XP, upgrades, quest objectives, tracking, clues, answers, Mastery or unlocks.

## Known limitations

- Tutorial completion is intentionally not remembered after a browser refresh.
- Quest guidance considers an accepted quest sufficient; tracking remains an
  optional player choice and is never changed automatically.
- The panel currently presents Bahasa Melayu. English strings are retained in
  tutorial data for future language switching.
- The guide observes a session; it does not provide scripted NPC movement,
  arrows to hidden clues or a mandatory linear tutorial mode.

Run `npm run onboarding:verify` after onboarding changes.
