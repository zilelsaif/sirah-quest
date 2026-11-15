# v0.28.0 Pre-Beta Defect Register

Audit date: 2026-11-15. Confirmed runtime defects are separated from verification gaps and content risks.

## Confirmed issues

| ID | Severity | Reproduction | Expected | Actual / root cause | Systems | Status | Regression evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| V028-P3-001 | P3 | Create a save and inspect `appVersion`. | Save metadata identifies the development build that wrote it. | It reported `0.15.0`; `SAVE_APP_VERSION` had not been synchronized since v0.15.0. Schema and load behavior were unaffected. | Save metadata, `src/game/save/config.ts` | Fixed: set to `0.28.0`; no schema or key change. | `prebeta:verify`, save suites, build |

Open confirmed issues: P0 **0**, P1 **0**, P2 **0**, P3 **0**. No crash, data loss, answer leak, blocked progression, or broken save/load was reproduced by automated inspection.

## Tracked limitations and risks (not confirmed defects)

| ID | Classification | Evidence / impact | Disposition |
| --- | --- | --- | --- |
| V028-QA-001 | Manual QA gap | No safely verified active browser/device URL was available during this audit. Visual layout, touch behavior, lifecycle memory, and complete playthrough acceptance cannot be concluded from source assertions alone. | Browser QA and physical-device QA pending owner testing. |
| V028-CONTENT-001 | Editorial risk | All 24 records remain `pending-editorial-review`; 22 have no source note and two contain review guidance rather than provenance. Automated integrity checks are not historical or religious approval. | Independent qualified editorial sign-off required. |
| V028-HIST-001 | Known historical exception | v0.26.1 contains early v0.27 Learning Progression functionality because commit `24535f05` combined the North Star patch, learning work, and version bump; archive commit `395795f` preserved that state. | Documented and immutable by owner decision; no runtime impact on v0.28.0. |

