import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import ts from 'typescript'

const source = await readFile(resolve('src/game/questions/questionBank.ts'), 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
}).outputText
const { QUESTION_BANK } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`
)
const review = await readFile(resolve('docs/SIRAH_QUESTIONS_FOR_REVIEW.md'), 'utf8')

const failures = []
const occurrences = (value) => review.split(value).length - 1

if (QUESTION_BANK.length !== 24) failures.push(`Expected 24 source questions; found ${QUESTION_BANK.length}`)
if (new Set(QUESTION_BANK.map((question) => question.id)).size !== QUESTION_BANK.length) {
  failures.push('Source question IDs are not unique')
}

for (const question of QUESTION_BANK) {
  if (occurrences(`#### ${question.id}\n`) !== 1) failures.push(`${question.id}: missing or duplicated heading`)
  const requiredText = [
    question.prompt.bm,
    question.prompt.en,
    question.correctOptionId,
    question.explanation.bm,
    question.explanation.en,
    question.reviewStatus,
    question.sourceNotes ?? 'Reference to be verified',
    ...question.options.flatMap((option) => [option.id, option.text.bm, option.text.en]),
  ]
  requiredText.forEach((text) => {
    if (!review.includes(text)) failures.push(`${question.id}: missing exact text: ${text}`)
  })
}

const uncheckedBoxes = occurrences('- [ ] ')
const checkedBoxes = (review.match(/- \[[xX]\] /g) ?? []).length
if (uncheckedBoxes !== QUESTION_BANK.length * 7) {
  failures.push(`Expected ${QUESTION_BANK.length * 7} unchecked boxes; found ${uncheckedBoxes}`)
}
if (checkedBoxes !== 0) failures.push(`Found ${checkedBoxes} checked review boxes`)

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exit(1)
}

const topicCounts = Object.fromEntries(
  ['early-life', 'first-revelation', 'hijrah'].map((topicId) => [
    topicId,
    QUESTION_BANK.filter((question) => question.topicId === topicId).length,
  ]),
)
console.log(`Verified ${QUESTION_BANK.length} exact question records: ${JSON.stringify(topicCounts)}`)

