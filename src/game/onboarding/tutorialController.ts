import type { ClueSessionState } from '../session/types'

export type TutorialStatus = 'NOT_STARTED' | 'ACTIVE' | 'COMPLETED' | 'SKIPPED'
export type TutorialStepId = 'movement' | 'npc-interaction' | 'quest-guidance' | 'exploration' | 'journal'

export interface TutorialStep {
  id: TutorialStepId
  title: { bm: string; en: string }
  instruction: { bm: string; en: string }
}

export interface TutorialState {
  status: TutorialStatus
  completedStepIds: TutorialStepId[]
  activeStepId: TutorialStepId
}

export interface TutorialEvidence {
  acceptedQuestIds: readonly string[]
  clues: Record<string, ClueSessionState>
}

export const TUTORIAL_STEPS: readonly TutorialStep[] = [
  {
    id: 'movement',
    title: { bm: 'Pergerakan', en: 'Movement' },
    instruction: {
      bm: 'Masuk ke Peta Kawasan. Gunakan WASD atau kekunci anak panah pada desktop, atau ketik destinasi pada skrin sentuh.',
      en: 'Enter the Area Map. Use WASD or arrow keys on desktop, or tap a destination on a touch screen.',
    },
  },
  {
    id: 'npc-interaction',
    title: { bm: 'Interaksi NPC', en: 'NPC interaction' },
    instruction: {
      bm: 'Dekati Penjaga Balai Ilmu, kemudian tekan E atau pilih butang Bercakap.',
      en: 'Approach the Keeper of the Hall of Knowledge, then press E or choose the Talk button.',
    },
  },
  {
    id: 'quest-guidance',
    title: { bm: 'Misi', en: 'Quests' },
    instruction: {
      bm: 'Terima misi melalui perbualan NPC. Anda boleh memilih sendiri misi yang mahu dijejak dalam Log Quest.',
      en: 'Accept a quest through dialogue or the Quest Log. You may choose which quest to track.',
    },
  },
  {
    id: 'exploration',
    title: { bm: 'Penerokaan', en: 'Exploration' },
    instruction: {
      bm: 'Teroka kabus, gunakan Kompas dan Peta Kawasan, lalu dekati petunjuk yang ditemui. Lokasi tersembunyi tidak didedahkan.',
      en: 'Explore the fog, use the Compass and Area Map, and approach discovered clues. Hidden locations are not revealed.',
    },
  },
  {
    id: 'journal',
    title: { bm: 'Jurnal Pengembara', en: 'Adventure Journal' },
    instruction: {
      bm: 'Buka Jurnal untuk melihat kronik misi, catatan ilmu, penerokaan dan Penguasaan Sirah.',
      en: 'Open the Journal to review quest chronicles, knowledge notes, exploration and Sirah Mastery.',
    },
  },
]

const firstIncompleteStep = (completedStepIds: readonly TutorialStepId[]) =>
  TUTORIAL_STEPS.find((step) => !completedStepIds.includes(step.id))?.id ?? 'journal'

export function createTutorialState(): TutorialState {
  return { status: 'NOT_STARTED', completedStepIds: [], activeStepId: 'movement' }
}

export function startTutorial(state: TutorialState): TutorialState {
  if (state.status === 'COMPLETED') return state
  return { ...state, status: 'ACTIVE', activeStepId: firstIncompleteStep(state.completedStepIds) }
}

export function skipTutorial(state: TutorialState): TutorialState {
  return { ...state, status: 'SKIPPED' }
}

export function reopenTutorial(state: TutorialState): TutorialState {
  if (state.status !== 'SKIPPED') return state
  return { ...state, status: 'ACTIVE', activeStepId: firstIncompleteStep(state.completedStepIds) }
}

export function completeTutorialStep(state: TutorialState, stepId: TutorialStepId): TutorialState {
  if (state.status === 'SKIPPED' || state.status === 'COMPLETED' || state.completedStepIds.includes(stepId)) return state
  const completedStepIds = [...state.completedStepIds, stepId]
  const complete = completedStepIds.length === TUTORIAL_STEPS.length
  return {
    status: complete ? 'COMPLETED' : state.status,
    completedStepIds,
    activeStepId: firstIncompleteStep(completedStepIds),
  }
}

export function reconcileTutorial(state: TutorialState, evidence: TutorialEvidence): TutorialState {
  if (state.status === 'SKIPPED' || state.status === 'COMPLETED') return state
  let next = state
  if (evidence.acceptedQuestIds.length > 0) next = completeTutorialStep(next, 'quest-guidance')
  if (Object.values(evidence.clues).some((clue) => clue.state === 'discovered' || clue.state === 'completed')) {
    next = completeTutorialStep(next, 'exploration')
  }
  return next
}

export function getActiveTutorialStep(state: TutorialState) {
  return TUTORIAL_STEPS.find((step) => step.id === state.activeStepId) ?? TUTORIAL_STEPS[0]
}
