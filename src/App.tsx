import { useCallback, useState } from 'react'
import { GameCanvas } from './game/GameCanvas'
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

function App() {
  const [mode, setMode] = useState<GameMode>('WORLD_MAP')
  const [areaSession, setAreaSession] = useState<AreaSessionState>(createAreaSession)
  const [worldSession, setWorldSession] = useState<WorldSessionState>({
    currentLocationId: STARTING_LOCATION_ID,
    visitedLocationIds: [STARTING_LOCATION_ID],
    hasEnteredArea: false,
  })
  const [isQuestLogOpen, setIsQuestLogOpen] = useState(false)
  const trackedQuest = QUEST_DATA.find(
    (quest) => quest.id === areaSession.quests.trackedQuestId,
  )
  const trackedProgress = trackedQuest
    ? getQuestProgress(trackedQuest, areaSession.quests)
    : undefined

  const updateAreaSession = useCallback((session: AreaSessionState) => {
    setAreaSession((current) => ({
      ...session,
      quests: syncQuestProgress(current.quests, session.clues),
    }))
  }, [])

  const startNewTestRun = useCallback(() => {
    setAreaSession(createAreaSession())
    setWorldSession({
      currentLocationId: STARTING_LOCATION_ID,
      visitedLocationIds: [STARTING_LOCATION_ID],
      hasEnteredArea: false,
    })
    setIsQuestLogOpen(false)
  }, [])

  const handleAcceptQuest = (questId: string) => {
    setAreaSession((current) => ({
      ...current,
      quests: acceptQuest(current.quests, questId, current.clues),
    }))
  }

  const handleTrackQuest = (questId: string | null) => {
    setAreaSession((current) => ({
      ...current,
      quests: setTrackedQuest(current.quests, questId),
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
        <p className="build-label">Development Build v0.6.0 by Zil-el-Saif</p>
        <h1 id="game-title">Sirah Quest</h1>
        <p className="tagline">Classic Fantasy Learning Adventure</p>
      </section>
      {trackedQuest && trackedProgress && (
        <button
          type="button"
          className="tracked-quest-summary"
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
              <button type="button" className="quest-log-button" onClick={() => setIsQuestLogOpen(true)}>
                Log Quest
              </button>
              <button type="button" className="return-world-button" onClick={() => setMode('WORLD_MAP')}>
                Kembali ke Peta Dunia
              </button>
            </div>
          </div>
          <GameCanvas
            session={areaSession}
            onSessionChange={updateAreaSession}
            onNewTestRun={startNewTestRun}
            interfaceLocked={isQuestLogOpen}
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
    </main>
  )
}

export default App
