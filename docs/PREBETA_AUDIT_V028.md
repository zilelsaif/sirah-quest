# v0.28.0 Pre-Beta Stability and Content Audit

Audit date: 2026-11-15. Baseline: annotated v0.27.0 tag at `d9eeb6d9caf9dc1c880a95825a0c29b4d6251697`, equal to `origin/main` before audit changes.

## Pre-flight and locked scope

The repository was on `main`, clean, and synchronized with `origin/main`. Package and lock versions were 0.27.0. The annotated v0.27.0 tag existed at baseline. Its release archive contained `index.html`, CSS, initial JavaScript, deferred ReviewPanel, deferred Phaser/GameCanvas, audio, and World Map assets. `git fsck` and release-path diff checks reported no integrity problem.

Locked counts passed: 15 quests, 21 clues, 24 original questions (three topics, eight each), six World Objects, six landmarks, and three playable Area Maps. NPC-only acceptance, schema 3, manual save/load, autosave, Universal Escape, fog, symbol-only North Star, Learning Feedback 2.0, Mastery, Ulang Kaji, lazy Phaser, and deferred audio remain in place.

The known v0.26.1 identity discrepancy remains documented and untouched. It originated when commit `24535f05` combined the North Star patch with early v0.27 learning work/version identity; archive commit `395795f` then preserved it as v0.26.1. This is not treated as a new regression.

## Technical QA

Source and deterministic verifier inspection covered start/reset state, World/Area transitions, NPC acceptance, tracking, clues, answer submission and feedback, quest completion rules, objects, landmark persistence, Journal/Mastery/Review isolation, autosave/manual rollback, corrupt/unsupported saves, and main-menu reset. Phaser teardown calls `game.destroy(true)` and nulls the instance; audio listeners and visibility handling have cleanup paths. No duplicate listener, stale-state, softlock, navigation-loop, or partial-load defect was reproduced.

Save fixtures cover current and older schema-3 saves, optional landmark fields, unknown/duplicate/invalid landmark identifiers, malformed autosave/manual payloads, quota/write failure, and read failure. Failed reads return `unavailable` with null state; App applies manual state only after a second successful validation, then closes overlays and recreates the game instance. No storage key or schema was added. The sole confirmed issue was stale save `appVersion` metadata; it was corrected from 0.15.0 to 0.28.0.

Learning verification confirms correct/incorrect feedback, explanation only after completion, retry behavior, ignored duplicate review answers, authoritative best-score Mastery, answered-only eligibility, assigned-only locking, session-only review score, and no XP/Mastery/quest/clue/assignment mutation. Escape and focus restoration remain asserted.

## UI/UX and accessibility

Automated viewport calculations passed for 1920×1080, 1366×768, 768×1024, 390×844, 360×800, and 844×390. The requested 1024×768 tablet and physical rendering still require manual confirmation. Source checks cover modal Escape priority, focus restoration, reduced-motion CSS, responsive camera/canvas bounds, symbol-only SVG North Star with distinct tip and localized accessible label, top-left safe-area positioning, pointer transparency, and Mini Map/Quest Compass clearance.

This audit did not claim visual layout, touch-target, long-text wrapping, or language acceptance from static checks. Existing UI intentionally presents some BM content with supporting English text; whether any remaining mixed-language presentation is unintended requires browser/editorial review.

## Content QA and editorial approval

`CONTENT_AUDIT_V028.md` inventories all 24 records. IDs, topic mappings, correct-option references, option IDs, and bilingual explanations pass technical integrity. The question source is byte-identical to v0.27.0. No educational content or status changed.

Repository metadata does not provide independent provenance for 22 records; two records contain review guidance, not citations. Therefore automated PASS means structural integrity only.

**EDITORIAL SIGN-OFF: PENDING**

## Performance and security

The production build report is the authoritative post-change measurement. Comparison uses the archived v0.27.0 files as baseline. ReviewPanel and Phaser remain dynamic imports, audio remains `preload='none'` and is created only by the Main button, dependencies were not changed, and no new external link or network path was introduced. `npm audit --omit=dev` is required after the final build.

## Defects, readiness, and limitations

See `DEFECT_REGISTER_V028.md`. One P3 metadata issue was fixed; open confirmed P0/P1/P2/P3 counts are zero. Browser automation was not run because no active test URL was safely verified.

- BROWSER QA: **PENDING**
- PHYSICAL-DEVICE QA: **PENDING**
- EDITORIAL SIGN-OFF: **PENDING**
- TECHNICAL PRE-BETA RECOMMENDATION: contingent on final full regression, production build, audit, and diff checks recorded in the handoff report.

