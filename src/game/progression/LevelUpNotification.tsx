interface LevelUpNotificationProps {
  level: number
  levelsGained: number
  onClose: () => void
}

export function LevelUpNotification({
  level,
  levelsGained,
  onClose,
}: LevelUpNotificationProps) {
  return (
    <div className="level-up-overlay" role="presentation" onPointerDown={(event) => event.stopPropagation()}>
      <section className="level-up-panel" role="dialog" aria-modal="true" aria-labelledby="level-up-title">
        <p>TAHAP MENINGKAT!</p>
        <h2 id="level-up-title">Tahap {level}</h2>
        <p>
          Anda memperoleh {levelsGained} Mata Naik Taraf.
        </p>
        <small>Mata ini boleh digunakan dalam sistem naik taraf akan datang.</small>
        <button type="button" onClick={onClose}>Teruskan</button>
      </section>
    </div>
  )
}

