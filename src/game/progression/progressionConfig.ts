export const LEVEL_XP_THRESHOLDS = [0, 100, 220, 360, 520, 700, 900, 1120, 1360, 1620] as const

export const MAX_LEVEL = LEVEL_XP_THRESHOLDS.length

export const XP_REWARDS = {
  clueCompletion: 10,
  mainQuestCompletion: 60,
  sideQuestCompletion: 40,
} as const

