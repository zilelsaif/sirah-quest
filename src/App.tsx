import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GameCanvas } from './game/GameCanvas'
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
  PlayerProgressionState,
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

interface PlayerSession {
  run: AreaSessionState
  progression: PlayerProgressionState
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
  const [mode, setMode] = useState<GameMode>('WORLD_MAP')
  const [playerSession, setPlayerSession] = useState<PlayerSession>(() => {
    const progression = createPlayerProgression()
    return {
      run: createAreaSession(getEffectivePlayerStats(progression).maxHints),
      progression,
    }
  })
  const [worldSession, setWorldSession] = useState<WorldSessionState>({
    currentLocationId: STARTING_LOCATION_ID,
    visitedLocationIds: [STARTING_LOCATION_ID],
    hasEnteredArea: false,
  })
  const [isQuestLogOpen, setIsQuestLogOpen] = useState(false)
  const [isUpgradePanelOpen, setIsUpgradePanelOpen] = useState(false)
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
    isQuestLogOpen || isUpgradePanelOpen || levelUpNotification !== null

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

  return (
    <main className={`app-shell is-${mode.toLowerCase().replace('_', '-')}`}>
      <section className="starter-card" aria-labelledby="game-title">
        <p className="build-label">Development Build v0.8.0 by Zil-el-Saif</p>
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
    </main>
  )
}

export default App
