# v0.29.0 Device Compatibility Defect Register

This continues, without replacing, `DEFECT_REGISTER_V028.md`.

## Confirmed defects

No new defect was confirmed through deterministic source, save-fixture, viewport, build, or regression verification. Open confirmed counts: P0 **0**, P1 **0**, P2 **0**, P3 **0**.

## Verification gaps and risks (not confirmed defects)

| ID | Classification | Evidence/impact | Status |
| --- | --- | --- | --- |
| V029-QA-001 | Device QA gap | Physical touch, rotation, browser chrome, soft keyboard, display contrast, and long-idle behavior were not executed on the named devices. | Owner QA pending; use `BETA_QA_MATRIX_V029.md`. |
| V029-QA-002 | Browser QA gap | Chromium and Firefox interactive walkthroughs were not executed against a safely verified active URL. | Pending; do not count as PASS. |
| V029-PERF-001 | Performance QA gap | Build sizes are measured, but no device FPS, memory, TTI, network waterfall, or thermal data exists. | Performance device QA pending. |
| V029-LIC-001 | Licensing risk | Repository evidence does not establish distribution rights for existing music and visual assets. | Licensing review pending. |
| V029-CONTENT-001 | Editorial risk | All 24 original questions remain pending editorial review. | Independent sign-off pending. |
| V029-HIST-001 | Known history exception | v0.26.1 contains early v0.27 work due to the documented combined commit. | Preserve; not a new regression. |

Any issue discovered during owner testing must record exact environment, reproduction, expected/actual behavior, severity, root cause when established, fix/deferral, and regression evidence before being promoted to a confirmed defect.

