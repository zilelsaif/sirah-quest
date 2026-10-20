import { useCallback, useState } from 'react'
import { GameCanvas } from './game/GameCanvas'
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

  const updateAreaSession = useCallback((session: AreaSessionState) => {
    setAreaSession(session)
  }, [])

  const startNewTestRun = useCallback(() => {
    setAreaSession(createAreaSession())
  }, [])

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
        <p className="build-label">Development Build v0.5.0 by Zil-el-Saif</p>
        <h1 id="game-title">Sirah Quest</h1>
        <p className="tagline">Classic Fantasy Learning Adventure</p>
      </section>
      {mode === 'WORLD_MAP' ? (
        <WorldMap
          currentLocationId={worldSession.currentLocationId}
          visitedLocationIds={worldSession.visitedLocationIds}
          hasEnteredArea={worldSession.hasEnteredArea}
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
            <button type="button" className="return-world-button" onClick={() => setMode('WORLD_MAP')}>
              Kembali ke Peta Dunia
            </button>
          </div>
          <GameCanvas
            session={areaSession}
            onSessionChange={updateAreaSession}
            onNewTestRun={startNewTestRun}
          />
        </section>
      )}
    </main>
  )
}

export default App
