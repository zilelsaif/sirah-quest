# Content and Gameplay Expansion Pack 2 (v0.25.0)

Pack 2 adds optional educational content through the existing quest, clue, NPC, Journal, navigation, fog, and World Object systems. It does not add historical claims, questions, maps, NPCs, rewards, or persisted systems.

## Quest and clue manifest

| Quest ID | Topic | Clues |
| --- | --- | --- |
| `quest-nota-balai-ilmu-pack-2` | Early Life | `pack2-kampung-nota-balai` (Kampung Ilmu, 1200/1100); `pack2-bazar-nota-balai` (Bazar Lama, 330/880) |
| `quest-jejak-lembaran-pack-2` | First Revelation | `pack2-kampung-jejak-lembaran` (Kampung Ilmu, 2000/620); `pack2-library-jejak-lembaran` (Perpustakaan Hikmah, 1100/650) |
| `quest-catatan-musafir-pack-2` | Hijrah | `pack2-bazar-catatan-musafir` (Bazar Lama, 1660/620); `pack2-library-catatan-musafir` (Perpustakaan Hikmah, 700/1120) |

The authoritative run-scoped selector assigns one existing, topic-matched question to every clue. Pack 2 raises the run to 21 unique assignments: seven for each topic from the unchanged bank of eight per topic (24 total). The first 15 clue assignment positions remain unchanged and the six Pack 2 clues are appended.

## World Object context

Context is visible only while its associated quest is active. Papan Makluman supports Nota Balai Ilmu, Rak Rujukan supports Jejak Lembaran, and Papan Arah Bazar supports Catatan Musafir. Peti Peralatan, Peti Dagangan, and Lampu Bacaan retain their existing toggle-only behavior without quest context. Context cannot accept, track, complete, or reward a quest and discloses no clue coordinates or answers.

## NPC associations

Penjaga Balai Ilmu offers Nota Balai Ilmu and Jejak Lembaran. Pengembara Bazar offers Catatan Musafir. Acceptance remains explicit, tracking remains manual, and the three-active-quest limit is unchanged.

## Save and editorial boundaries

Save schema remains 3. Schema-3 v0.24 saves normalize missing Pack 2 quests and clues to AVAILABLE/hidden defaults while retaining existing progress. New Test Run resets all Pack 2 records through the same authoritative session factory. No question wording, options, answers, explanations, topic categories, or review metadata were changed. All added narrative is fictional and educationally neutral.

## Manual QA

At 1920x1080, 1366x768, 390x844, 844x390, and 1024x768: start a fresh run; confirm three quest offers; accept and manually track quests; discover and answer all six clues across areas; inspect the three contextual objects before, during, and after their quests; verify toggle objects retain state; verify Journal progress and knowledge entries; verify hidden clues stay absent from map/compass; save/reload; test music and scene loading; inspect console errors and horizontal overflow.
