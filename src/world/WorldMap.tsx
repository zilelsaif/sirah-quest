import { useEffect, useMemo, useState } from 'react'
import worldMapImage from '../assets/world-map.webp'
import { getWorldLocation, WORLD_LOCATIONS } from './locationData'
import type { WorldLocation } from './types'

interface WorldMapProps {
  currentLocationId: string
  visitedLocationIds: string[]
  onTravel: (locationId: string) => void
  onEnterArea: (areaId: string) => void
}

const STATUS_LABELS = {
  playable: 'Boleh dimainkan',
  'coming-soon': 'Akan datang',
  locked: 'Terkunci',
}

export function WorldMap({
  currentLocationId,
  visitedLocationIds,
  onTravel,
  onEnterArea,
}: WorldMapProps) {
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null)
  const [markerLocationId, setMarkerLocationId] = useState(currentLocationId)
  const [isTravelling, setIsTravelling] = useState(false)
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

  const travelTo = (location: WorldLocation) => {
    if (isTravelling || location.status === 'locked' || !connectedIds.has(location.id)) return

    setIsTravelling(true)
    setSelectedLocationId(location.id)
    setMarkerLocationId(location.id)
    window.setTimeout(() => {
      onTravel(location.id)
      setIsTravelling(false)
    }, 700)
  }

  const markerLocation = getWorldLocation(markerLocationId) ?? currentLocation

  const renderPrimaryAction = () => {
    if (!selectedLocation) return null
    const isCurrent = selectedLocation.id === currentLocationId

    if (isCurrent && selectedLocation.status === 'playable' && selectedLocation.areaId) {
      return (
        <button type="button" onClick={() => onEnterArea(selectedLocation.areaId!)}>
          Masuk Kawasan
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
        disabled={!canTravel || isTravelling}
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
        <p>Pilih nod yang bersambung untuk bergerak antara lokasi.</p>
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
                disabled={isTravelling}
                onClick={() => setSelectedLocationId(location.id)}
              >
                <span className="world-node__marker" aria-hidden="true">
                  {location.status === 'locked' ? '◆' : '●'}
                </span>
                <span className="world-node__label">{location.nameBM}</span>
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
