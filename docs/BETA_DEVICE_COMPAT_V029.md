# v0.29.0 Beta Device Compatibility

Audit date: 2026-11-15. This document records deterministic source/build evidence separately from owner browser and physical-device acceptance.

## Target and tested environments

Targets are Android phone, Android tablet, and Windows desktop/laptop. Owner devices named for future QA are Kyocera Torque, Samsung Galaxy Tab Active 3, and HP ProBook 440 G9. Their exact model variants, OS versions, browser versions, pixel ratios, and usable viewport sizes were not available from a verified runtime source and are intentionally not inferred.

Automated camera calculations passed at 1920×1080, 1366×768, 1024×768, 390×844, 844×390, 360×640, and 800×450. These are deterministic viewport inputs, not claims that a browser rendered every screen correctly.

| Environment | Evidence in this audit | Status |
| --- | --- | --- |
| Chromium desktop | Production build and source/viewport verification only | Browser QA pending |
| Firefox desktop | Not executed | Pending |
| Android Chrome | Not executed on a physical device | Pending |
| Kyocera Torque | Not connected/tested by Codex | Owner QA pending |
| Galaxy Tab Active 3 | Not connected/tested by Codex | Owner QA pending |
| HP ProBook 440 G9 | No verified interactive browser session | Owner QA pending |

## Responsive, input, and HUD findings

- Phaser uses `Phaser.Scale.RESIZE`; camera metrics are recomputed from the live scale dimensions.
- The scene subscribes once to Phaser resize and explicitly unsubscribes on shutdown. React destroys the Phaser game with `game.destroy(true)` on cleanup.
- The canvas suppresses browser touch gestures and overscroll. Pointer navigation uses Phaser coordinates transformed through the camera.
- Modal/interface locks disable movement, clear keyboard direction, and cancel pointer paths. Pointer interaction priority remains NPC, then Clue, then World Object/Landmark.
- Existing interactive component rules provide 44px minimum height for primary controls, map controls, save controls, dialogs, Journal, Review, and Mini Map actions. Physical touch ergonomics remain pending.
- Mini Map remains top-right, Quest Compass bottom-left, and the North Star top-left with safe-area offsets. North Star SVG contains no visible direction text and does not accept pointer input.
- Root horizontal overflow is hidden; modal panels use bounded dynamic viewport heights and scrolling. Landscape-specific rules exist for short viewports.

No reproducible input, orientation, HUD, or lifecycle defect was confirmed by automated inspection. Physical rotation, browser chrome resizing, keyboard appearance, real touch cancellation, and long-idle memory behavior require owner testing.

## Lifecycle and save resilience

Autosave is debounced and flushed best-effort on `visibilitychange` to hidden and `pagehide`, with listeners removed on cleanup. Audio pauses on hidden visibility, conditionally resumes, and removes all media/visibility listeners on unmount. Review state is component-local and is not serialized.

Schema 3 fixtures cover autosave/manual restoration, deliberate rollback, older schema-3 payloads, missing optional landmark data, unknown/duplicate identifiers, malformed data, read failure, write/quota failure, XP/level, quests, clues, Mastery, assignments, fog, position, and landmarks. Browser process eviction is outside the supported lifecycle; restoration depends on surviving local browser storage and is not cross-device synchronization.

## Accessibility and bilingual findings

Keyboard Escape priority, focus restoration, visible focus styles, reduced-motion rules, accessible modal roles, and North Star label are covered by source assertions. No question text, translation, answer, explanation, or editorial status changed. Static inspection cannot approve contrast under every physical display mode or decide whether intentional BM/EN supporting text is editorially optimal.

## Performance and licensing

The archived v0.28.0 reference is verified before comparison: initial JS 89,850 gzip bytes, ReviewPanel 1,460, Phaser/GameCanvas 335,577, CSS 10,530, audio 2,264,024 raw bytes, and World Map 603,684 raw bytes. Final v0.29.0 measurements are recorded in `BETA_READINESS_V029.md`.

No analytics, tracking pixel, account, advertising SDK, telemetry, cloud-save service, or dependency was added. Repository evidence reviewed during this audit does not establish distribution rights for the music and visual assets.

**LICENSING REVIEW: PENDING**

