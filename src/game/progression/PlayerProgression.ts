import { LEVEL_XP_THRESHOLDS, MAX_LEVEL } from './progressionConfig'
import type {
  CurrentLevelProgress,
  PlayerProgressionState,
  ProgressionAwardResult,
  XPRewardEvent,
} from './types'

export function getLevelForTotalXP(totalXP: number) {
  const safeXP = Math.max(0, totalXP)
  let level = 1

  LEVEL_XP_THRESHOLDS.forEach((threshold, index) => {
    if (safeXP >= threshold) level = index + 1
  })

  return Math.min(level, MAX_LEVEL)
}

export function createPlayerProgression(): PlayerProgressionState {
  return {
    totalXP: 0,
    level: 1,
    unspentUpgradePoints: 0,
    awardedXPEventIds: [],
  }
}

export function awardXP(
  current: PlayerProgressionState,
  event: XPRewardEvent,
): ProgressionAwardResult {
  if (current.awardedXPEventIds.includes(event.id)) {
    return {
      progression: current,
      xpAwarded: 0,
      levelsGained: 0,
      wasAlreadyAwarded: true,
    }
  }

  const xpAwarded = Math.max(0, event.amount)
  const totalXP = current.totalXP + xpAwarded
  const level = getLevelForTotalXP(totalXP)
  const levelsGained = Math.max(0, level - current.level)

  return {
    progression: {
      totalXP,
      level,
      unspentUpgradePoints: current.unspentUpgradePoints + levelsGained,
      awardedXPEventIds: [...current.awardedXPEventIds, event.id],
    },
    xpAwarded,
    levelsGained,
    wasAlreadyAwarded: false,
  }
}

export function applyXPRewards(
  current: PlayerProgressionState,
  events: readonly XPRewardEvent[],
) {
  return events.reduce(
    (progression, event) => awardXP(progression, event).progression,
    current,
  )
}

export function getCurrentLevelProgress(
  progression: PlayerProgressionState,
): CurrentLevelProgress {
  if (progression.level >= MAX_LEVEL) {
    return { currentXP: 0, requiredXP: 0, isMaxLevel: true }
  }

  const currentThreshold = LEVEL_XP_THRESHOLDS[progression.level - 1]
  const nextThreshold = LEVEL_XP_THRESHOLDS[progression.level]
  return {
    currentXP: progression.totalXP - currentThreshold,
    requiredXP: nextThreshold - currentThreshold,
    isMaxLevel: false,
  }
}

