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
import type { QuestNavigationState } from './navigation/questNavigation'
import type { NpcDefinition } from './npcs/types'
import { DialoguePanel } from './dialogue/DialoguePanel'
import {
  advanceDialogue,
  chooseDialogueResponse,
  createDialogueSession,
  getDialogueChoice,
  getDialogueNode,
} from './dialogue/DialogueEngine'
import type { DialogueActionFeedback, DialogueSession } from './dialogue/types'
import type { QuestAcceptanceResult } from './quests/QuestManager'
import type { QuestSessionState } from './quests/types'

interface GameCanvasProps {
  area: AreaDefinition
  session: AreaPlaySession
  onSessionChange: (session: AreaPlaySession) => void
  onNewTestRun: () => void
  interfaceLocked: boolean
  effectiveStats: EffectivePlayerStats
  waypoint?: PlayerPosition
  onWaypointChange: (waypoint: PlayerPosition | undefined) => void
  questNavigation: QuestNavigationState
  quests: QuestSessionState
  onAcceptQuest: (questId: string) => QuestAcceptanceResult
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
  questNavigation,
  quests,
  onAcceptQuest,
}: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)
  const resetRequestedRef = useRef(false)
  const [openClue, setOpenClue] = useState<CluePanelData | null>(null)
  const [cameraViewMode, setCameraViewMode] = useState<CameraViewMode>('normal')
  const [isExplorationMapOpen, setIsExplorationMapOpen] = useState(false)
  const [nearbyNpc, setNearbyNpc] = useState<NpcDefinition | null>(null)
  const [openDialogue, setOpenDialogue] = useState<{
    npc: NpcDefinition
    session: DialogueSession
  } | null>(null)
  const [dialogueFeedback, setDialogueFeedback] = useState<DialogueActionFeedback | null>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

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
      setNearbyNpc,
      (npc) => {
        if (!npc) {
          setOpenDialogue(null)
          setDialogueFeedback(null)
          return
        }
        previousFocusRef.current = document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null
        setOpenDialogue({ npc, session: createDialogueSession(npc.dialogueId) })
        setDialogueFeedback(null)
      },
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
    getScene()?.setInterfaceLocked(interfaceLocked || isExplorationMapOpen || openDialogue !== null)
  }, [interfaceLocked, isExplorationMapOpen, openDialogue])

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
    setNearbyNpc(null)
    setOpenDialogue(null)
    setDialogueFeedback(null)
    onNewTestRun()
  }

  const closeDialogue = () => {
    getScene()?.closeNpcDialogue()
    setOpenDialogue(null)
    setDialogueFeedback(null)
    window.requestAnimationFrame(() => {
      const previous = previousFocusRef.current
      if (
        previous?.isConnected &&
        previous !== document.body &&
        previous !== document.documentElement
      ) previous.focus()
      else containerRef.current?.focus()
      previousFocusRef.current = null
    })
  }

  const advanceOpenDialogue = () => {
    if (!openDialogue) return
    const next = advanceDialogue(openDialogue.session)
    setDialogueFeedback(null)
    if (!next) closeDialogue()
    else setOpenDialogue({ ...openDialogue, session: next })
  }

  const chooseOpenDialogueResponse = (choiceId: string) => {
    if (!openDialogue) return
    const context = { quests }
    const choice = getDialogueChoice(openDialogue.session, choiceId, context)
    if (!choice) return
    if (choice.action?.type === 'ACCEPT_QUEST') {
      const result = onAcceptQuest(choice.action.questId)
      if (result.code === 'ACCEPTED') {
        setDialogueFeedback({
          code: result.code,
          tone: 'success',
          message: { bm: 'Misi berjaya diterima.', en: 'Quest accepted successfully.' },
        })
        setOpenDialogue({ ...openDialogue, session: { ...openDialogue.session, nodeId: choice.nextNodeId } })
        return
      }
      const message = result.code === 'ACTIVE_LIMIT_REACHED'
        ? { bm: 'Had tiga misi aktif telah dicapai. Selesaikan satu misi sebelum menerima yang lain.', en: 'The three-active-quest limit has been reached. Complete one before accepting another.' }
        : result.code === 'QUEST_LOCKED'
          ? { bm: 'Misi ini masih terkunci kerana keperluannya belum dipenuhi.', en: 'This quest is still locked because its requirements are unmet.' }
          : { bm: 'Keadaan misi telah berubah. Semak Log Quest atau mulakan semula perbualan.', en: 'The quest state has changed. Check the Quest Log or restart the conversation.' }
      setDialogueFeedback({ code: result.code, tone: 'warning', message })
      return
    }
    setDialogueFeedback(null)
    const next = chooseDialogueResponse(openDialogue.session, choiceId, context)
    if (next) setOpenDialogue({ ...openDialogue, session: next })
  }

  useEffect(() => {
    if (!openDialogue) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return
      if (event.key === 'Escape') {
        event.preventDefault()
        closeDialogue()
        return
      }
      const node = getDialogueNode(openDialogue.session)
      if ((event.key === 'Enter' || event.key === ' ') && !(node.choices?.length)) {
        event.preventDefault()
        advanceOpenDialogue()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [openDialogue])

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
          tabIndex={0}
        />
        <ExplorationNavigation
          area={area}
          session={session}
          visionRadius={effectiveStats.visionRadius}
          waypoint={waypoint}
          questNavigation={questNavigation}
          disabled={interfaceLocked || openClue !== null || openDialogue !== null}
          onWaypointChange={onWaypointChange}
          onExpandedChange={setIsExplorationMapOpen}
        />
        {nearbyNpc && !openDialogue && !openClue && !interfaceLocked && !isExplorationMapOpen && (
          <button
            type="button"
            className="npc-interact-button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => getScene()?.interactWithNpc()}
          >
            Bercakap · {nearbyNpc.nameBM}
          </button>
        )}
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
      {openDialogue && (
        <DialoguePanel
          npc={openDialogue.npc}
          session={openDialogue.session}
          questSession={quests}
          feedback={dialogueFeedback}
          onAdvance={advanceOpenDialogue}
          onChoose={chooseOpenDialogueResponse}
          onClose={closeDialogue}
        />
      )}
    </div>
  )
}
