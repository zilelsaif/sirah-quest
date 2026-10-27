import { useEffect, useRef, useState } from 'react'
import type Phaser from 'phaser'
import { createGame } from './bootstrap'
import type { CluePanelData } from './clues/types'
import type { AreaPlaySession } from './session/types'
import { TestScene } from './scenes/TestScene'
import type { EffectivePlayerStats } from './progression/types'
import type { AreaDefinition } from './areas/types'
import type { CameraViewMode } from './camera/cameraConfig'
import type { PlayerPosition } from './session/types'
import { ExplorationNavigation } from './navigation/ExplorationNavigation'

interface GameCanvasProps {
  area: AreaDefinition
  session: AreaPlaySession
  onSessionChange: (session: AreaPlaySession) => void
  onNewTestRun: () => void
  interfaceLocked: boolean
  effectiveStats: EffectivePlayerStats
  waypoint?: PlayerPosition
  onWaypointChange: (waypoint: PlayerPosition | undefined) => void
}

export function GameCanvas({
  area,
  session,
  onSessionChange,
  onNewTestRun,
  interfaceLocked,
  effectiveStats,
  waypoint,
  onWaypointChange,
}: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)
  const resetRequestedRef = useRef(false)
  const [openClue, setOpenClue] = useState<CluePanelData | null>(null)
  const [cameraViewMode, setCameraViewMode] = useState<CameraViewMode>('normal')
  const [isExplorationMapOpen, setIsExplorationMapOpen] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const game = createGame(
      container,
      setOpenClue,
      area,
      session,
      (nextSession) => {
        if (!resetRequestedRef.current) onSessionChange(nextSession)
      },
      effectiveStats,
      cameraViewMode,
    )
    gameRef.current = game
    resetRequestedRef.current = false

    return () => {
      game.destroy(true)
      gameRef.current = null
    }
  }, [area.id, session.questionRun.assignments, onSessionChange])

  const getScene = () =>
    gameRef.current?.scene.getScene('movement-prototype') as TestScene | undefined

  useEffect(() => {
    getScene()?.setInterfaceLocked(interfaceLocked || isExplorationMapOpen)
  }, [interfaceLocked, isExplorationMapOpen])

  useEffect(() => {
    getScene()?.setEffectiveStats(effectiveStats)
  }, [effectiveStats])

  useEffect(() => {
    getScene()?.setCameraViewMode(cameraViewMode)
  }, [cameraViewMode])

  const startNewTestRun = () => {
    resetRequestedRef.current = true
    setOpenClue(null)
    setIsExplorationMapOpen(false)
    onNewTestRun()
  }

  return (
    <div
      className="game-stage"
      data-question-ids={session.questionRun.assignments
        .map(({ question }) => question.id)
        .join(',')}
      data-selection-fallback={String(session.questionRun.usedFallback)}
      data-area-id={area.id}
    >
      {import.meta.env.DEV && (
        <div className="test-run-toolbar">
          <span>Development testing only</span>
          <button type="button" onClick={startNewTestRun}>
            New Test Run
          </button>
        </div>
      )}
      <div className="camera-toolbar" aria-label="Tetapan paparan kamera">
        <span>Zum kamera</span>
        <div>
          <button
            type="button"
            aria-pressed={cameraViewMode === 'normal'}
            onClick={() => setCameraViewMode('normal')}
          >
            Paparan Biasa
          </button>
          <button
            type="button"
            aria-pressed={cameraViewMode === 'wide'}
            onClick={() => setCameraViewMode('wide')}
          >
            Paparan Luas
          </button>
        </div>
        <small>Radius penglihatan: {effectiveStats.visionRadius} unit</small>
      </div>
      <div className="game-canvas-shell">
        <div
          ref={containerRef}
          className="game-canvas"
          aria-label="Sirah Quest exploration prototype"
          role="application"
        />
        <ExplorationNavigation
          area={area}
          session={session}
          visionRadius={effectiveStats.visionRadius}
          waypoint={waypoint}
          disabled={interfaceLocked || openClue !== null}
          onWaypointChange={onWaypointChange}
          onExpandedChange={setIsExplorationMapOpen}
        />
      </div>
      {openClue && (
        <div className="clue-overlay" role="presentation">
          <section
            className="clue-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="clue-title"
          >
            <p className="clue-panel__label">Sirah question · {openClue.title}</p>
            <h3 id="clue-title">{openClue.prompt.bm}</h3>
            <p className="clue-panel__translation" lang="en">
              {openClue.prompt.en}
            </p>

            <div className="clue-panel__options" aria-label="Answer choices">
              {openClue.options.map((option) => {
                const isCorrectReview =
                  openClue.state === 'completed' && option.id === openClue.correctOptionId

                return (
                  <button
                    key={option.id}
                    type="button"
                    disabled={
                      openClue.state === 'completed' ||
                      openClue.eliminatedOptionIds.includes(option.id)
                    }
                    className={`${isCorrectReview ? 'is-correct' : ''}${
                      openClue.eliminatedOptionIds.includes(option.id) ? ' is-eliminated' : ''
                    }`.trim() || undefined}
                    aria-label={`${option.text.bm} / ${option.text.en}${
                      isCorrectReview ? ' — correct answer' : ''
                    }`}
                    onClick={() => getScene()?.answerClue(option.id)}
                  >
                    <span>{option.text.bm}</span>
                    <small lang="en">{option.text.en}</small>
                  </button>
                )
              })}
            </div>

            {openClue.feedback && (
              <div
                className={`clue-panel__feedback is-${openClue.feedback.tone}`}
                role="status"
                aria-live="polite"
              >
                <strong>{openClue.feedback.message.bm}</strong>
                <span lang="en">{openClue.feedback.message.en}</span>
              </div>
            )}

            {openClue.explanation && (
              <div className="clue-panel__explanation">
                <h4>Pelajaran / Learning note</h4>
                <p>{openClue.explanation.bm}</p>
                <p lang="en">{openClue.explanation.en}</p>
              </div>
            )}

            <p className="clue-panel__review-note">
              Content status: {openClue.reviewStatus.replaceAll('-', ' ')}
            </p>

            <div className="clue-panel__actions">
              <button
                type="button"
                className="hint-button"
                disabled={
                  session.remainingHints <= 0 ||
                  !openClue.canUseHint ||
                  openClue.state === 'completed'
                }
                onClick={() => getScene()?.useHint()}
              >
                PETUNJUK ({session.remainingHints})
              </button>
              <button type="button" onClick={() => getScene()?.closeClue()}>
                Close
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
