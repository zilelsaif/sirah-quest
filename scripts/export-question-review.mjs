import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import ts from 'typescript'

const sourcePath = resolve('src/game/questions/questionBank.ts')
const outputPath = resolve('docs/SIRAH_QUESTIONS_FOR_REVIEW.md')
const source = await readFile(sourcePath, 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
}).outputText
const { QUESTION_BANK } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`
)

const topics = [
  ['early-life', 'Early Life'],
  ['first-revelation', 'First Revelation'],
  ['hijrah', 'Hijrah'],
]
const statusCounts = QUESTION_BANK.reduce((counts, question) => {
  counts[question.reviewStatus] = (counts[question.reviewStatus] ?? 0) + 1
  return counts
}, {})

const lines = [
  '# Sirah Quest — Question Bank Editorial Review',
  '',
  '**Project version:** v0.6.0  ',
  '**Purpose:** Manual review by a qualified ustaz  ',
  '**Review status:** Pending editorial review',
  '',
  '> This is a review snapshot. `src/game/questions/questionBank.ts` remains the gameplay source of truth. Nothing in this document constitutes historical or religious approval.',
  '',
  '## Review Instructions',
  '',
  '1. Review every fact, correct answer, distractor, translation, religious term, and honorific.',
  '2. Verify facts against suitable sources. No citation should be inferred from this draft.',
  '3. Record corrections using the stable question ID and option ID.',
  '4. Keep every checkbox unchecked until a qualified reviewer has completed that check.',
  '5. Any later gameplay-content change requires a fresh review snapshot and review.',
  '',
  '## Question Summary by Topic',
  '',
  `- Total questions: **${QUESTION_BANK.length}**`,
  ...topics.map(([id, label]) => `- ${label}: **${QUESTION_BANK.filter((question) => question.topicId === id).length}**`),
  `- Pending editorial review: **${statusCounts['pending-editorial-review'] ?? 0}**`,
  `- Approved in source data: **${statusCounts.approved ?? 0}**`,
  `- Needs revision in source data: **${statusCounts['needs-revision'] ?? 0}**`,
  `- Questions requiring attention: **${QUESTION_BANK.filter((question) => question.reviewStatus !== 'approved').length}**`,
  '',
  'All questions require human verification before publication. Entries with source notes are additionally flagged below; entries without a source note display “Reference to be verified”.',
  '',
  '## Full Questions and Answers',
]

for (const [topicId, topicLabel] of topics) {
  lines.push('', `### ${topicLabel}`)

  for (const question of QUESTION_BANK.filter((item) => item.topicId === topicId)) {
    const correct = question.options.find((option) => option.id === question.correctOptionId)
    lines.push(
      '',
      `#### ${question.id}`,
      '',
      `- **Question ID:** \`${question.id}\``,
      `- **Topic/category:** ${topicLabel} (\`${question.topicId}\`)`,
      `- **Difficulty:** ${question.difficulty}`,
      `- **Editorial review status:** \`${question.reviewStatus}\``,
      `- **Source notes/reference:** ${question.sourceNotes ?? 'Reference to be verified'}`,
      '',
      `**Bahasa Melayu:** ${question.prompt.bm}`,
      '',
      `**English:** ${question.prompt.en}`,
      '',
      '**Answer options:**',
      '',
      '| Option ID | Bahasa Melayu | English |',
      '| --- | --- | --- |',
      ...question.options.map(
        (option) => `| \`${option.id}\` | ${option.text.bm} | ${option.text.en} |`,
      ),
      '',
      `- **Correct option ID:** \`${question.correctOptionId}\``,
      `- **Correct answer (BM):** ${correct?.text.bm ?? 'ERROR: option not found'}`,
      `- **Correct answer (EN):** ${correct?.text.en ?? 'ERROR: option not found'}`,
      '',
      '**Learning explanation (BM):**',
      '',
      question.explanation.bm,
      '',
      '**Learning explanation (EN):**',
      '',
      question.explanation.en,
      '',
      '**Editorial Review Checklist**',
      '',
      '- [ ] Historical facts verified',
      '- [ ] Correct answer verified',
      '- [ ] Incorrect answer choices reviewed',
      '- [ ] BM wording approved',
      '- [ ] English wording approved',
      '- [ ] Religious terminology reviewed',
      '- [ ] Approved for publication',
      '',
      '- **Reviewer / Ustaz:**',
      '- **Review date:**',
      '- **Verified source/reference:**',
      '- **Corrections or recommendations:**',
      '- **Final decision:** Approved / Revise / Rejected',
      '',
      '---',
    )
  }
}

lines.push(
  '',
  '## Editorial Review Checklist',
  '',
  'Use the per-question checklist above. Publication approval must be recorded separately for every stable question ID.',
  '',
  '## General Reviewer Feedback',
  '',
  '- **Reviewer / Ustaz:**',
  '- **Review date:**',
  '- **General sources consulted:**',
  '- **Overall corrections or recommendations:**',
  '- **Overall decision:** Approved / Revise / Rejected',
  '',
)

if (existsSync(outputPath)) {
  throw new Error(
    'Review document already exists. It was not overwritten because it may contain human review notes.',
  )
}

await writeFile(outputPath, `${lines.join('\n')}\n`, 'utf8')
console.log(`Exported ${QUESTION_BANK.length} questions to ${outputPath}`)

