# v0.29.0 Beta Readiness

Audit date: 2026-11-15. Baseline v0.28.0 is the annotated, archived, locked release at `019a7a56d73078760a45b93b8d324d5160923014`.

## Gates

| Gate | Status | Evidence |
| --- | --- | --- |
| Repository baseline | PASS | Clean `main`, HEAD = `origin/main`, annotated v0.28.0 tag, complete archive, historical diff clean. |
| Locked gameplay/content | PASS | 15 quests, 21 clues, 24 unchanged questions, 3×8 topics, 3 maps, 6 objects, 6 landmarks. |
| Save compatibility | PASS | Schema 3, autosave/manual rollback, older fixtures, validation/failure cases, no new storage key. |
| Automated regression | PASS | 19/19 applicable package scripts passed after final edits. |
| Production build/security | PASS | TypeScript, Vite, archive-copy wrapper passed; production audit found 0 vulnerabilities. |
| Browser acceptance | PENDING | No safely verified active URL tested. |
| Physical-device acceptance | PENDING | Owner must test named devices. |
| Editorial approval | PENDING | All 24 records retain `pending-editorial-review`. |
| Asset licensing | PENDING | Distribution-rights evidence not established in repository. |

## Scope and recommended next actions

v0.29.0 adds no gameplay/content, dependencies, analytics, accounts, telemetry, cloud save, maps, quests, clues, NPCs, objects, or landmarks. Version identity and save metadata are synchronized; schema remains 3. Automated compatibility coverage is added without changing game-world coordinates or area sizes.

Next actions for the owner:

1. Execute and complete `BETA_QA_MATRIX_V029.md` on the available Kyocera, Samsung, and HP devices.
2. Run explicit Chromium and Firefox walkthroughs and attach console/screenshot evidence.
3. Capture physical-device performance evidence without inventing thresholds after the fact.
4. Resolve or accept any reproduced P2/P3; stop beta for any open P0/P1.
5. Obtain and retain distribution-rights evidence for music and visual assets.
6. Obtain independent qualified editorial review for all 24 educational records.

Technical readiness may permit manual QA; it does not constitute device, licensing, or editorial sign-off.

## Production performance comparison

Both columns were measured using the same Node gzip method against the immutable v0.28.0 archive and the v0.29.0 production build.

| Asset | v0.28.0 | v0.29.0 | Difference |
| --- | ---: | ---: | ---: |
| Initial JS gzip | 89,873 B | 89,850 B | −23 B |
| ReviewPanel gzip | 1,458 B | 1,460 B | +2 B |
| Phaser/GameCanvas gzip | 335,576 B | 335,577 B | +1 B |
| CSS gzip | 10,530 B | 10,530 B | 0 B |
| Audio raw | 2,264,024 B | 2,264,024 B | 0 B |
| World Map raw | 603,684 B | 603,684 B | 0 B |

No bundle crossed the 10% review threshold. The existing Vite warning for the deferred Phaser chunk remains; Phaser is still dynamically imported.

## Readiness recommendation

- FINAL TECHNICAL VERDICT: **READY FOR MANUAL QA**
- DEVICE SIGN-OFF: **PENDING UNTIL OWNER QA**
- EDITORIAL SIGN-OFF: **PENDING**
- LICENSING REVIEW: **PENDING**

