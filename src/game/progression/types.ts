export interface PlayerProgressionState {
  totalXP: number
  level: number
  unspentUpgradePoints: number
  awardedXPEventIds: string[]
  movementSpeedRank: number
  visionRadiusRank: number
  hintCapacityRank: number
}

export type UpgradeId = 'movement-speed' | 'vision-radius' | 'hint-capacity'

export interface EffectivePlayerStats {
  movementSpeed: number
  visionRadius: number
  maxHints: number
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

