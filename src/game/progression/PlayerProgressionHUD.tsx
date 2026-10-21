import { getCurrentLevelProgress } from './PlayerProgression'
import type { PlayerProgressionState } from './types'

interface PlayerProgressionHUDProps {
  progression: PlayerProgressionState
  remainingHints: number
  maxHints: number
}

export function PlayerProgressionHUD({
  progression,
  remainingHints,
  maxHints,
}: PlayerProgressionHUDProps) {
  const levelProgress = getCurrentLevelProgress(progression)
  const percentage = levelProgress.isMaxLevel
    ? 100
    : Math.min(100, (levelProgress.currentXP / levelProgress.requiredXP) * 100)

  return (
    <aside className="progression-hud" aria-label="Kemajuan pemain">
      <div className="progression-hud__summary">
        <strong>Tahap {progression.level}</strong>
        <span>
          {levelProgress.isMaxLevel
            ? 'TAHAP MAKSIMUM'
            : `${levelProgress.currentXP} / ${levelProgress.requiredXP} XP`}
        </span>
        <span>Mata Naik Taraf: {progression.unspentUpgradePoints}</span>
        <span>Petunjuk: {remainingHints} / {maxHints}</span>
      </div>
      <div
        className="progression-hud__bar"
        role="progressbar"
        aria-label="Kemajuan XP tahap semasa"
        aria-valuemin={0}
        aria-valuemax={levelProgress.isMaxLevel ? 100 : levelProgress.requiredXP}
        aria-valuenow={levelProgress.isMaxLevel ? 100 : levelProgress.currentXP}
      >
        <span style={{ width: `${percentage}%` }} />
      </div>
      <small>Gunakan Mata Naik Taraf untuk menguatkan statistik pemain.</small>
      {import.meta.env.DEV && (
        <code>
          totalXP={progression.totalXP} · events={progression.awardedXPEventIds.length}
        </code>
      )}
    </aside>
  )
}

