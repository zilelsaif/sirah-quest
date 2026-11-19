import { useCallback, useEffect, useRef, useState } from 'react'
import type Phaser from 'phaser'
import { createGame } from './bootstrap'
import type { ClueOverlayData } from './clues/types'
import { ClueInspectionPanel } from './clues/ClueInspectionPanel'
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
import type { WorldObjectDefinition, WorldObjectPanelData, WorldObjectSessionState } from './worldObjects/types'
import { WorldObjectPanel } from './worldObjects/WorldObjectPanel'
import {
  FrameDiagnostics,
  FrameDiagnosticsOverlay,
  PERFORMANCE_MONITOR_INCLUDED,
} from './performance/FrameDiagnostics'
import type { DevelopmentRenderingConfig } from './performance/renderingConfig'

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
  onPlayerMoved: () => void
  onNpcDialogueOpen: (npcId: string) => void
  worldObjectState: WorldObjectSessionState
  onWorldObjectStateChange: (state: WorldObjectSessionState) => void
  discoveredLandmarkIds: readonly string[]
  onLandmarkDiscovered: (landmarkId: string) => void
  onOverlayStateChange: (open: boolean) => void
  cameraViewMode: CameraViewMode
  performanceMonitorEnabled: boolean
  renderingConfig: DevelopmentRenderingConfig
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
  onPlayerMoved,
  onNpcDialogueOpen,
  worldObjectState,
  onWorldObjectStateChange,
  discoveredLandmarkIds,
  onLandmarkDiscovered,
  onOverlayStateChange,
  cameraViewMode,
  performanceMonitorEnabled,
  renderingConfig,
}: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)
  const diagnosticsRef = useRef<FrameDiagnostics | null>(null)
  if (!diagnosticsRef.current) diagnosticsRef.current = new FrameDiagnostics()
  const resetRequestedRef = useRef(false)
  const [openClue, setOpenClue] = useState<ClueOverlayData | null>(null)
  const [selectedClueOptionId, setSelectedClueOptionId] = useState('')
  const [isExplorationMapOpen, setIsExplorationMapOpen] = useState(false)
  const [nearbyNpc, setNearbyNpc] = useState<NpcDefinition | null>(null)
  const [nearbyWorldObject, setNearbyWorldObject] = useState<WorldObjectDefinition | null>(null)
  const [openWorldObject, setOpenWorldObject] = useState<WorldObjectPanelData | null>(null)
  const [isSceneReady, setIsSceneReady] = useState(false)
  const [openDialogue, setOpenDialogue] = useState<{
    npc: NpcDefinition
    session: DialogueSession
  } | null>(null)
  const [dialogueFeedback, setDialogueFeedback] = useState<DialogueActionFeedback | null>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const previousClueFocusRef = useRef<HTMLElement | null>(null)
  const clueOverlayOpenRef = useRef(false)
  const lastPlayerPositionRef = useRef(session.playerPosition)
  const questsRef = useRef(quests)
  questsRef.current = quests
  useEffect(() => { diagnosticsRef.current?.recordReactCommit() })
  const recordMiniMapDraw = useCallback(() => diagnosticsRef.current?.recordMiniMapDraw(), [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let disposed = false
    setIsSceneReady(false)
    lastPlayerPositionRef.current = session.playerPosition

    const game = createGame(
      container,
      (clue) => {
        if (clue && !clueOverlayOpenRef.current) {
          previousClueFocusRef.current = document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null
          clueOverlayOpenRef.current = true
        }
        if (!clue && clueOverlayOpenRef.current) {
          clueOverlayOpenRef.current = false
          window.requestAnimationFrame(() => {
            const previous = previousClueFocusRef.current
            if (previous?.isConnected && previous !== document.body && previous !== document.documentElement) previous.focus()
            else containerRef.current?.focus()
            previousClueFocusRef.current = null
          })
        }
        setOpenClue(clue)
      },
      area,
      session,
      (nextSession) => {
        if (!disposed && !resetRequestedRef.current) {
          const previous = lastPlayerPositionRef.current
          if (nextSession.playerPosition.x !== previous.x || nextSession.playerPosition.y !== previous.y) {
            lastPlayerPositionRef.current = nextSession.playerPosition
            onPlayerMoved()
          }
          onSessionChange(nextSession)
        }
      },
      effectiveStats,
      cameraViewMode,
      renderingConfig,
      setNearbyNpc,
      (npc) => {
        if (disposed) return
        if (!npc) {
          setOpenDialogue(null)
          setDialogueFeedback(null)
          return
        }
        previousFocusRef.current = document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null
        setOpenDialogue({
          npc,
          session: createDialogueSession(npc.dialogueId, { quests: questsRef.current }),
        })
        setDialogueFeedback(null)
        onNpcDialogueOpen(npc.id)
      },
      worldObjectState,
      onWorldObjectStateChange,
      discoveredLandmarkIds,
      onLandmarkDiscovered,
      (object) => { if (!disposed) setNearbyWorldObject(object) },
      (object) => {
        if (disposed) return
        if (!object) {
          setOpenWorldObject(null)
          return
        }
        previousFocusRef.current = document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null
        setOpenWorldObject(object)
      },
      (sceneDiagnostics) => {
        if (disposed) return
        diagnosticsRef.current?.setSceneMetrics({
          sceneLoadMs: sceneDiagnostics.sceneLoadMs,
          displayObjectCount: sceneDiagnostics.displayObjectCount,
          activeMaskCount: sceneDiagnostics.activeMaskCount,
          textureCount: sceneDiagnostics.textureCount,
          renderLabel: `${sceneDiagnostics.renderModeUsed}/${sceneDiagnostics.fogEdgeMode}`,
          runtimeLabel: `${sceneDiagnostics.renderer} (${sceneDiagnostics.gpuRenderer}) · ${sceneDiagnostics.canvasPhysicalWidth}×${sceneDiagnostics.canvasPhysicalHeight} · DPR ${sceneDiagnostics.devicePixelRatio} · ${sceneDiagnostics.explorationStrategy} ${sceneDiagnostics.discoveryPointCount}pt/${sceneDiagnostics.exploredGeometryCommands}cmd · ${sceneDiagnostics.fogIsolationMode}`,
        })
        setIsSceneReady(true)
      },
    )
    const diagnostics = diagnosticsRef.current
    const recordFrame = (_time: number, delta: number) => diagnostics?.record(delta)
    const pauseDiagnostics = () => diagnostics?.pause()
    if (PERFORMANCE_MONITOR_INCLUDED) {
      game.events.on('step', recordFrame)
      document.addEventListener('visibilitychange', pauseDiagnostics)
    }
    gameRef.current = game
    resetRequestedRef.current = false

    return () => {
      // Phaser emits SHUTDOWN synchronously from destroy(). Ignore callbacks from
      // the retiring scene so it cannot overwrite a freshly restored save/area.
      disposed = true
      game.events.off('step', recordFrame)
      document.removeEventListener('visibilitychange', pauseDiagnostics)
      game.destroy(true)
      gameRef.current = null
    }
  }, [area.id, session.questionRun.assignments, onSessionChange, onPlayerMoved, onNpcDialogueOpen, onWorldObjectStateChange, renderingConfig.kampungRenderMode, renderingConfig.fogEdgeMode, renderingConfig.fogIsolationMode, renderingConfig.minimalScene, renderingConfig.syntheticDiscoveryPointCount])

  const getScene = () =>
    gameRef.current?.scene.getScene('movement-prototype') as TestScene | undefined

  useEffect(() => {
    onOverlayStateChange(openClue !== null || openDialogue !== null || openWorldObject !== null || isExplorationMapOpen)
    return () => onOverlayStateChange(false)
  }, [openClue, openDialogue, openWorldObject, isExplorationMapOpen, onOverlayStateChange])

  useEffect(() => {
    if (!openClue) return
    const closeClueOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.repeat) return
      event.preventDefault()
      getScene()?.closeClue()
    }
    window.addEventListener('keydown', closeClueOnEscape)
    return () => window.removeEventListener('keydown', closeClueOnEscape)
  }, [openClue])

  useEffect(() => { setSelectedClueOptionId('') }, [openClue?.id, openClue?.kind, openClue?.state])

  useEffect(() => {
    if (selectedClueOptionId && openClue?.kind === 'question' && openClue.eliminatedOptionIds.includes(selectedClueOptionId)) {
      setSelectedClueOptionId('')
    }
  }, [openClue, selectedClueOptionId])

  useEffect(() => {
    getScene()?.setInterfaceLocked(interfaceLocked || isExplorationMapOpen || openDialogue !== null || openWorldObject !== null)
  }, [interfaceLocked, isExplorationMapOpen, openDialogue, openWorldObject])

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
    setNearbyWorldObject(null)
    setOpenWorldObject(null)
    setOpenDialogue(null)
    setDialogueFeedback(null)
    onNewTestRun()
  }

  const submitClueAnswer = () => {
    if (!openClue || openClue.kind !== 'question' || openClue.state === 'completed' || !selectedClueOptionId || openClue.eliminatedOptionIds.includes(selectedClueOptionId)) return
    getScene()?.answerClue(selectedClueOptionId)
    setSelectedClueOptionId('')
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

  const closeWorldObject = () => {
    getScene()?.closeWorldObjectPanel()
    setOpenWorldObject(null)
    window.requestAnimationFrame(() => {
      const previous = previousFocusRef.current
      if (previous?.isConnected && previous !== document.body && previous !== document.documentElement) previous.focus()
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

  const openQuestion = openClue?.kind === 'question' ? openClue : null

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
      <div className="game-canvas-shell">
        {!isSceneReady && <div className="game-scene-loading" role="status">Menyediakan peta kawasan…</div>}
        <div
          ref={containerRef}
          className="game-canvas"
          aria-label="Sirah Quest exploration prototype"
          role="application"
          tabIndex={0}
        />
        {PERFORMANCE_MONITOR_INCLUDED && performanceMonitorEnabled && diagnosticsRef.current && (
          <FrameDiagnosticsOverlay diagnostics={diagnosticsRef.current} />
        )}
        <ExplorationNavigation
          area={area}
          session={session}
          visionRadius={effectiveStats.visionRadius}
          waypoint={waypoint}
          questNavigation={questNavigation}
          disabled={interfaceLocked || openClue !== null || openDialogue !== null || openWorldObject !== null}
          onWaypointChange={onWaypointChange}
          onExpandedChange={setIsExplorationMapOpen}
          disabledRendering={renderingConfig.miniMapDisabled}
          onMapRender={recordMiniMapDraw}
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
        {nearbyWorldObject && !nearbyNpc && !openDialogue && !openClue && !openWorldObject && !interfaceLocked && !isExplorationMapOpen && (
          <button
            type="button"
            className="world-object-interact-button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => getScene()?.interactWithWorldObject()}
          >
            Interaksi · {nearbyWorldObject.nameBM}
          </button>
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
        {openClue?.kind === 'inspection' && (
          <ClueInspectionPanel
            clue={openClue}
            onContinue={() => getScene()?.continueClueInspection()}
            onClose={() => getScene()?.closeClue()}
          />
        )}
      </div>
      {openQuestion && (
        <div className="clue-overlay" role="presentation">
          <section
            className="clue-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="clue-title"
          >
            <p className="clue-panel__label">Soalan Sirah · {openQuestion.title}</p>
            <h3 id="clue-title">{openQuestion.prompt.bm}</h3>
            <label className="clue-panel__answer-field">
              <span>Jawapan</span>
              <select
                value={openQuestion.state === 'completed' ? (openQuestion.correctOptionId ?? '') : selectedClueOptionId}
                disabled={openQuestion.state === 'completed'}
                onChange={(event) => setSelectedClueOptionId(event.target.value)}
              >
                <option value="">Pilih jawapan…</option>
                {openQuestion.options.map((option) => (
                  <option key={option.id} value={option.id} disabled={openQuestion.eliminatedOptionIds.includes(option.id)}>
                    {option.text.bm}{openQuestion.eliminatedOptionIds.includes(option.id) ? ' — disingkirkan' : ''}
                  </option>
                ))}
              </select>
            </label>

            <details className="clue-panel__english">
              <summary>English translation</summary>
              <p lang="en">{openQuestion.prompt.en}</p>
              <ol lang="en">{openQuestion.options.map((option) => <li key={option.id}>{option.text.en}</li>)}</ol>
            </details>

            {openQuestion.feedback && (
              <div
                className={`clue-panel__feedback is-${openQuestion.feedback.tone}`}
                role="status"
                aria-live="polite"
              >
                <strong>{openQuestion.feedback.message.bm}</strong>
                <span lang="en">{openQuestion.feedback.message.en}</span>
              </div>
            )}

            {openQuestion.explanation && (
              <div className="clue-panel__explanation">
                <h4>Pelajaran / Learning note</h4>
                <p>{openQuestion.explanation.bm}</p>
                <p lang="en">{openQuestion.explanation.en}</p>
              </div>
            )}

            <p className="clue-panel__review-note">
              Content status: {openQuestion.reviewStatus.replaceAll('-', ' ')}
            </p>

            <div className="clue-panel__actions">
              <button
                type="button"
                className="hint-button"
                disabled={
                  session.remainingHints <= 0 ||
                  !openQuestion.canUseHint ||
                  openQuestion.state === 'completed'
                }
                onClick={() => getScene()?.useHint()}
              >
                Petunjuk ({session.remainingHints})
              </button>
              <button
                type="button"
                className="clue-panel__answer-button"
                disabled={openQuestion.state === 'completed' || !selectedClueOptionId}
                onClick={submitClueAnswer}
              >
                Jawab
              </button>
              <button type="button" onClick={() => getScene()?.closeClue()}>
                {openQuestion.state === 'completed' ? 'Teruskan' : 'Tutup'}
              </button>
            </div>
          </section>
        </div>
      )}
      {openWorldObject && <WorldObjectPanel object={openWorldObject} quests={quests} onClose={closeWorldObject} />}
    </div>
  )
}
