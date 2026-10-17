import { useEffect, useRef, useState } from 'react'
import type Phaser from 'phaser'
import { createGame } from './bootstrap'
import type { CluePanelData } from './clues/types'
import { TestScene } from './scenes/TestScene'

export function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)
  const [openClue, setOpenClue] = useState<CluePanelData | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const game = createGame(container, setOpenClue)
    gameRef.current = game

    return () => {
      game.destroy(true)
      gameRef.current = null
    }
  }, [])

  const getScene = () => gameRef.current?.scene.getScene('movement-prototype') as TestScene | undefined

  return (
    <div className="game-stage">
      <div
        ref={containerRef}
        className="game-canvas"
        aria-label="Sirah Quest exploration prototype"
        role="application"
      />
      {openClue && (
        <div className="clue-overlay" role="presentation">
          <section className="clue-panel" role="dialog" aria-modal="true" aria-labelledby="clue-title">
            <p className="clue-panel__label">Placeholder clue</p>
            <h3 id="clue-title">{openClue.title}</h3>
            <p>{openClue.text}</p>
            <div className="clue-panel__actions">
              <button type="button" onClick={() => getScene()?.closeClue()}>
                Close
              </button>
              <button
                type="button"
                className="clue-panel__complete"
                disabled={openClue.state === 'completed'}
                onClick={() => getScene()?.completeClue()}
              >
                {openClue.state === 'completed' ? 'Completed' : 'Mark as Found'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
