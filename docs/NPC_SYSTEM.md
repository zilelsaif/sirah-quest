# Sirah Quest NPC and Dialogue Foundation

Project version: v0.18.0

## Architecture

NPC definitions live in `src/game/npcs/npcData.ts`. Each record has a globally
stable ID, area ID, bilingual name and role, world position, placeholder visual
key, interaction radius and dialogue ID. `NpcManager` handles Phaser rendering,
visibility and proximity only. React owns the dialogue panel.

Dialogue definitions live in `src/game/dialogue/dialogueData.ts`. A dialogue
contains a stable start node and one or more nodes. Nodes contain bilingual text
and may point to the next node or offer response choices. Each choice uses a
stable ID and points to another node. `DialogueEngine.ts` validates and advances
the transient dialogue session.

## Interaction rules

- NPCs are visible only inside the player's current vision radius.
- `E` interacts with an in-range NPC. Pointer or touch can select the NPC or the
  prompt, and a touch-friendly React button appears while in range.
- When both an NPC and clue are nearby, the NPC has deterministic interaction
  priority. Clicking a specific clue still works when the NPC is not selected.
- Opening dialogue cancels movement, blocks Phaser pointer input and suppresses
  clue interaction. Escape closes it; Enter or Space advances linear lines.
- Dialogue reads no private data and does not change quests, XP, clues, questions,
  navigation targets or World Map access.

## Adding another NPC

1. Add a unique dialogue definition and stable node/choice IDs in
   `dialogueData.ts`.
2. Add an NPC definition in `npcData.ts` using an existing playable area ID.
3. Choose a walkable position away from spawns, clues and critical paths.
4. Run `npm run npcs:verify`, the existing verification scripts and
   `npm run build`.
5. Test keyboard, pointer and touch interaction at supported viewports.

## Known limitations

- NPC dialogue progress is session-transient and is not saved.
- NPCs do not roam, give quests, trade, fight or appear on navigation maps.
- Placeholder shape-based characters are not final artwork or animation rigs.
- Quest-aware contextual dialogue is prepared architecturally but not used yet.
