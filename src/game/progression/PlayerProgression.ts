import { DEFAULT_PLAYER_STATS } from '../config/playerStats'
import {
  BASE_HINT_CAPACITY,
  HINT_CAPACITY_PER_RANK,
  LEVEL_XP_THRESHOLDS,
  MAX_LEVEL,
  MOVEMENT_SPEED_PERCENT_PER_RANK,
  UPGRADE_DEFINITIONS,
  VISION_RADIUS_PER_RANK,
} from './progressionConfig'
import type {
  CurrentLevelProgress,
  PlayerProgressionState,
  ProgressionAwardResult,
  XPRewardEvent,
  EffectivePlayerStats,
  UpgradeId,
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
    movementSpeedRank: 0,
    visionRadiusRank: 0,
    hintCapacityRank: 0,
  }
}

export function getUpgradeRank(progression: PlayerProgressionState, upgradeId: UpgradeId) {
  if (upgradeId === 'movement-speed') return progression.movementSpeedRank
  if (upgradeId === 'vision-radius') return progression.visionRadiusRank
  return progression.hintCapacityRank
}

export function purchaseUpgrade(
  current: PlayerProgressionState,
  upgradeId: UpgradeId,
): PlayerProgressionState {
  const definition = UPGRADE_DEFINITIONS.find((upgrade) => upgrade.id === upgradeId)
  if (!definition) return current

  const rank = getUpgradeRank(current, upgradeId)
  if (
    rank >= definition.maxRank ||
    current.unspentUpgradePoints < definition.costPerRank
  ) {
    return current
  }

  const rankKey = upgradeId === 'movement-speed'
    ? 'movementSpeedRank'
    : upgradeId === 'vision-radius'
      ? 'visionRadiusRank'
      : 'hintCapacityRank'

  return {
    ...current,
    unspentUpgradePoints: current.unspentUpgradePoints - definition.costPerRank,
    [rankKey]: rank + 1,
  }
}

export function getEffectivePlayerStats(
  progression: PlayerProgressionState,
): EffectivePlayerStats {
  return {
    movementSpeed:
      DEFAULT_PLAYER_STATS.movementSpeed *
      (1 + progression.movementSpeedRank * MOVEMENT_SPEED_PERCENT_PER_RANK / 100),
    visionRadius:
      DEFAULT_PLAYER_STATS.visionRadius +
      progression.visionRadiusRank * VISION_RADIUS_PER_RANK,
    maxHints:
      BASE_HINT_CAPACITY + progression.hintCapacityRank * HINT_CAPACITY_PER_RANK,
  }
}

export function getUpgradeEffectLabel(upgradeId: UpgradeId, rank: number) {
  const safeRank = Math.max(0, rank)
  if (upgradeId === 'movement-speed') {
    return `${100 + safeRank * MOVEMENT_SPEED_PERCENT_PER_RANK}%`
  }
  if (upgradeId === 'vision-radius') {
    return `${DEFAULT_PLAYER_STATS.visionRadius + safeRank * VISION_RADIUS_PER_RANK}px`
  }
  return `${BASE_HINT_CAPACITY + safeRank * HINT_CAPACITY_PER_RANK} setiap run`
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
      ...current,
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

