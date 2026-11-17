import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { LevelUpNotification } from './game/progression/LevelUpNotification'
import {
  applyXPRewards,
  createPlayerProgression,
  getEffectivePlayerStats,
  purchaseUpgrade,
} from './game/progression/PlayerProgression'
import { PlayerProgressionHUD } from './game/progression/PlayerProgressionHUD'
import { UpgradePanel } from './game/progression/UpgradePanel'
import { XP_REWARDS } from './game/progression/progressionConfig'
import type {
  UpgradeId,
  XPRewardEvent,
} from './game/progression/types'
import { QuestLog } from './game/quests/QuestLog'
import { QUEST_DATA } from './game/quests/questData'
import {
  acceptQuestWithResult,
  getQuestProgress,
  setTrackedQuest,
  syncQuestProgress,
} from './game/quests/QuestManager'
import { createAreaSession, getAllClueStates } from './game/session/createSession'
import type { AreaPlaySession, AreaSessionState, GameMode, PlayerPosition, WorldSessionState } from './game/session/types'
import { getWorldLocation, STARTING_LOCATION_ID, WORLD_LOCATIONS } from './world/locationData'
import { WorldMap } from './world/WorldMap'
import { SAVE_DEBOUNCE_MS } from './game/save/config'
import { clearSirahQuestStorage, loadGameSave, loadManualGame, saveGame, saveManualGame } from './game/save/SaveManager'
import type { ManualSaveLoadResult, PersistedGameState, PlayerSessionState, SaveLoadResult } from './game/save/types'
import { SirahMasteryPanel } from './game/mastery/SirahMasteryPanel'
import { calculateEncounterScore, createSirahMastery, recordQuestionMastery } from './game/mastery/SirahMastery'
import type { SirahMasteryState } from './game/mastery/types'
import { ALL_AREA_CLUES, getAreaDefinition, KAMPUNG_ILMU_AREA_ID } from './game/areas/areaRegistry'
import { resolveTrackedQuestNavigation } from './game/navigation/questNavigation'
import { JournalPanel } from './game/journal/JournalPanel'
import { selectJournalModel } from './game/journal/journalSelectors'
import { TutorialPanel } from './game/onboarding/TutorialPanel'
import {
  completeTutorialStep,
  createTutorialState,
  reconcileTutorial,
  reopenTutorial,
  skipTutorial,
  startTutorial,
} from './game/onboarding/tutorialController'
import { createWorldObjectSession } from './game/worldObjects/worldObjectRules'
import type { WorldObjectSessionState } from './game/worldObjects/types'
import { BackgroundMusicPlayer } from './game/audio/BackgroundMusicPlayer'
import { ImmersiveModeControl } from './game/ui/ImmersiveModeControl'
import type { ImmersiveMode } from './game/ui/ImmersiveModeControl'

const GameCanvas = lazy(() => import('./game/GameCanvas').then((module) => ({ default: module.GameCanvas })))
const ReviewPanel = lazy(() => import('./game/review/ReviewPanel').then((module) => ({ default: module.ReviewPanel })))

type PlayerSession = PlayerSessionState

function createFreshState(): PersistedGameState {
  const progression = createPlayerProgression()
  return {
    mode: 'WORLD_MAP',
    playerSession: {
      run: createAreaSession(getEffectivePlayerStats(progression).maxHints),
      progression,
    },
    worldSession: {
      currentLocationId: STARTING_LOCATION_ID,
      visitedLocationIds: [STARTING_LOCATION_ID],
      hasEnteredArea: false,
    },
    masteryState: createSirahMastery(),
  }
}

