# World Map Context Menu and Background Music

This v0.23.0 polish pass adds an anchored location-action menu and a shared, gesture-driven background music player without changing gameplay rules or save schema 3.

## Contextual location menu

Selecting a World Map node or its label opens one compact menu next to that authoritative node. Selecting the same node closes it; selecting another replaces it. Escape, the explicit close button, an outside pointer action, and entering an Area Map also dismiss it. Keyboard focus returns to the selected node after Escape or the explicit close action.

The action is derived from existing location status, the current location and its existing connection set:

- Current playable location: **Masuk Kawasan**.
- Connected playable location: **Pergi ke Lokasi**.
- Locked location: **Terkunci**, disabled.
- Coming-soon location: **Akan Datang**, disabled.
- Unconnected location: **Laluan Tidak Tersedia**, disabled.

The menu calls the existing `travelTo`, `onTravel`, and `onEnterArea` flow. It does not move the player immediately or introduce another travel controller. After the existing travel timer completes and the current location changes, the open destination menu automatically presents **Masuk Kawasan**.

`clampContextMenuPosition` measures the selected node, menu and visible map viewport. It prefers the node's right side, flips left near the right edge and clamps both axes. The calculation reruns after map scrolling, Rantau/Lokasi changes, menu resize and browser resize. Pointer events inside the menu do not start map panning. The existing lower location-details panel remains available as secondary descriptive and quest information.

## Background music

The supplied audio inventory is:

| File | Size |
| --- | ---: |
| `sirahquestbg1.mp3` | 4,774,829 bytes |
| `sirahquestbg2.mp3` | 4,406,381 bytes |

`sirahquestbg2.mp3` is selected deterministically as the smaller bundled candidate. This selection is technical only and does not assert copyright or licensing approval; the owner must confirm usage rights before release.

`BackgroundMusicPlayer` is mounted once at the application root. It creates one `HTMLAudioElement`, uses the Vite-imported MP3 URL, loops at a default volume of `0.30`, and survives World Map/Area Map transitions. No playback is attempted on initial render. The player must press **Main** through a real user gesture. Rejected `play()` promises are handled and leave a ready/paused state.

Controls provide **Main/Jeda**, **Senyap/Nyahsenyap**, and a volume slider. Mute and volume are stored under the separate `sirahQuest.audio.preferences.v1` key; they never enter the gameplay save. A refresh never automatically starts playback. When the document becomes hidden, currently playing audio pauses. It resumes on visibility only if the player had started it and had not deliberately paused it. All audio and document listeners are removed on cleanup.

## Build and compatibility

Vite emits one hashed MP3 asset referenced by the main bundle. There is no external music request or release-script change. The contextual menu and player do not modify quests, NPCs, world objects, fog, navigation, questions, XP, Mastery, Journal, onboarding or saves.

Run `npm run map-music:verify` for targeted deterministic checks. Physical-device audio behavior, speaker balance and final music licensing remain owner QA.
