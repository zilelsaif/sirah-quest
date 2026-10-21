export const LEVEL_XP_THRESHOLDS = [0, 100, 220, 360, 520, 700, 900, 1120, 1360, 1620] as const

export const MAX_LEVEL = LEVEL_XP_THRESHOLDS.length

export const XP_REWARDS = {
  clueCompletion: 10,
  mainQuestCompletion: 60,
  sideQuestCompletion: 40,
} as const

export const UPGRADE_MAX_RANK = 5
export const UPGRADE_COST_PER_RANK = 1
export const MOVEMENT_SPEED_PERCENT_PER_RANK = 10
export const VISION_RADIUS_PER_RANK = 40
export const BASE_HINT_CAPACITY = 1
export const HINT_CAPACITY_PER_RANK = 1

export const UPGRADE_DEFINITIONS = [
  {
    id: 'movement-speed',
    nameBM: 'Kelajuan',
    nameEN: 'Movement Speed',
    descriptionBM: 'Bergerak lebih pantas ketika meneroka Area Map.',
    descriptionEN: 'Move faster while exploring an Area Map.',
    maxRank: UPGRADE_MAX_RANK,
    costPerRank: UPGRADE_COST_PER_RANK,
    effect: { type: 'base-percentage', amountPerRank: MOVEMENT_SPEED_PERCENT_PER_RANK },
  },
  {
    id: 'vision-radius',
    nameBM: 'Penglihatan',
    nameEN: 'Vision Radius',
    descriptionBM: 'Luaskan kawasan yang kelihatan dalam kabus.',
    descriptionEN: 'Expand the visible area within the fog.',
    maxRank: UPGRADE_MAX_RANK,
    costPerRank: UPGRADE_COST_PER_RANK,
    effect: { type: 'flat-pixels', amountPerRank: VISION_RADIUS_PER_RANK },
  },
  {
    id: 'hint-capacity',
    nameBM: 'Petunjuk',
    nameEN: 'Hint Capacity',
    descriptionBM: 'Tambah bilangan Petunjuk yang tersedia setiap run.',
    descriptionEN: 'Increase the number of Hints available each run.',
    maxRank: UPGRADE_MAX_RANK,
    costPerRank: UPGRADE_COST_PER_RANK,
    effect: { type: 'flat-capacity', amountPerRank: HINT_CAPACITY_PER_RANK },
  },
] as const

