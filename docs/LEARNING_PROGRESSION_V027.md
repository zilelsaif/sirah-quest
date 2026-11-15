# v0.27.0 Learning Progression and Feedback

## Learning Feedback 2.0

The main clue flow still validates answers through `ClueManager` and preserves its retry, hint, completion, XP and quest rules. Before an attempt there is no status, answer identity or explanation. An incorrect eligible option shows **Belum Tepat**, keeps the clue open and does not reveal the answer or explanation. A correct option shows **Betul**, exposes the existing verbatim explanation and provides **Teruskan**. Completed clues remain reviewable through the established interaction.

## Authoritative Mastery metrics

The dashboard separates three values per topic:

- **Petunjuk selesai**: completed clue states among the seven assigned clues for that topic in the current run.
- **Soalan dengan rekod skor terbaik**: question IDs with a positive saved `bestScore`, out of the eight-question source topic.
- **Mata terbaik**: the sum of authoritative best scores against the topic maximum, used for the existing percentage and Mastery band.

The current save model does not record every abandoned incorrect attempt. The UI therefore does not invent a general “attempted” count. Assigned-but-unanswered questions are not treated as completed. Mastery is gameplay progress, not editorial, religious or historical certification.

## Voluntary Ulang Kaji

Ulang Kaji opens from **Jurnal Ilmu** and is lazy-loaded. Eligibility comes only from positive authoritative Mastery records. Merely assigning a question to an unseen or unfinished clue does not unlock it. Topic buttons show how many questions are eligible; unavailable topics remain disabled.

The review engine reuses the original question bank and `selectQuestionsForRun`, including its validated option identities and shuffle behavior. It presents one question at a time, prevents duplicate submissions, displays **Betul** or **Belum Tepat**, and reveals the original explanation only after submission. Rapid Next taps are guarded. The final score is a modest session summary.

Review state lives only inside the mounted review panel. It does not modify or persist XP, quests, clues, assignments, Mastery/best scores, NPCs, landmarks or Journal history, and no storage key was added. Closing or reloading discards it.

## Save, Escape and accessibility

Save schema remains 3. Autosave, manual save/load, manual rollback and old v0.26 snapshots continue to restore authoritative gameplay and Mastery records; eligible review questions are reconstructed from that snapshot. Manual Load closes any open review layer.

The review modal sits above the Journal in the existing Escape priority and closes one layer per keypress, returning focus to the Ulang Kaji trigger. Background gameplay remains locked. Answer, topic, navigation and close controls have at least 44px targets, visible focus behavior and responsive single-column mobile layouts. Existing reduced-motion rules continue to apply.

## Editorial limitations and tradeoffs

No question wording, option, correct ID, explanation, topic or review status changed. Review explanations are displayed only for legitimately eligible questions and only after a review submission. Review results are deliberately session-only, so they cannot improve or reduce gameplay Mastery. The source save model proves completed/correct gameplay questions through best-score records but cannot reconstruct every abandoned incorrect attempt.

## QA

At 1920x1080, 1366x768, 390x844, 844x390 and 1024x768: verify correct and incorrect clue feedback, retry policy, explanation timing, topic eligibility after save/load rollback, review option feedback, duplicate-tap guards, summary/close behavior, Escape priority, focus restoration, Mastery labels, Journal consistency, touch sizing, overflow, console errors, audio and lazy loading. Physical-device QA remains an owner step.
