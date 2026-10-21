import {
  getEffectivePlayerStats,
  getUpgradeEffectLabel,
  getUpgradeRank,
} from './PlayerProgression'
import { UPGRADE_DEFINITIONS } from './progressionConfig'
import type { PlayerProgressionState, UpgradeId } from './types'

interface UpgradePanelProps {
  progression: PlayerProgressionState
  onPurchase: (upgradeId: UpgradeId) => void
  onClose: () => void
  onGrantTestPoints: () => void
  onResetTestProgression: () => void
}

export function UpgradePanel({
  progression,
  onPurchase,
  onClose,
  onGrantTestPoints,
  onResetTestProgression,
}: UpgradePanelProps) {
  const effectiveStats = getEffectivePlayerStats(progression)

  return (
    <div className="upgrade-overlay" role="presentation" onPointerDown={(event) => event.stopPropagation()}>
      <section className="upgrade-panel" role="dialog" aria-modal="true" aria-labelledby="upgrade-title">
        <header className="upgrade-panel__header">
          <div>
            <p>SISTEM PEMAIN</p>
            <h2 id="upgrade-title">NAIK TARAF</h2>
            <strong>Mata Naik Taraf Tersedia: {progression.unspentUpgradePoints}</strong>
          </div>
          <button type="button" className="button-secondary" onClick={onClose}>Tutup</button>
        </header>

        <div className="upgrade-grid">
          {UPGRADE_DEFINITIONS.map((upgrade) => {
            const rank = getUpgradeRank(progression, upgrade.id)
            const isMaximum = rank >= upgrade.maxRank
            const canAfford = progression.unspentUpgradePoints >= upgrade.costPerRank
            return (
              <article className="upgrade-card" key={upgrade.id}>
                <p className="upgrade-card__eyebrow">{upgrade.nameEN}</p>
                <h3>{upgrade.nameBM.toUpperCase()}</h3>
                <p>{upgrade.descriptionBM}</p>
                <dl>
                  <div><dt>Rank</dt><dd>{rank} / {upgrade.maxRank}</dd></div>
                  <div><dt>Sekarang</dt><dd>{getUpgradeEffectLabel(upgrade.id, rank)}</dd></div>
                  <div><dt>Seterusnya</dt><dd>{isMaximum ? '—' : getUpgradeEffectLabel(upgrade.id, rank + 1)}</dd></div>
                  <div><dt>Kos</dt><dd>{isMaximum ? '—' : `${upgrade.costPerRank} Mata Naik Taraf`}</dd></div>
                </dl>
                <button
                  type="button"
                  disabled={isMaximum || !canAfford}
                  onClick={() => onPurchase(upgrade.id)}
                >
                  {isMaximum ? 'MAKSIMUM' : canAfford ? 'NAIK TARAF' : 'MATA TIDAK CUKUP'}
                </button>
              </article>
            )
          })}
        </div>

        {import.meta.env.DEV && (
          <aside className="upgrade-dev-tools">
            <strong>QA pembangunan sahaja</strong>
            <code>
              ranks={progression.movementSpeedRank}/{progression.visionRadiusRank}/{progression.hintCapacityRank}
              {' · '}speed={effectiveStats.movementSpeed}
              {' · '}vision={effectiveStats.visionRadius}
              {' · '}maxHints={effectiveStats.maxHints}
            </code>
            <div>
              <button type="button" onClick={onGrantTestPoints}>+3 Mata Ujian</button>
              <button type="button" onClick={onResetTestProgression}>Reset Progres Ujian</button>
            </div>
          </aside>
        )}
      </section>
    </div>
  )
}
