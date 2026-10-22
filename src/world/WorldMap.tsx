import { useEffect, useMemo, useRef, useState } from 'react'
import worldMapImage from '../assets/world-map.webp'
import { QUEST_DATA } from '../game/quests/questData'
import type { QuestSessionState } from '../game/quests/types'
import { getWorldLocation, WORLD_LOCATIONS } from './locationData'
import type { WorldLocation } from './types'

interface WorldMapProps {
  currentLocationId: string
  visitedLocationIds: string[]
  hasEnteredArea: boolean
  onTravel: (locationId: string) => void
  onEnterArea: (areaId: string) => void
  quests: QuestSessionState
  onOpenQuestLog: () => void
  onOpenUpgrades: () => void
  onOpenMastery: () => void
  interfaceLocked: boolean
}

const STATUS_LABELS = {
  playable: 'Boleh dimainkan',
  'coming-soon': 'Akan datang',
  locked: 'Terkunci',
}

export function WorldMap({
  currentLocationId,
  visitedLocationIds,
  hasEnteredArea,
  onTravel,
  onEnterArea,
  quests,
  onOpenQuestLog,
  onOpenUpgrades,
  onOpenMastery,
  interfaceLocked,
}: WorldMapProps) {
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null)
  const [markerLocationId, setMarkerLocationId] = useState(currentLocationId)
  const [isTravelling, setIsTravelling] = useState(false)
  const travelTimerRef = useRef<number | undefined>(undefined)
  const selectedLocation = selectedLocationId
    ? getWorldLocation(selectedLocationId)
    : undefined
  const currentLocation = getWorldLocation(currentLocationId) ?? WORLD_LOCATIONS[0]
  const connectedIds = useMemo(
    () => new Set(currentLocation.connections),
    [currentLocation.connections],
  )

  useEffect(() => {
    setSelectedLocationId(currentLocationId)
    if (!isTravelling) setMarkerLocationId(currentLocationId)
  }, [currentLocationId, isTravelling])

  useEffect(
    () => () => {
      if (travelTimerRef.current !== undefined) window.clearTimeout(travelTimerRef.current)
    },
    [],
  )

  const travelTo = (location: WorldLocation) => {
    if (
      interfaceLocked ||
      isTravelling ||
      location.status === 'locked' ||
      !connectedIds.has(location.id)
    ) return

    setIsTravelling(true)
    setSelectedLocationId(location.id)
    setMarkerLocationId(location.id)
    travelTimerRef.current = window.setTimeout(() => {
      onTravel(location.id)
      setIsTravelling(false)
      travelTimerRef.current = undefined
    }, 700)
  }

  const markerLocation = getWorldLocation(markerLocationId) ?? currentLocation

  const renderPrimaryAction = () => {
    if (!selectedLocation) return null
    const isCurrent = selectedLocation.id === currentLocationId

    if (isCurrent && selectedLocation.status === 'playable' && selectedLocation.areaId) {
      return (
        <button
          type="button"
          disabled={interfaceLocked}
          onClick={() => onEnterArea(selectedLocation.areaId!)}
        >
          {hasEnteredArea ? 'Masuk Kawasan' : 'Mula Pengembaraan'}
        </button>
      )
    }

    if (isCurrent && selectedLocation.status === 'coming-soon') {
      return <button type="button" disabled>Akan Datang</button>
    }

    const canTravel =
      selectedLocation.status !== 'locked' && connectedIds.has(selectedLocation.id)

    return (
      <button
        type="button"
        disabled={interfaceLocked || !canTravel || isTravelling}
        onClick={() => travelTo(selectedLocation)}
      >
        {isTravelling ? 'Bergerak…' : canTravel ? 'Pergi ke Lokasi' : 'Laluan Tidak Tersedia'}
      </button>
    )
  }

  return (
    <section className="world-map" aria-labelledby="world-map-title">
      <div className="world-map__header">
        <div>
          <p className="world-map__eyebrow">Mod Peta Dunia</p>
          <h2 id="world-map-title">Peta Dunia Sirah Quest</h2>
        </div>
        <div className="world-map__header-actions">
          <p>Pilih nod yang bersambung untuk bergerak antara lokasi.</p>
          <button type="button" className="quest-log-button" disabled={interfaceLocked} onClick={onOpenQuestLog}>
            Log Quest
          </button>
          <button type="button" className="upgrade-button" disabled={interfaceLocked} onClick={onOpenUpgrades}>
            Naik Taraf
          </button>
          <button type="button" className="mastery-button" disabled={interfaceLocked} onClick={onOpenMastery}>
            Penguasaan
          </button>
        </div>
      </div>

      <div className="world-map__viewport" aria-busy={isTravelling}>
        <div className="world-map__canvas">
          <img src={worldMapImage} alt="Peta dunia fantasi Sirah Quest" draggable={false} />
          <svg className="world-map__routes" viewBox="0 0 100 100" aria-hidden="true">
            <path d="M 24 39 Q 35 55 49 68" />
            <path d="M 49 68 Q 55 42 64 25" />
            <path d="M 49 68 Q 70 60 87 43" />
          </svg>

          {WORLD_LOCATIONS.map((location) => {
            const isCurrent = location.id === currentLocationId
            const isVisited = visitedLocationIds.includes(location.id) || location.visited
            const isSelected = location.id === selectedLocationId
            const locationQuests = QUEST_DATA.filter(
              (quest) => location.areaId && quest.areaIds.includes(location.areaId),
            )
            const availableCount = locationQuests.filter(
              (quest) => quests.quests[quest.id]?.status === 'AVAILABLE',
            ).length
            const activeCount = locationQuests.filter(
              (quest) => quests.quests[quest.id]?.status === 'ACTIVE',
            ).length
            const completedCount = locationQuests.filter(
              (quest) => quests.quests[quest.id]?.status === 'COMPLETED',
            ).length
            return (
              <button
                key={location.id}
                type="button"
                className={`world-node is-${location.status}${isCurrent ? ' is-current' : ''}${
                  isVisited ? ' is-visited' : ''
                }${isSelected ? ' is-selected' : ''}`}
                style={{
                  left: `${location.normalizedPosition.x}%`,
                  top: `${location.normalizedPosition.y}%`,
                }}
                aria-pressed={isSelected}
                aria-label={`${location.nameBM}, ${STATUS_LABELS[location.status]}`}
                disabled={interfaceLocked || isTravelling}
                onClick={() => setSelectedLocationId(location.id)}
              >
                <span className="world-node__marker" aria-hidden="true">
                  {location.status === 'locked' ? '◆' : isCurrent ? '★' : '●'}
                </span>
                <span className="world-node__label">{location.nameBM}</span>
                <span className="world-node__state">
                  {isCurrent
                    ? 'Lokasi semasa'
                    : location.status === 'locked'
                      ? 'Terkunci'
                      : isVisited
                        ? 'Pernah dilawati'
                        : STATUS_LABELS[location.status]}
                </span>
                {(availableCount > 0 || activeCount > 0 || completedCount > 0) && (
                  <span className="world-node__quests">
                    {activeCount > 0 ? `${activeCount} aktif` : availableCount > 0 ? `${availableCount} tersedia` : `${completedCount} selesai`}
                  </span>
                )}
              </button>
            )
          })}

          <div
            className={`world-player-marker${isTravelling ? ' is-travelling' : ''}`}
            style={{
              left: `${markerLocation.normalizedPosition.x}%`,
              top: `${markerLocation.normalizedPosition.y}%`,
            }}
            aria-hidden="true"
          >
            ✦
          </div>
        </div>
      </div>

      <p className="travel-feedback" role="status" aria-live="polite">
        {isTravelling
          ? `Bergerak ke ${selectedLocation?.nameBM ?? 'lokasi dipilih'}…`
          : `Lokasi semasa: ${currentLocation.nameBM}`}
      </p>

      {selectedLocation && (
        <aside className="location-panel" aria-live="polite">
          <div>
            <p className="location-panel__status">{STATUS_LABELS[selectedLocation.status]}</p>
            <h3>{selectedLocation.nameBM}</h3>
            <p>{selectedLocation.descriptionBM}</p>
          </div>
          <div className="location-panel__actions">
            {renderPrimaryAction()}
            <button
              type="button"
              className="button-secondary"
              disabled={interfaceLocked}
              onClick={() => setSelectedLocationId(null)}
            >
              Tutup
            </button>
          </div>
        </aside>
      )}
    </section>
  )
}
