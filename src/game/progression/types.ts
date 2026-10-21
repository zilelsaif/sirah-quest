export interface PlayerProgressionState {
  totalXP: number
  level: number
  unspentUpgradePoints: number
  awardedXPEventIds: string[]
}

export interface XPRewardEvent {
  id: string
  amount: number
}

export interface ProgressionAwardResult {
  progression: PlayerProgressionState
  xpAwarded: number
  levelsGained: number
  wasAlreadyAwarded: boolean
}

export interface CurrentLevelProgress {
  currentXP: number
  requiredXP: number
  isMaxLevel: boolean
}

