# v0.25.0 Final Gameplay Refinement

## NPC-only quest acceptance

The Quest Log is read-only for AVAILABLE quests. It retains progress, completed history, manual tracking and untracking. Acceptance is an explicit `ACCEPT_QUEST` dialogue choice processed by the existing Quest Manager; opening a log, area, World Object, clue, or NPC conversation never accepts automatically.

| NPC | Quest topics | Quest count |
| --- | --- | ---: |
| Penjaga Balai Ilmu | Early Life and First Revelation | 10 |
| Pengembara Bazar | Hijrah | 5 |

Both NPCs remain reachable in their existing areas. Previously accepted or completed quest states are preserved by schema-3 loading. The maximum of three active quests and independent manual tracking remain unchanged.

## Manual save slot

Autosave remains at `sirahQuest.save`. The independent manual slot is `sirahQuest.manualSave.v1`; it contains a version-1 envelope around the same validated schema-3 payload used by autosave. Metadata records timestamp, current location, player level, completed quest count, and completed clue count.

Saving never writes the autosave key. Existing manual data requires overwrite confirmation. Storage failures produce an error and do not claim success. Loading re-reads, migrates, and validates the stored payload before changing live state. Invalid or unsupported data is rejected without changing the active run or autosave. A successful load restores mode, progression, mastery, world location, quests, clues, assignments, fog, and player positions; closes incompatible UI; clears session-only tutorial/waypoints/World Object state; and forces a clean Phaser scene instance. The manual slot remains after loading.

Music state, open dialogs, tutorial state, temporary waypoints, and World Object toggle state are not included. New Test Run does not delete the manual slot. “Padam Semua Kemajuan” intentionally removes both autosave and manual save.

## Escape, focus, and touch

At application level the Escape priority is: manual confirmation, reset confirmation, Quest Log, Journal, upgrade panel, Mastery panel, level notification, then tutorial. The capture-phase handler closes only the first applicable layer and prevents lower listeners from closing another layer on the same keypress. GameCanvas continues to close its mutually exclusive dialogue, World Object, and exploration overlays through their existing handlers; World Map context menus retain their own guarded handler. Gameplay remains locked while modal application overlays are open.

Quest Log, Journal, and manual-save triggers retain focus for restoration after dismissal. Visible close/cancel actions remain available to touch users; save/load actions use a minimum 44px target.

## QA scenarios

Verify all 15 NPC offers, explicit acceptance, three-active capacity, tracking independence, pre-completed clues, Journal updates, fresh and v0.24/v0.25 saves, partial/completed quests, both map modes, repeated loads, refresh persistence, missing/corrupt/quota-failure handling, overlay Escape priority, focus restoration, movement locking, five required viewports, cross-area restoration, console errors, audio, and lazy Phaser loading.

Known limitation: one manual slot is provided. Browser and physical-device interaction QA remains an owner step when a safely verified test URL is unavailable.
