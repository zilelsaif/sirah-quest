export interface PlayerStats {
  movementSpeed: number
  visionRadius: number
}

export const DEFAULT_PLAYER_STATS: PlayerStats = {
  movementSpeed: 240,
  visionRadius: 320,
}
