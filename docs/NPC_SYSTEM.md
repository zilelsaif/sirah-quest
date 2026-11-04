# Sirah Quest NPC and Dialogue Foundation

Project version: v0.19.0

## Architecture

NPC definitions live in `src/game/npcs/npcData.ts`. Each record has a globally
stable ID, area ID, bilingual name and role, world position, placeholder visual
key, interaction radius, dialogue ID and associated quest IDs. `NpcManager` handles Phaser rendering,
visibility and proximity only. React owns the dialogue panel.

Dialogue definitions live in `src/game/dialogue/dialogueData.ts`. A dialogue
contains a stable start node and one or more nodes. Nodes contain bilingual text
and may point to the next node or offer response choices. Each choice uses a
stable ID and points to another node. `DialogueEngine.ts` validates and advances
the transient dialogue session.

Quest-aware choices remain declarative. A choice may contain a typed condition
(`QUEST_STATUS`, `OBJECTIVE_COMPLETED` or `QUEST_TRACKED`) and an optional typed
`ACCEPT_QUEST` action with a stable `questId`. The dialogue engine filters
choices from the current authoritative quest session; it does not store a
parallel quest status.

`QuestManager.acceptQuestWithResult()` validates the quest ID, availability,
prerequisites and configurable active-quest capacity. It then uses the same
progress reconciliation as Quest Log acceptance. Result codes allow clear
success, locked, stale-state or capacity feedback. Acceptance never changes the
tracked quest.

## Interaction rules

- NPCs are visible only inside the player's current vision radius.
- `E` interacts with an in-range NPC. Pointer or touch can select the NPC or the
  prompt, and a touch-friendly React button appears while in range.
- When both an NPC and clue are nearby, the NPC has deterministic interaction
  priority. Clicking a specific clue still works when the NPC is not selected.
- Opening dialogue cancels movement, blocks Phaser pointer input and suppresses
  clue interaction. Escape closes it; Enter or Space advances linear lines.
- Dialogue reads the shared quest state. A quest changes only after the player
  explicitly chooses **Terima Misi**, and the transaction goes through Quest
  Manager. Dialogue does not complete objectives, award rewards, reveal clue
  coordinates, change tracking or alter World Map access.

## Connecting an existing quest

1. Add the stable quest ID to the NPC's `questIds` in `npcData.ts`.
2. Add that ID to the NPC dialogue's quest list in `dialogueData.ts` so the
   reusable status choices and nodes are generated.
3. Keep titles, descriptions, prerequisites and objectives in `questData.ts`;
   do not duplicate authoritative quest content in NPC data.
4. Run `npm run npc-quests:verify`, `npm run npcs:verify` and `npm run build`.

Penjaga Balai Ilmu offers **Jejak Permulaan** and **Rahsia Wahyu Pertama**.
Pengembara Bazar offers **Perjalanan Hijrah**; its objective stays in Kampung
Ilmu and no hidden clue position is disclosed.

## Adding another NPC

1. Add a unique dialogue definition and stable node/choice IDs in
   `dialogueData.ts`.
2. Add an NPC definition in `npcData.ts` using an existing playable area ID.
3. Choose a walkable position away from spawns, clues and critical paths.
4. Run `npm run npcs:verify`, `npm run npc-quests:verify`, the existing verification scripts and
   `npm run build`.
5. Test keyboard, pointer and touch interaction at supported viewports.

## Known limitations

- NPC dialogue progress is session-transient and is not saved.
- NPCs do not roam, trade, fight or appear on navigation maps.
- Placeholder shape-based characters are not final artwork or animation rigs.
- Dialogue progression is transient; reopening an NPC re-evaluates current
  quest state from the beginning.
- Only explicit acceptance is integrated. Rewards, completion and objective
  progression remain owned by existing clue and quest systems.
