import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GameCanvas } from './game/GameCanvas'
import { CLUE_DATA } from './game/clues/clueData'
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
  acceptQuest,
  getQuestProgress,
  setTrackedQuest,
  syncQuestProgress,
} from './game/quests/QuestManager'
import { createAreaSession } from './game/session/createSession'
import type { AreaSessionState, GameMode, WorldSessionState } from './game/session/types'
import { STARTING_LOCATION_ID } from './world/locationData'
import { WorldMap } from './world/WorldMap'
import { SAVE_DEBOUNCE_MS } from './game/save/config'
import { clearSirahQuestStorage, loadGameSave, saveGame } from './game/save/SaveManager'
import type { PersistedGameState, PlayerSessionState, SaveLoadResult } from './game/save/types'
import { SirahMasteryPanel } from './game/mastery/SirahMasteryPanel'
import { calculateEncounterScore, createSirahMastery, recordQuestionMastery } from './game/mastery/SirahMastery'
import type { SirahMasteryState } from './game/mastery/types'

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

  Object.entries(next.clues).forEach(([clueId, clue]) => {
    if (clue.state === 'completed' && previous.clues[clueId]?.state !== 'completed') {
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
  const [initialLoad] = useState<SaveLoadResult>(() => loadGameSave())
  const [initialState] = useState<PersistedGameState>(() => initialLoad.state ?? createFreshState())
  const [mode, setMode] = useState<GameMode>(initialState.mode)
  const [playerSession, setPlayerSession] = useState<PlayerSession>(initialState.playerSession)
  const [worldSession, setWorldSession] = useState<WorldSessionState>(initialState.worldSession)
  const [masteryState, setMasteryState] = useState<SirahMasteryState>(initialState.masteryState)
  const [saveMessage, setSaveMessage] = useState(initialLoad.message ?? '')
  const [saveBlocked, setSaveBlocked] = useState(initialLoad.status === 'incompatible')
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false)
  const latestSaveStateRef = useRef<PersistedGameState>(initialState)
  const [isQuestLogOpen, setIsQuestLogOpen] = useState(false)
  const [isUpgradePanelOpen, setIsUpgradePanelOpen] = useState(false)
  const [isMasteryPanelOpen, setIsMasteryPanelOpen] = useState(false)
  const [levelUpNotification, setLevelUpNotification] = useState<{
    level: number
    levelsGained: number
  } | null>(null)
  const previousLevelRef = useRef(playerSession.progression.level)
  const areaSession = playerSession.run
  const effectiveStats = useMemo(
    () => getEffectivePlayerStats(playerSession.progression),
    [playerSession.progression],
  )
  const isInterfaceLocked =
    isQuestLogOpen || isUpgradePanelOpen || isMasteryPanelOpen || levelUpNotification !== null || isResetConfirmOpen

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

  const updateAreaSession = useCallback((session: AreaSessionState) => {
    setPlayerSession((current) => {
      const run = {
        ...session,
        quests: syncQuestProgress(current.run.quests, session.clues),
      }
      Object.entries(run.clues).forEach(([clueId, clue]) => {
        if (clue.state !== 'completed' || current.run.clues[clueId]?.state === 'completed') return
        const index = CLUE_DATA.findIndex((definition) => definition.id === clueId)
        const questionId = run.questionRun.assignments[index]?.question.id
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
  }, [])

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
    setLevelUpNotification(null)
    previousLevelRef.current = progression.level
  }

  const handleAcceptQuest = (questId: string) => {
    setPlayerSession((current) => {
      const run = {
        ...current.run,
        quests: acceptQuest(current.run.quests, questId, current.run.clues),
      }
      return {
        run,
        progression: applyXPRewards(
          current.progression,
          collectCompletionRewards(current.run, run),
        ),
      }
    })
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
    setIsResetConfirmOpen(false)
    setSaveBlocked(false)
    try {
      saveGame(fresh)
      setSaveMessage('Semua kemajuan telah dipadam dan permainan baharu dimulakan.')
    } catch {
      setSaveMessage('Kemajuan ditetapkan semula, tetapi storan pelayar tidak tersedia.')
    }
  }

  return (
    <main className={`app-shell is-${mode.toLowerCase().replace('_', '-')}`}>
      <section className="starter-card" aria-labelledby="game-title">
        <p className="build-label">Development Build v0.10.0 by Zil-el-Saif</p>
        <h1 id="game-title">Sirah Quest</h1>
        <p className="tagline">Classic Fantasy Learning Adventure</p>
      </section>
      <PlayerProgressionHUD
        progression={playerSession.progression}
        remainingHints={areaSession.remainingHints}
        maxHints={effectiveStats.maxHints}
      />
      {trackedQuest && trackedProgress && (
        <button
          type="button"
          className="tracked-quest-summary"
          disabled={isInterfaceLocked}
          onClick={() => setIsQuestLogOpen(true)}
        >
          <span>Quest dijejaki</span>
          <strong>{trackedQuest.titleBM}</strong>
          <small>{trackedProgress.completed}/{trackedProgress.total} objektif</small>
        </button>
      )}
      {mode === 'WORLD_MAP' ? (
        <WorldMap
          currentLocationId={worldSession.currentLocationId}
          visitedLocationIds={worldSession.visitedLocationIds}
          hasEnteredArea={worldSession.hasEnteredArea}
          quests={areaSession.quests}
          onOpenQuestLog={() => setIsQuestLogOpen(true)}
          onOpenUpgrades={() => setIsUpgradePanelOpen(true)}
          onOpenMastery={() => setIsMasteryPanelOpen(true)}
          interfaceLocked={isInterfaceLocked}
          onTravel={travelTo}
          onEnterArea={enterArea}
        />
      ) : (
        <section className="game-panel" aria-labelledby="prototype-title">
          <div className="game-panel__header">
            <div>
              <h2 id="prototype-title">Kampung Ilmu · Area Map</h2>
              <p>Explore with WASD, arrows, or tap. Answer questions at discovered clues.</p>
            </div>
            <div className="game-panel__actions">
              <button type="button" className="quest-log-button" disabled={isInterfaceLocked} onClick={() => setIsQuestLogOpen(true)}>
                Log Quest
              </button>
              <button type="button" className="upgrade-button" disabled={isInterfaceLocked} onClick={() => setIsUpgradePanelOpen(true)}>
                Naik Taraf
              </button>
              <button type="button" className="mastery-button" disabled={isInterfaceLocked} onClick={() => setIsMasteryPanelOpen(true)}>
                Penguasaan
              </button>
              <button type="button" className="return-world-button" disabled={isInterfaceLocked} onClick={() => setMode('WORLD_MAP')}>
                Kembali ke Peta Dunia
              </button>
            </div>
          </div>
          <GameCanvas
            session={areaSession}
            onSessionChange={updateAreaSession}
            onNewTestRun={startNewTestRun}
            interfaceLocked={isInterfaceLocked}
            effectiveStats={effectiveStats}
          />
        </section>
      )}
      {isQuestLogOpen && (
        <QuestLog
          session={areaSession.quests}
          clues={areaSession.clues}
          onAccept={handleAcceptQuest}
          onTrack={handleTrackQuest}
          onClose={() => setIsQuestLogOpen(false)}
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
        <SirahMasteryPanel state={masteryState} onClose={() => setIsMasteryPanelOpen(false)} />
      )}
      <section className="save-controls" aria-label="Data simpanan">
        <div>
          <strong>Data simpanan</strong>
          <small role="status">{saveMessage || 'Kemajuan disimpan secara automatik pada peranti ini.'}</small>
        </div>
        <button type="button" onClick={() => setIsResetConfirmOpen(true)}>
          Padam Semua Kemajuan
        </button>
      </section>
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
