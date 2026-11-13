# Quest and Learning Content Expansion — Pack 1

Project version: v0.22.0

## Quest manifest

| Quest ID | BM title | Topic | Objectives | Existing offer NPC |
| --- | --- | --- | ---: | --- |
| `quest-catatan-zaman-awal-pack-1` | Catatan Zaman Awal | Early Life | 2 | Penjaga Balai Ilmu |
| `quest-lembaran-ilmu-pack-1` | Lembaran Ilmu | First Revelation | 2 | Penjaga Balai Ilmu |
| `quest-jejak-perjalanan-pack-1` | Jejak Perjalanan | Hijrah | 2 | Pengembara Bazar |

All three are optional side quests with no prerequisites. They begin
`AVAILABLE`, require explicit acceptance and never alter the tracked quest.
They use the established side-quest XP value and stable reward-event IDs.

## Clue and area manifest

| Clue ID | Topic | Area | Position |
| --- | --- | --- | --- |
| `pack1-kampung-catatan-awal` | Early Life | Kampung Ilmu | 1450, 400 |
| `pack1-bazar-catatan-awal` | Early Life | Bazar Lama | 1560, 400 |
| `pack1-kampung-lembaran-ilmu` | First Revelation | Kampung Ilmu | 1450, 1150 |
| `pack1-library-lembaran-ilmu` | First Revelation | Perpustakaan Hikmah | 1660, 660 |
| `pack1-bazar-jejak-perjalanan` | Hijrah | Bazar Lama | 1780, 1180 |
| `pack1-library-jejak-perjalanan` | Hijrah | Perpustakaan Hikmah | 1660, 1120 |

The existing pathfinder verifies every placement from its area spawn. All clues
use the established 78-unit interaction radius, remain hidden until discovered,
and are omitted from Compass coordinates until both clue and fog evidence make
their position legitimately known.

## Question assignment

Pack 1 does not pin a historical question ID to a clue. Each clue supplies its
topic to the existing run selector. A run now requests five questions for each
topic: the three existing clues plus two Pack 1 clues. Each topic has eight
questions, so all 15 run assignments remain unique without exhausting a pool.
Option shuffling, previous-run avoidance, retry behavior, correct option IDs,
explanations and editorial statuses are unchanged.

## Progression and integration

Objectives may complete in either order. A clue completed before quest
acceptance is reconciled when the quest is accepted. Quest Manager retains the
three-active limit, explicit acceptance, independent progression, idempotent
completion, optional tracking and untracked completion.

Quest Log reads the expanded `QUEST_DATA`. Existing NPC dialogue menus are
generated declaratively from their quest-ID associations. Journal selectors
read the same Quest Manager and clue/question state, so active/completed quests,
objective counts and de-duplicated completed-question notes need no second data
store. Navigation exposes exact coordinates only after discovery and fog
evidence.

## Save compatibility

Save schema remains 3. During current-schema normalization, missing Pack 1
quests receive their default `AVAILABLE` records, existing area states receive
only missing hidden clue records, and six topic-correct assignments are appended
after the nine legacy assignments. Existing quest, clue, position, fog, XP,
Mastery, tracking and question data wins over defaults and is not reset.

New Test Run creates all 15 assignments, resets Pack 1 clues to hidden and Pack
1 quests to available using the same existing session factory.

## Editorial limitations

No new Sirah fact, source reference or question is introduced. Quest and clue
framing is deliberately fictional and neutral. All 24 questions retain their
existing editorial status. Run `npm run content-pack:verify` after changes.