function collectCompletionRewards(
  previous: AreaSessionState,
  next: AreaSessionState,
): XPRewardEvent[] {
  const rewards: XPRewardEvent[] = []

  const previousClues = getAllClueStates(previous)
  Object.entries(getAllClueStates(next)).forEach(([clueId, clue]) => {
    if (clue.state === 'completed' && previousClues[clueId]?.state !== 'completed') {
      rewards.push({ id: `clue:${clueId}`, amount: XP_REWARDS.clueCompletion })
    }
  })

  QUEST_DATA.forEach((quest) => {
    if (
      next.quests.quests[quest.id]?.status === 'COMPLETED' &&
      previous.quests.quests[quest.id]?.status !== 'COMPLETED'
    ) {
      rewards.push({ id: `quest:${quest.id}`, amount: quest.completionXP })
    }
  })

  return rewards
}

function App() {
  const appShellRef = useRef<HTMLElement>(null)
  const [immersiveMode, setImmersiveMode] = useState<ImmersiveMode>('windowed')
  const [initialLoad] = useState<SaveLoadResult>(() => loadGameSave())
  const [initialState] = useState<PersistedGameState>(() => initialLoad.state ?? createFreshState())
  const [mode, setMode] = useState<GameMode>(initialState.mode)
  const [playerSession, setPlayerSession] = useState<PlayerSession>(initialState.playerSession)
  const [worldSession, setWorldSession] = useState<WorldSessionState>(initialState.worldSession)
  const [masteryState, setMasteryState] = useState<SirahMasteryState>(initialState.masteryState)
  const [saveMessage, setSaveMessage] = useState(initialLoad.message ?? '')
  const [saveBlocked, setSaveBlocked] = useState(initialLoad.status === 'incompatible')
  const [manualSave, setManualSave] = useState<ManualSaveLoadResult>(() => loadManualGame())
  const [manualDialog, setManualDialog] = useState<'overwrite' | 'load' | null>(null)
  const [manualMessage, setManualMessage] = useState('')
  const [gameInstanceKey, setGameInstanceKey] = useState(0)
  const [isGameOverlayOpen, setIsGameOverlayOpen] = useState(false)
  const [isWorldContextMenuOpen, setIsWorldContextMenuOpen] = useState(false)
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false)
  const latestSaveStateRef = useRef<PersistedGameState>(initialState)
  const [isQuestLogOpen, setIsQuestLogOpen] = useState(false)
  const [isUpgradePanelOpen, setIsUpgradePanelOpen] = useState(false)
  const [isMasteryPanelOpen, setIsMasteryPanelOpen] = useState(false)
  const [isJournalOpen, setIsJournalOpen] = useState(false)
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const [tutorialState, setTutorialState] = useState(createTutorialState)
  const [isTutorialOpen, setIsTutorialOpen] = useState(true)
  const [areaWaypoints, setAreaWaypoints] = useState<Record<string, PlayerPosition>>({})
  const [worldObjectState, setWorldObjectState] = useState<WorldObjectSessionState>(createWorldObjectSession)
  const [levelUpNotification, setLevelUpNotification] = useState<{
    level: number
    levelsGained: number
  } | null>(null)
  const previousLevelRef = useRef(playerSession.progression.level)
  const overlayTriggerRef = useRef<HTMLElement | null>(null)
  const manualCancelRef = useRef<HTMLButtonElement>(null)
  const areaSession = playerSession.run
  const allClues = useMemo(() => getAllClueStates(areaSession), [areaSession.areaStates])
  const currentAreaId = getWorldLocation(worldSession.currentLocationId)?.areaId ?? KAMPUNG_ILMU_AREA_ID
  const currentArea = getAreaDefinition(currentAreaId) ?? getAreaDefinition(KAMPUNG_ILMU_AREA_ID)
  const currentAreaState = areaSession.areaStates[currentArea.id]
  const currentAssignments = useMemo(() => currentArea.clues.map((clue) => {
    const index = ALL_AREA_CLUES.findIndex((candidate) => candidate.id === clue.id)
    return areaSession.questionRun.assignments[index]
  }), [areaSession.questionRun, currentArea])
  const playSession: AreaPlaySession = {
    areaId: currentArea.id,
    ...currentAreaState,
    questionRun: { assignments: currentAssignments, usedFallback: areaSession.questionRun.usedFallback },
    remainingHints: areaSession.remainingHints,
  }
  const effectiveStats = useMemo(
    () => getEffectivePlayerStats(playerSession.progression),
    [playerSession.progression],
  )
  const isInterfaceLocked =
    isQuestLogOpen || isUpgradePanelOpen || isMasteryPanelOpen || isJournalOpen || isReviewOpen || levelUpNotification !== null || isResetConfirmOpen || manualDialog !== null
  const journalModel = useMemo(
    () => selectJournalModel(areaSession, worldSession, masteryState),
    [areaSession, worldSession, masteryState],
  )
  const closeJournal = useCallback(() => setIsJournalOpen(false), [])
  const openJournal = useCallback(() => {
    overlayTriggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setIsJournalOpen(true)
    setTutorialState((current) => completeTutorialStep(current, 'journal'))
  }, [])
  const openQuestLog = useCallback(() => {
    overlayTriggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setIsQuestLogOpen(true)
  }, [])
  const restoreOverlayFocus = useCallback(() => {
    window.requestAnimationFrame(() => {
      if (overlayTriggerRef.current?.isConnected) overlayTriggerRef.current.focus()
      overlayTriggerRef.current = null
    })
  }, [])
  const recordPlayerMovement = useCallback(() => {
    setTutorialState((current) => completeTutorialStep(current, 'movement'))
  }, [])
  const recordNpcDialogue = useCallback((npcId: string) => {
    if (npcId === 'npc-penjaga-balai-ilmu') {
      setTutorialState((current) => completeTutorialStep(current, 'npc-interaction'))
    }
  }, [])
  const updateWorldObjectState = useCallback((next: WorldObjectSessionState) => {
    setWorldObjectState((current) => ({ ...current, ...next }))
  }, [])
  const recordLandmarkDiscovery = useCallback((landmarkId: string) => {
    setPlayerSession((current) => current.run.discoveredLandmarkIds.includes(landmarkId) ? current : ({
      ...current,
      run: { ...current.run, discoveredLandmarkIds: [...current.run.discoveredLandmarkIds, landmarkId] },
    }))
  }, [])

  useEffect(() => {
    setTutorialState((current) => reconcileTutorial(current, {
      acceptedQuestIds: areaSession.quests.acceptedQuestIds,
      clues: allClues,
    }))
  }, [areaSession.quests.acceptedQuestIds, allClues])

  useEffect(() => {
    const state = { mode, playerSession, worldSession, masteryState }
    latestSaveStateRef.current = state
    if (saveBlocked) return
    const timer = window.setTimeout(() => {
      try {
        saveGame(state)
        setSaveMessage('Kemajuan disimpan pada peranti ini.')
      } catch {
        setSaveMessage('Kemajuan tidak dapat disimpan. Semak tetapan storan pelayar.')
      }
    }, SAVE_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [mode, playerSession, worldSession, masteryState, saveBlocked])

  useEffect(() => {
    const flush = () => {
      if (saveBlocked) return
      try { saveGame(latestSaveStateRef.current) } catch { /* best effort during exit */ }
    }
    const handleVisibility = () => { if (document.visibilityState === 'hidden') flush() }
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [saveBlocked])

  useEffect(() => {
    if (manualDialog) manualCancelRef.current?.focus()
  }, [manualDialog])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.repeat) return
      let closed = true
      if (manualDialog) setManualDialog(null)
      else if (isReviewOpen) setIsReviewOpen(false)
      else if (isResetConfirmOpen) setIsResetConfirmOpen(false)
      else if (isQuestLogOpen) setIsQuestLogOpen(false)
      else if (isJournalOpen) setIsJournalOpen(false)
      else if (isUpgradePanelOpen) setIsUpgradePanelOpen(false)
      else if (isMasteryPanelOpen) setIsMasteryPanelOpen(false)
      else if (levelUpNotification) setLevelUpNotification(null)
      else if (isGameOverlayOpen || isWorldContextMenuOpen) closed = false
      else if (isTutorialOpen) setIsTutorialOpen(false)
      else closed = false
      if (!closed) return
      event.preventDefault()
      event.stopImmediatePropagation()
      restoreOverlayFocus()
    }
    window.addEventListener('keydown', handleEscape, true)
    return () => window.removeEventListener('keydown', handleEscape, true)
  }, [manualDialog, isReviewOpen, isResetConfirmOpen, isQuestLogOpen, isJournalOpen, isUpgradePanelOpen, isMasteryPanelOpen, levelUpNotification, isGameOverlayOpen, isWorldContextMenuOpen, isTutorialOpen, restoreOverlayFocus])

  useEffect(() => {
    const previousLevel = previousLevelRef.current
    const currentLevel = playerSession.progression.level
    if (currentLevel > previousLevel) {
      setLevelUpNotification({
        level: currentLevel,
        levelsGained: currentLevel - previousLevel,
      })
    }
    previousLevelRef.current = currentLevel
  }, [playerSession.progression.level])

  const trackedQuest = QUEST_DATA.find(
    (quest) => quest.id === areaSession.quests.trackedQuestId,
  )
  const trackedProgress = trackedQuest
    ? getQuestProgress(trackedQuest, areaSession.quests)
    : undefined
  const trackedLocation = trackedQuest
    ? WORLD_LOCATIONS.find((location) =>
        Boolean(location.areaId && trackedQuest.areaIds.includes(location.areaId)),
      )
    : undefined
  const trackedQuestIsHere = Boolean(trackedQuest?.areaIds.includes(currentArea.id))
  const questNavigation = useMemo(
    () => resolveTrackedQuestNavigation(areaSession, currentArea.id),
    [areaSession, currentArea.id],
  )

  const updateAreaSession = useCallback((session: AreaPlaySession) => {
    setPlayerSession((current) => {
      const previousArea = current.run.areaStates[session.areaId]
      const run = {
        ...current.run,
        areaStates: {
          ...current.run.areaStates,
          [session.areaId]: { playerPosition: session.playerPosition, clues: session.clues, fogDiscoveryPoints: session.fogDiscoveryPoints },
        },
        remainingHints: session.remainingHints,
      }
      run.quests = syncQuestProgress(current.run.quests, getAllClueStates(run))
      Object.entries(session.clues).forEach(([clueId, clue]) => {
        if (clue.state !== 'completed' || previousArea.clues[clueId]?.state === 'completed') return
        const localIndex = currentArea.clues.findIndex((definition) => definition.id === clueId)
        const questionId = session.questionRun.assignments[localIndex]?.question.id
        if (!questionId) return
        const score = calculateEncounterScore(clue.incorrectAttemptOccurred, clue.hintUsed)
        setMasteryState((mastery) => recordQuestionMastery(mastery, questionId, score))
      })
      return {
        run,
        progression: applyXPRewards(
          current.progression,
          collectCompletionRewards(current.run, run),
        ),
      }
    })
  }, [currentArea])

  const startNewTestRun = useCallback(() => {
    setPlayerSession((current) => ({
      ...current,
      run: createAreaSession(getEffectivePlayerStats(current.progression).maxHints),
    }))
    setWorldSession({
      currentLocationId: STARTING_LOCATION_ID,
      visitedLocationIds: [STARTING_LOCATION_ID],
      hasEnteredArea: false,
    })
    setIsQuestLogOpen(false)
    setIsUpgradePanelOpen(false)
    setIsMasteryPanelOpen(false)
    setIsJournalOpen(false)
    setIsReviewOpen(false)
    setAreaWaypoints({})
    setWorldObjectState(createWorldObjectSession())
    setTutorialState(createTutorialState())
    setIsTutorialOpen(true)
  }, [])

  const handlePurchaseUpgrade = (upgradeId: UpgradeId) => {
    setPlayerSession((current) => ({
      ...current,
      progression: purchaseUpgrade(current.progression, upgradeId),
    }))
  }

  const grantTestUpgradePoints = () => {
    if (!import.meta.env.DEV) return
    setPlayerSession((current) => ({
      ...current,
      progression: {
        ...current.progression,
        unspentUpgradePoints: current.progression.unspentUpgradePoints + 3,
      },
    }))
  }

  const resetTestProgression = () => {
    if (!import.meta.env.DEV) return
    const progression = createPlayerProgression()
    setPlayerSession({
      progression,
      run: createAreaSession(getEffectivePlayerStats(progression).maxHints),
    })
    setWorldSession({
      currentLocationId: STARTING_LOCATION_ID,
      visitedLocationIds: [STARTING_LOCATION_ID],
      hasEnteredArea: false,
    })
    setMode('WORLD_MAP')
    setAreaWaypoints({})
    setWorldObjectState(createWorldObjectSession())
    setLevelUpNotification(null)
    previousLevelRef.current = progression.level
    setTutorialState(createTutorialState())
    setIsTutorialOpen(true)
  }

  const handleAcceptQuestFromNpc = (questId: string) => {
    const result = acceptQuestWithResult(
      areaSession.quests,
      questId,
      getAllClueStates(areaSession),
    )
    if (result.code !== 'ACCEPTED') return result
    setPlayerSession((current) => {
      const currentResult = acceptQuestWithResult(
        current.run.quests,
        questId,
        getAllClueStates(current.run),
      )
      if (currentResult.code !== 'ACCEPTED') return current
      const run = { ...current.run, quests: currentResult.session }
      return {
        run,
        progression: applyXPRewards(
          current.progression,
          collectCompletionRewards(current.run, run),
        ),
      }
    })
    return result
  }

  const handleTrackQuest = (questId: string | null) => {
    setPlayerSession((current) => ({
      ...current,
      run: {
        ...current.run,
        quests: setTrackedQuest(current.run.quests, questId),
      },
    }))
  }

  const travelTo = (locationId: string) => {
    setWorldSession((current) => ({
      ...current,
      currentLocationId: locationId,
      visitedLocationIds: current.visitedLocationIds.includes(locationId)
        ? current.visitedLocationIds
        : [...current.visitedLocationIds, locationId],
    }))
  }

  const enterArea = () => {
    setWorldSession((current) => ({ ...current, hasEnteredArea: true }))
    setMode('AREA_MAP')
  }

  const resetAllProgress = () => {
    try { clearSirahQuestStorage() } catch { /* a clean in-memory reset still works */ }
    const fresh = createFreshState()
    setMode(fresh.mode)
    setPlayerSession(fresh.playerSession)
    setWorldSession(fresh.worldSession)
    setMasteryState(fresh.masteryState)
    previousLevelRef.current = fresh.playerSession.progression.level
    setLevelUpNotification(null)
    setIsQuestLogOpen(false)
    setIsUpgradePanelOpen(false)
    setIsMasteryPanelOpen(false)
    setIsJournalOpen(false)
    setIsReviewOpen(false)
    setIsResetConfirmOpen(false)
    setAreaWaypoints({})
    setWorldObjectState(createWorldObjectSession())
    setTutorialState(createTutorialState())
    setIsTutorialOpen(true)
    setSaveBlocked(false)
    try {
      saveGame(fresh)
      setSaveMessage('Semua kemajuan telah dipadam dan permainan baharu dimulakan.')
    } catch {
      setSaveMessage('Kemajuan ditetapkan semula, tetapi storan pelayar tidak tersedia.')
    }
  }

  const writeManualSave = () => {
    try {
      const locationName = getWorldLocation(worldSession.currentLocationId)?.nameBM ?? worldSession.currentLocationId
      const currentState = { mode, playerSession, worldSession, masteryState }
      latestSaveStateRef.current = currentState
      saveManualGame(currentState, locationName)
      setManualSave(loadManualGame())
      setManualMessage('Simpanan manual berjaya disimpan.')
    } catch {
      setManualMessage('Simpanan manual gagal. Semak ruang dan kebenaran storan pelayar.')
    }
    setManualDialog(null)
    restoreOverlayFocus()
  }

  const requestManualSave = () => {
    overlayTriggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (manualSave.status === 'loaded') setManualDialog('overwrite')
    else writeManualSave()
  }

  const requestManualLoad = () => {
    overlayTriggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const result = loadManualGame()
    setManualSave(result)
    if (result.status !== 'loaded') {
      setManualMessage(result.message ?? 'Tiada simpanan manual.')
      restoreOverlayFocus()
      return
    }
    setManualDialog('load')
  }

  const restoreManualSave = () => {
    const result = loadManualGame()
    if (result.status !== 'loaded' || !result.state) {
      setManualSave(result)
      setManualMessage(result.message ?? 'Simpanan manual tidak dapat dimuatkan.')
      setManualDialog(null)
      return
    }
    const restored = result.state
    setMode(restored.mode)
    setPlayerSession(restored.playerSession)
    setWorldSession(restored.worldSession)
    setMasteryState(restored.masteryState)
    latestSaveStateRef.current = restored
    previousLevelRef.current = restored.playerSession.progression.level
    setLevelUpNotification(null)
    setIsQuestLogOpen(false)
    setIsUpgradePanelOpen(false)
    setIsMasteryPanelOpen(false)
    setIsJournalOpen(false)
    setIsReviewOpen(false)
    setIsResetConfirmOpen(false)
    setAreaWaypoints({})
    setWorldObjectState(createWorldObjectSession())
    setTutorialState(createTutorialState())
    setIsTutorialOpen(false)
    setGameInstanceKey((key) => key + 1)
    setManualDialog(null)
    setManualSave(result)
    setManualMessage('Simpanan manual berjaya dimuatkan.')
    restoreOverlayFocus()
  }

  return (
    <main
      ref={appShellRef}
      className={`app-shell is-${mode.toLowerCase().replace('_', '-')}${immersiveMode !== 'windowed' ? ' is-immersive' : ''}${immersiveMode === 'focus-mode' ? ' is-focus-mode' : ''}${immersiveMode === 'native-fullscreen' ? ' is-native-fullscreen' : ''}`}
      data-immersive-mode={immersiveMode}
    >
      <ImmersiveModeControl
        hostRef={appShellRef}
        mode={immersiveMode}
        escapeBlocked={isInterfaceLocked || isGameOverlayOpen || isWorldContextMenuOpen || isTutorialOpen}
        onModeChange={setImmersiveMode}
      />
      <section className="starter-card" aria-labelledby="game-title">
        <p className="build-label">Development Build v0.29.0 by Zil-el-Saif</p>
        <h1 id="game-title">Sirah Quest</h1>
        <p className="tagline">Classic Fantasy Learning Adventure</p>
      </section>
      <PlayerProgressionHUD
        progression={playerSession.progression}
        remainingHints={areaSession.remainingHints}
        maxHints={effectiveStats.maxHints}
      />
      {mode === 'AREA_MAP' && trackedQuest && trackedProgress && (
        <button
          type="button"
          className="tracked-quest-summary"
          disabled={isInterfaceLocked}
          onClick={openQuestLog}
        >
          <span>Misi Dijejak</span>
          <strong>{trackedQuest.titleBM}</strong>
          <small>{trackedProgress.completed} / {trackedProgress.total} objektif</small>
          {!trackedQuestIsHere && trackedLocation && (
            <small className="tracked-quest-summary__location">Lokasi: {trackedLocation.nameBM}</small>
          )}
        </button>
      )}
      {mode === 'WORLD_MAP' ? (
        <WorldMap
          currentLocationId={worldSession.currentLocationId}
          visitedLocationIds={worldSession.visitedLocationIds}
          quests={areaSession.quests}
          questNavigation={questNavigation}
          onOpenQuestLog={openQuestLog}
          onOpenUpgrades={() => setIsUpgradePanelOpen(true)}
          onOpenMastery={() => setIsMasteryPanelOpen(true)}
          onOpenJournal={openJournal}
          interfaceLocked={isInterfaceLocked}
          onContextMenuStateChange={setIsWorldContextMenuOpen}
          onTravel={travelTo}
          onEnterArea={enterArea}
        />
      ) : (
        <section className="game-panel" aria-labelledby="prototype-title">
          <div className="game-panel__header">
            <div>
              <h2 id="prototype-title">{currentArea.nameBM} · Area Map</h2>
              <p>Explore with WASD, arrows, or tap. Answer questions at discovered clues.</p>
            </div>
            <div className="game-panel__actions">
              <button type="button" className="quest-log-button" disabled={isInterfaceLocked} onClick={openQuestLog}>
                Log Quest
              </button>
              <button type="button" className="upgrade-button" disabled={isInterfaceLocked} onClick={() => setIsUpgradePanelOpen(true)}>
                Naik Taraf
              </button>
              <button type="button" className="mastery-button" disabled={isInterfaceLocked} onClick={() => setIsMasteryPanelOpen(true)}>
                Penguasaan
              </button>
              <button type="button" className="journal-button" disabled={isInterfaceLocked} onClick={openJournal}>
                Jurnal
              </button>
              <button type="button" className="return-world-button" disabled={isInterfaceLocked} onClick={() => setMode('WORLD_MAP')}>
                Kembali ke Peta Dunia
              </button>
            </div>
          </div>
          <Suspense fallback={<div className="game-loading" role="status">Memuatkan kawasan pengembaraan…</div>}>
            <GameCanvas
              key={gameInstanceKey}
              area={currentArea}
              session={playSession}
              onSessionChange={updateAreaSession}
              onNewTestRun={startNewTestRun}
              interfaceLocked={isInterfaceLocked}
              effectiveStats={effectiveStats}
              waypoint={areaWaypoints[currentArea.id]}
              questNavigation={questNavigation}
              quests={areaSession.quests}
              onAcceptQuest={handleAcceptQuestFromNpc}
              onPlayerMoved={recordPlayerMovement}
              onNpcDialogueOpen={recordNpcDialogue}
              worldObjectState={worldObjectState}
              onWorldObjectStateChange={updateWorldObjectState}
              discoveredLandmarkIds={areaSession.discoveredLandmarkIds}
              onLandmarkDiscovered={recordLandmarkDiscovery}
              onOverlayStateChange={setIsGameOverlayOpen}
              onWaypointChange={(waypoint) => setAreaWaypoints((current) => {
                if (waypoint) return { ...current, [currentArea.id]: waypoint }
                const next = { ...current }
                delete next[currentArea.id]
                return next
              })}
            />
          </Suspense>
        </section>
      )}
      {isQuestLogOpen && (
        <QuestLog
          session={areaSession.quests}
          clues={allClues}
          onTrack={handleTrackQuest}
          onClose={() => { setIsQuestLogOpen(false); restoreOverlayFocus() }}
        />
      )}
      {levelUpNotification && (
        <LevelUpNotification
          level={levelUpNotification.level}
          levelsGained={levelUpNotification.levelsGained}
          onClose={() => setLevelUpNotification(null)}
        />
      )}
      {isUpgradePanelOpen && (
        <UpgradePanel
          progression={playerSession.progression}
          onPurchase={handlePurchaseUpgrade}
          onClose={() => setIsUpgradePanelOpen(false)}
          onGrantTestPoints={grantTestUpgradePoints}
          onResetTestProgression={resetTestProgression}
        />
      )}
      {isMasteryPanelOpen && (
        <SirahMasteryPanel state={masteryState} session={areaSession} onClose={() => setIsMasteryPanelOpen(false)} />
      )}
      {isJournalOpen && <JournalPanel model={journalModel} onOpenReview={() => setIsReviewOpen(true)} onClose={() => { closeJournal(); restoreOverlayFocus() }} />}
      {isReviewOpen && <Suspense fallback={<div className="review-overlay"><div className="game-loading" role="status">Menyediakan ulang kaji…</div></div>}><ReviewPanel mastery={masteryState} onClose={() => setIsReviewOpen(false)} /></Suspense>}
      <TutorialPanel
        state={tutorialState}
        open={isTutorialOpen}
        onStart={() => setTutorialState((current) => startTutorial(current))}
        onSkip={() => {
          setTutorialState((current) => skipTutorial(current))
          setIsTutorialOpen(false)
        }}
        onClose={() => setIsTutorialOpen(false)}
        onOpen={() => {
          setTutorialState((current) => reopenTutorial(current))
          setIsTutorialOpen(true)
        }}
      />
      <BackgroundMusicPlayer />
      <section className="save-controls" aria-label="Data simpanan">
        <div>
          <strong>Data simpanan · Autosave Aktif</strong>
          <small role="status">{saveMessage || 'Kemajuan disimpan secara automatik pada peranti ini.'}</small>
          <small>Simpanan Manual: {manualSave.status === 'loaded' && manualSave.metadata
            ? `${new Date(manualSave.metadata.savedAt).toLocaleString('ms-MY')} · ${manualSave.metadata.locationNameBM} · Tahap ${manualSave.metadata.level}`
            : (manualSave.message ?? 'Tiada simpanan manual')}</small>
          {manualMessage && <small role="status">{manualMessage}</small>}
        </div>
        <div className="save-controls__actions">
          <button type="button" onClick={requestManualSave}>Simpan Permainan</button>
          <button type="button" disabled={manualSave.status !== 'loaded'} onClick={requestManualLoad}>Muat Permainan</button>
          <button type="button" onClick={() => setIsResetConfirmOpen(true)}>Padam Semua Kemajuan</button>
        </div>
      </section>
      {manualDialog && (
        <div className="clue-overlay" role="presentation">
          <section className="reset-confirm" role="dialog" aria-modal="true" aria-labelledby="manual-save-title">
            <h2 id="manual-save-title">{manualDialog === 'overwrite' ? 'Ganti simpanan manual?' : 'Muat simpanan manual ini?'}</h2>
            <p>{manualDialog === 'overwrite'
              ? 'Simpanan manual sedia ada akan digantikan dengan kemajuan semasa.'
              : 'Kemajuan sesi semasa mungkin digantikan dengan snapshot yang disimpan.'}</p>
            <div className="reset-confirm__actions">
              <button ref={manualCancelRef} type="button" onClick={() => { setManualDialog(null); restoreOverlayFocus() }}>Batal</button>
              <button type="button" onClick={manualDialog === 'overwrite' ? writeManualSave : restoreManualSave}>
                {manualDialog === 'overwrite' ? 'Ya, Simpan' : 'Ya, Muat Permainan'}
              </button>
            </div>
          </section>
        </div>
      )}
      {isResetConfirmOpen && (
        <div className="clue-overlay" role="presentation">
          <section className="reset-confirm" role="dialog" aria-modal="true" aria-labelledby="reset-title">
            <h2 id="reset-title">Padam semua kemajuan?</h2>
            <p>Tindakan ini memadam XP, tahap, naik taraf, Penguasaan Sirah, quest, petunjuk, jawapan, kedudukan pemain dan kawasan kabus yang telah diterokai pada peranti ini. Tindakan ini tidak boleh dibatalkan.</p>
            <div className="reset-confirm__actions">
              <button type="button" onClick={() => setIsResetConfirmOpen(false)}>Batal</button>
              <button type="button" className="is-danger" onClick={resetAllProgress}>Ya, Padam Kemajuan</button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}

export default App
