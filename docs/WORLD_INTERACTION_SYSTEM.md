# World Interaction System

Version 0.23.0 adds a reusable, session-only environment interaction layer to the three playable Area Maps. It does not change quests, questions, learning progression, rewards, save payloads, fog calculations, navigation, or collision geometry.

## Architecture

- `worldObjectData.ts` contains declarative, bilingual definitions and placements.
- `worldObjectRules.ts` contains pure proximity, toggle, cooldown, and initial-session rules.
- `WorldObjectManager.ts` owns Phaser visibility, lightweight shapes, affordances, pointer validation, and visual state.
- `WorldObjectPanel.tsx` owns the accessible React INSPECT dialog.
- `App.tsx` owns one non-persisted `WorldObjectSessionState` shared across Area Map and World Map transitions.
- `TestScene.ts` coordinates input priority and locks movement while the INSPECT dialog is open.

## Data schema

Every `WorldObjectDefinition` has a globally unique `id`, `areaId`, bilingual name and description, `position`, `visualKey`, `interactionType`, `interactionRadius`, and `initialState`. Supported interaction types are `INSPECT` and `TOGGLE`. Current states are `IDLE`, `CLOSED`, `OPEN`, `OFF`, and `ON`.

## Placements

| Area | Object | Type | Position | Initial state |
| --- | --- | --- | ---: | --- |
| Kampung Ilmu | Papan Makluman | INSPECT | 1060, 360 | IDLE |
| Kampung Ilmu | Peti Peralatan | TOGGLE | 670, 1040 | CLOSED |
| Bazar Lama | Papan Arah Bazar | INSPECT | 970, 570 | IDLE |
| Bazar Lama | Peti Dagangan | TOGGLE | 1510, 1090 | CLOSED |
| Perpustakaan Hikmah | Rak Rujukan | INSPECT | 780, 650 | IDLE |
| Perpustakaan Hikmah | Lampu Bacaan | TOGGLE | 1280, 700 | OFF |

The deterministic verifier checks walkability, spawn reachability, and clearance from spawns, NPCs, and clues. Objects do not add collision and are kept off essential entrances and established critical markers.

## Interaction rules and priority

Desktop players approach and press `E`, or click an in-range object. Touch players can tap the object or use the 44px-plus `Interaksi` control. Every activation is revalidated against the object's radius. A 220ms guard and Phaser `JustDown` handling prevent held or repeated input from double-toggling.

When affordances overlap, the scene resolves interaction in this order:

1. NPC
2. Clue
3. World object

Opening an INSPECT panel locks movement and background interactions. Escape or `Tutup` closes it and restores focus. TOGGLE objects only change their own visual/session state and show localized feedback.

## Session and save behavior

Object state is held in App memory for the current run. It survives Area Map → World Map transitions and visits to other areas. `New Test Run` and the full reset restore all initial object states. A browser refresh may reset it. No localStorage key or save field is added, and `SAVE_SCHEMA_VERSION` remains 3.

## Fog and navigation safety

Phaser objects are visible and interactive only while inside the player's existing vision radius. The system does not modify fog discovery, vision radius, Mini Map, Exploration Map, Compass, waypoints, quest navigation, camera follow, or pathfinding. Object coordinates are not supplied to navigation UI.

## Adding an object

1. Add a typed definition to `WORLD_OBJECT_DEFINITIONS` with a new global ID.
2. Select an existing visual key and valid initial state for the interaction type.
3. Place it on a walkable, reachable point clear of spawns, NPCs, clues, obstacles, and essential routes.
4. Run `npm run world-objects:verify` and the complete existing verification suite.
5. Perform keyboard, pointer, touch, responsive, focus, and fog browser QA.

## Known limitations

- Visuals are original Phaser prototype shapes, not final art.
- Object states are deliberately not saved across refreshes.
- Objects have no collision, inventory, loot, rewards, buffs, quest progress, or map markers.
- Physical-device touch and performance testing remains owner QA.
