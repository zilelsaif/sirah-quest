# Sirah Quest Journal System

Project version: v0.20.0

## Architecture

`src/game/journal/journalSelectors.ts` contains pure, read-only transformations
from the existing area session, World Map session and Sirah Mastery state.
`JournalPanel.tsx` renders the resulting model. The Journal does not own or save
quest, clue, question, exploration or Mastery state.

The four visible sections are:

- **Kronik Misi** — active and completed quests, real objective progress,
  location and tracked status from Quest Manager state.
- **Jurnal Ilmu** — completed-question content grouped by the existing Early
  Life, First Revelation and Hijrah topics.
- **Rekod Penjelajahan** — visited areas, current location and aggregate
  discovered/completed clue counts.
- **Sirah Mastery** — the established topic score and coverage summaries.

## Data sources and spoiler prevention

Quest definitions remain in `questData.ts`; quest progress remains in the saved
quest session. Knowledge entries are produced only when a clue is genuinely
`completed`, using that clue's stable position in the authoritative question
run. Assigned but unfinished questions are never displayed.

The exploration selector exposes only aggregate counts from stored clue states
for visited areas. It does not return clue coordinates, hidden geometry or
locked-location details. Duplicate learned questions are removed by stable
question ID. Editorial review status is shown without claiming approval.

If an older normalized save records a completed clue but lacks enough question
assignment evidence, the Journal displays a neutral legacy note instead of
inventing a question, answer or explanation.

## Save compatibility

The Journal adds no saved fields. It is reconstructed whenever authoritative
state changes, so `SAVE_SCHEMA_VERSION` remains 3. Opening or closing it cannot
award XP, change Mastery, accept or track a quest, move the player, alter fog or
modify a clue.

## Extending the Journal

New quests automatically appear once their existing Quest Manager state is
active or completed. New reviewed questions appear only after they are assigned
and completed through normal clue gameplay. New playable areas appear in the
exploration record after their World Map location has legitimately been visited.

Run `npm run journal:verify` after changes to selector or panel behavior.

## Known limitations

- No timestamps or completion order are shown because current saves do not
  store reliable chronology.
- The Journal does not distinguish whether a quest was accepted through an NPC
  or Quest Log because both intentionally produce the same quest state.
- It shows aggregate exploration counts, not a second map or hidden locations.
- English content is retained in the model, but full interface language
  switching is not implemented yet.
