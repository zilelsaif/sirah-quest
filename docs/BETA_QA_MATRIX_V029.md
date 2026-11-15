# v0.29.0 Owner Device QA Matrix

Record exact device model, OS, browser/version, device-pixel ratio, orientation, and usable CSS viewport from the tested browser. Do not substitute marketing specifications for observed values.

## Result matrix

| Device/environment | Browser/version | Portrait viewport | Landscape viewport | Input | Result | Notes/evidence |
| --- | --- | --- | --- | --- | --- | --- |
| Kyocera Torque | To record | To record | To record | Physical touch | PENDING | |
| Samsung Galaxy Tab Active 3 | To record | To record | To record | Physical touch | PENDING | |
| HP ProBook 440 G9 | To record | To record | To record | Keyboard, mouse/touchpad | PENDING | |
| Chromium desktop | To record | N/A | To record | Keyboard, mouse | PENDING | |
| Firefox desktop | To record | N/A | To record | Keyboard, mouse | PENDING | |

## Concise acceptance checklist

For each available device:

1. Clear only test data, open the deployed/test URL, record browser console errors, and start a New Test Run.
2. Confirm Main Menu, World Map, all three Area Maps, return navigation, and refresh restoration.
3. Move with touch or keyboard. Confirm page does not scroll over the game, pointer targets do not stick, and opening a modal immediately stops movement.
4. Verify interaction priority with nearby NPC, clue, and object: NPC > Clue > World Object/Landmark.
5. Open/close Dialogue, Quest Log, Journal, Mastery, Ulang Kaji, Mini Map, clue answers, object panel, save/load confirmations, tutorial, and music controls repeatedly.
6. Confirm every control is comfortably tappable, text wraps, no horizontal page overflow occurs, focus remains visible on keyboard, Escape closes one layer, and focus returns sensibly.
7. Rotate portrait → landscape → portrait while on World Map, Area Map, and with a panel open. Confirm canvas/camera resize, player remains reachable, HUD controls remain visible, and no reset or duplicate response occurs.
8. Check North Star is symbol-only at top-left, Mini Map top-right, and Quest Compass bottom-left without collisions.
9. Accept/track a quest through its NPC, discover a clue, submit incorrect then correct answers, finish a quest, inspect/toggle an object, and discover a landmark.
10. Verify Journal and Mastery show only earned records. Ulang Kaji must exclude assigned-only questions, reveal no answer before submission, award no XP, and change no quest/clue/Mastery state.
11. Manual-save, progress further, then manually load and confirm deliberate rollback. Refresh and confirm autosave restoration. Background/resume and tab switching must not lose persisted progress when storage survives.
12. Test mute/play/volume, tab hidden/visible behavior, and confirm audio begins only after pressing Main.
13. Leave an Area session idle for a practical test interval, repeat Area/World transitions and panels, then note responsiveness, duplicated audio/input, console errors, or observable growth. Do not diagnose a leak without repeatable evidence.
14. Record PASS/FAIL per device plus screenshots, console output, exact reproduction steps, expected/actual results, and whether the issue blocks beta.

## Required manual gates

- Android Chrome physical touch and rotation: **PENDING**
- Windows desktop keyboard/mouse: **PENDING**
- Chromium desktop browser walkthrough: **PENDING**
- Firefox desktop walkthrough: **PENDING**
- Performance profiling on physical devices: **PENDING**
- Asset distribution-rights evidence: **PENDING**

