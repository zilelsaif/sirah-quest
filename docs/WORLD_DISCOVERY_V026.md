# v0.26.0 World Discovery and Exploration

This update adds six optional, explicitly fictional landmarks through the existing World Object `INSPECT` path. Landmarks do not award XP, Mastery, currency, quest/clue completion, questions, or navigation targets.

## Landmark manifest

| ID | Area | Position | BM / EN | Visual |
| --- | --- | ---: | --- | --- |
| `landmark-kampung-telaga-lama` | Kampung Ilmu | 1300, 600 | Telaga Lama / Old Well | `old-well` |
| `landmark-kampung-pondok-bacaan` | Kampung Ilmu | 450, 1120 | Pondok Bacaan / Reading Hut | `reading-hut` |
| `landmark-bazar-gerbang-dagang` | Bazar Lama | 1650, 1050 | Gerbang Dagang / Trade Gate | `trade-gate` |
| `landmark-bazar-sudut-kafilah` | Bazar Lama | 2200, 1180 | Sudut Kafilah / Caravan Corner | `caravan-corner` |
| `landmark-library-meja-manuskrip` | Perpustakaan Hikmah | 1600, 950 | Meja Manuskrip / Manuscript Table | `manuscript-table` |
| `landmark-library-sudut-peta` | Perpustakaan Hikmah | 2140, 1130 | Sudut Peta / Map Corner | `map-corner` |

Each position is within map/camera bounds, collision-free, reachable through the existing Pathfinder, and separated by at least 100 world units from spawns, NPCs, 21 clues and the six original World Objects. Existing placements were not changed.

## Discovery rules and interaction

The existing interaction priority remains NPC, then clue, then World Object/landmark. Landmarks share one manager, one E/touch path, proximity validation, movement locking, focus behavior and Escape-close panel with World Objects. Their distinct teal/gold symbol treatment uses six visual keys. A landmark is visible only inside the manager’s existing vision gate. Inspection additionally validates the current area, fog/vision visibility and discovery radius.

The first eligible inspection appends the stable ID once and shows `Lokasi Ditemui: …`. Later inspections show the fictional description without repeating the notification or changing progression. Merely seeing a landmark does not discover it.

## Journal and spoiler protection

`Rekod Penjelajahan` displays an overall 0/6–6/6 count and 0/2–2/2 per area. Discovered entries show their BM name and fictional description. Unknown entries show `???` and `Belum ditemui.` The Journal model contains no landmark coordinates and does not expose clue locations or answers.

## Save strategy and compatibility

`AreaSessionState.discoveredLandmarkIds` is the sole authoritative store. It is serialized automatically inside the existing schema-3 autosave and manual-save payloads; no localStorage key was added. Area and World Map transitions reuse the same run state. New Test Run creates an empty array.

Current-schema normalization adds `[]` only when the property is absent, making v0.25 schema-3 saves backward compatible without losing other state. Validation requires a unique string array containing only the six canonical IDs. Unknown IDs, duplicates and invalid types reject the payload safely. Manual Load restores the snapshot’s set, including intentional rollback, and remounts the gameplay scene so no stale discovery notice survives.

## Performance

Landmark data/rendering stays behind the lazy `GameCanvas` boundary. Discovery writes occur only on a new eligible inspection, never per frame. No dependency, World Map node, audio controller or asset was added; the optimized 96 kbps MP3 remains unchanged.

## Manual QA

At 1920x1080, 1366x768, 390x844, 844x390 and 1024x768: inspect all landmarks with E and touch; confirm fog/vision gating; repeat inspections; review 0/6–6/6 Journal states; transition through all areas and World Map; verify autosave refresh; save, discover more, then manually load to confirm rollback; start a New Test Run; verify NPC-only quest acceptance, World Object toggles, Escape/focus, audio/loading, console errors and horizontal overflow. Physical Android QA remains an owner step.
