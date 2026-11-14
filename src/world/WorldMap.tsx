import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import worldMapImage from '../assets/world-map-v015.webp'
import { QUEST_DATA } from '../game/quests/questData'
import type { QuestSessionState } from '../game/quests/types'
import type { QuestNavigationState } from '../game/navigation/questNavigation'
import { getWorldLocation, WORLD_LOCATIONS, WORLD_ROUTE_LINKS } from './locationData'
import type { WorldLocation } from './types'
import { clampContextMenuPosition, getWorldMapLocationAction, type ContextMenuPosition } from './worldMapMenu'

interface WorldMapProps {
  currentLocationId: string
  visitedLocationIds: string[]
  onTravel: (locationId: string) => void
  onEnterArea: (areaId: string) => void
  quests: QuestSessionState
  questNavigation: QuestNavigationState
  onOpenQuestLog: () => void
  onOpenUpgrades: () => void
  onOpenMastery: () => void
  onOpenJournal: () => void
  interfaceLocked: boolean
  onContextMenuStateChange: (open: boolean) => void
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
  quests,
  questNavigation,
  onOpenQuestLog,
  onOpenUpgrades,
  onOpenMastery,
  onOpenJournal,
  interfaceLocked,
  onContextMenuStateChange,
}: WorldMapProps) {
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null)
  const [menuPosition, setMenuPosition] = useState<ContextMenuPosition>({ left: 8, top: 8, placement: 'right' })
  const [markerLocationId, setMarkerLocationId] = useState(currentLocationId)
  const [isTravelling, setIsTravelling] = useState(false)
  const [mapViewMode, setMapViewMode] = useState<'region' | 'location'>('region')
  const travelTimerRef = useRef<number | undefined>(undefined)
  const viewportRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLElement>(null)
  const nodeRefs = useRef(new Map<string, HTMLButtonElement>())
  const selectedTriggerRef = useRef<HTMLButtonElement | null>(null)
  const dragRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    scrollLeft: number
    scrollTop: number
    moved: boolean
  } | null>(null)
  const suppressClickUntilRef = useRef(0)
  const selectedLocation = selectedLocationId
    ? getWorldLocation(selectedLocationId)
    : undefined
  const currentLocation = getWorldLocation(currentLocationId) ?? WORLD_LOCATIONS[0]
  const trackedQuest = QUEST_DATA.find((quest) => quest.id === quests.trackedQuestId)
  const connectedIds = useMemo(
    () => new Set(currentLocation.connections),
    [currentLocation.connections],
  )

  useEffect(() => {
    onContextMenuStateChange(selectedLocationId !== null)
    return () => onContextMenuStateChange(false)
  }, [selectedLocationId, onContextMenuStateChange])

  useEffect(() => {
    setMarkerLocationId(currentLocationId)
  }, [currentLocationId])

  const closeLocationMenu = useCallback((restoreFocus = true) => {
    setSelectedLocationId(null)
    if (!restoreFocus) return
    window.requestAnimationFrame(() => selectedTriggerRef.current?.focus())
  }, [])

  const selectLocation = useCallback((locationId: string, trigger?: HTMLButtonElement | null) => {
    if (selectedLocationId === locationId) {
      closeLocationMenu()
      return
    }
    selectedTriggerRef.current = trigger ?? nodeRefs.current.get(locationId) ?? null
    setSelectedLocationId(locationId)
  }, [closeLocationMenu, selectedLocationId])

  const updateMenuPosition = useCallback(() => {
    const viewport = viewportRef.current
    const menu = menuRef.current
    const node = selectedLocationId ? nodeRefs.current.get(selectedLocationId) : undefined
    if (!viewport || !menu || !node) return
    const viewportRect = viewport.getBoundingClientRect()
    const nodeRect = node.getBoundingClientRect()
    const position = clampContextMenuPosition({
      anchorX: nodeRect.left - viewportRect.left,
      anchorY: nodeRect.top - viewportRect.top,
      anchorWidth: nodeRect.width,
      anchorHeight: nodeRect.height,
      menuWidth: menu.offsetWidth,
      menuHeight: menu.offsetHeight,
      viewportWidth: viewport.clientWidth,
      viewportHeight: viewport.clientHeight,
    })
    setMenuPosition({
      ...position,
      left: position.left + viewport.scrollLeft,
      top: position.top + viewport.scrollTop,
    })
  }, [selectedLocationId])

  useEffect(() => {
    if (!selectedLocationId) return
    const frame = window.requestAnimationFrame(updateMenuPosition)
    const viewport = viewportRef.current
    const observer = new ResizeObserver(updateMenuPosition)
    if (viewport) observer.observe(viewport)
    if (menuRef.current) observer.observe(menuRef.current)
    viewport?.addEventListener('scroll', updateMenuPosition, { passive: true })
    window.addEventListener('resize', updateMenuPosition)
    return () => {
      window.cancelAnimationFrame(frame)
      observer.disconnect()
      viewport?.removeEventListener('scroll', updateMenuPosition)
      window.removeEventListener('resize', updateMenuPosition)
    }
  }, [mapViewMode, selectedLocationId, updateMenuPosition])

  useEffect(() => {
    if (!selectedLocationId) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.repeat) return
      event.preventDefault()
      closeLocationMenu()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [closeLocationMenu, selectedLocationId])

  useEffect(() => {
    if (!selectedLocationId) return
    const handleOutsidePointer = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Element) || target.closest('.world-location-menu, .world-node')) return
      closeLocationMenu(false)
    }
    document.addEventListener('pointerdown', handleOutsidePointer)
    return () => document.removeEventListener('pointerdown', handleOutsidePointer)
  }, [closeLocationMenu, selectedLocationId])

  useEffect(
    () => () => {
      if (travelTimerRef.current !== undefined) window.clearTimeout(travelTimerRef.current)
    },
    [],
  )

  useEffect(() => {
    const viewport = viewportRef.current
    const location = getWorldLocation(selectedLocationId ?? currentLocationId)
    if (!viewport || !location) return

    const frame = window.requestAnimationFrame(() => {
      if (mapViewMode === 'region') {
        viewport.scrollTo({ left: 0, top: 0, behavior: 'auto' })
        return
      }
      const canvas = viewport.firstElementChild as HTMLElement | null
      if (!canvas) return
      const targetX = canvas.scrollWidth * location.normalizedPosition.x
      const targetY = canvas.scrollHeight * location.normalizedPosition.y
      viewport.scrollTo({
        left: Math.max(0, targetX - viewport.clientWidth / 2),
        top: Math.max(0, targetY - viewport.clientHeight / 2),
        behavior: 'auto',
      })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [currentLocationId, mapViewMode])

  const beginPan = (event: React.PointerEvent<HTMLDivElement>) => {
    if (mapViewMode !== 'location' || event.button !== 0 || !viewportRef.current) return
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: viewportRef.current.scrollLeft,
      scrollTop: viewportRef.current.scrollTop,
      moved: false,
    }
  }

  const continuePan = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    const viewport = viewportRef.current
    if (!drag || drag.pointerId !== event.pointerId || !viewport) return
    const deltaX = event.clientX - drag.startX
    const deltaY = event.clientY - drag.startY
    if (!drag.moved && Math.hypot(deltaX, deltaY) < 7) return
    if (!drag.moved) {
      drag.moved = true
      viewport.setPointerCapture(event.pointerId)
    }
    viewport.scrollLeft = drag.scrollLeft - deltaX
    viewport.scrollTop = drag.scrollTop - deltaY
  }

  const endPan = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    const viewport = viewportRef.current
    if (!drag || drag.pointerId !== event.pointerId || !viewport) return
    if (drag.moved) suppressClickUntilRef.current = performance.now() + 250
    if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId)
    dragRef.current = null
  }

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
    const action = getWorldMapLocationAction(selectedLocation, currentLocationId, connectedIds)

    if (action === 'ENTER') {
      return (
        <button
          type="button"
          disabled={interfaceLocked}
          onClick={() => {
            closeLocationMenu(false)
            onEnterArea(selectedLocation.areaId!)
          }}
        >
          Masuk Kawasan
        </button>
      )
    }

    if (action === 'LOCKED') return <button type="button" disabled>Terkunci</button>
    if (action === 'COMING_SOON') {
      return <button type="button" disabled>Akan Datang</button>
    }

    const canTravel = action === 'TRAVEL'

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
          <button type="button" className="journal-button" disabled={interfaceLocked} onClick={onOpenJournal}>
            Jurnal
          </button>
        </div>
      </div>

      <div className="world-map__view-controls" aria-label="Skala Peta Dunia">
        <span>Skala peta</span>
        <button type="button" aria-pressed={mapViewMode === 'region'} onClick={() => setMapViewMode('region')}>Rantau</button>
        <button type="button" aria-pressed={mapViewMode === 'location'} onClick={() => setMapViewMode('location')}>Lokasi</button>
        <small>Seret peta untuk meneroka rantau.</small>
      </div>

      <label className={`world-map__mobile-location-picker is-${mapViewMode}`}>
        <span>Pilih lokasi pada peta</span>
        <select
          value={selectedLocationId ?? currentLocationId}
          onChange={(event) => selectLocation(event.target.value)}
        >
          {WORLD_LOCATIONS.map((location) => (
            <option key={location.id} value={location.id}>
              {location.nameBM}{location.status === 'locked' ? ' — Terkunci' : ''}
            </option>
          ))}
        </select>
      </label>

      <div
        ref={viewportRef}
        className={`world-map__viewport is-${mapViewMode}`}
        aria-busy={isTravelling}
        aria-label={mapViewMode === 'region' ? 'Gambaran penuh Peta Dunia' : 'Peta Dunia terperinci yang boleh diseret'}
        tabIndex={mapViewMode === 'location' ? 0 : undefined}
        onPointerDown={beginPan}
        onPointerMove={continuePan}
        onPointerUp={endPan}
        onPointerCancel={endPan}
        onClickCapture={(event) => {
          if (performance.now() < suppressClickUntilRef.current) {
            event.preventDefault()
            event.stopPropagation()
          }
        }}
        onClick={(event) => {
          const target = event.target as Element
          if (!target.closest('.world-node, .world-location-menu')) closeLocationMenu(false)
        }}
      >
        <div className={`world-map__canvas is-${mapViewMode}`}>
          <img src={worldMapImage} alt="Peta dunia fantasi Sirah Quest" draggable={false} />
          <svg className="world-map__routes" viewBox="0 0 100 100" aria-hidden="true">
            {WORLD_ROUTE_LINKS.filter((route) => (
              getWorldLocation(route.from)?.status !== 'locked' &&
              getWorldLocation(route.to)?.status !== 'locked'
            )).map((route) => {
              const from = getWorldLocation(route.from)!
              const to = getWorldLocation(route.to)!
              return <line key={`${route.from}-${route.to}`} x1={from.normalizedPosition.x * 100} y1={from.normalizedPosition.y * 100} x2={to.normalizedPosition.x * 100} y2={to.normalizedPosition.y * 100} />
            })}
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
            const hasTrackedQuest = Boolean(
              trackedQuest && location.areaId && questNavigation.target?.areaId === location.areaId,
            )
            return (
              <button
                key={location.id}
                ref={(node) => {
                  if (node) nodeRefs.current.set(location.id, node)
                  else nodeRefs.current.delete(location.id)
                }}
                type="button"
                className={`world-node is-${location.status}${isCurrent ? ' is-current' : ''}${
                  isVisited ? ' is-visited' : ''
                }${isSelected ? ' is-selected' : ''}${hasTrackedQuest ? ' has-tracked-quest' : ''}`}
                style={{
                  left: `${location.normalizedPosition.x * 100}%`,
                  top: `${location.normalizedPosition.y * 100}%`,
                }}
                aria-pressed={isSelected}
                data-location-id={location.id}
                data-label-placement={location.labelPlacement ?? 'below'}
                aria-label={`${location.nameBM}, ${STATUS_LABELS[location.status]}${
                  hasTrackedQuest ? ', misi dijejak' : ''
                }`}
                disabled={interfaceLocked || isTravelling}
                onClick={(event) => {
                  event.stopPropagation()
                  selectLocation(location.id, event.currentTarget)
                }}
              >
                <span className="world-node__marker" aria-hidden="true">
                  {location.status === 'locked' ? '◆' : isCurrent ? '★' : '●'}
                </span>
                <span className="world-node__details">
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
                  {hasTrackedQuest && (
                    <span className="world-node__tracked">★ Sasaran misi</span>
                  )}
                </span>
              </button>
            )
          })}

          <div
            className={`world-player-marker${isTravelling ? ' is-travelling' : ''}`}
            style={{
              left: `${markerLocation.normalizedPosition.x * 100}%`,
              top: `${markerLocation.normalizedPosition.y * 100}%`,
            }}
            aria-hidden="true"
          >
            ✦
          </div>
        </div>

        {selectedLocation && (
          <aside
            ref={menuRef}
            className={`world-location-menu is-${menuPosition.placement}`}
            style={{ left: menuPosition.left, top: menuPosition.top }}
            role="dialog"
            aria-modal="false"
            aria-labelledby="world-location-menu-title"
            data-location-id={selectedLocation.id}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="world-location-menu__close"
              aria-label={`Tutup menu ${selectedLocation.nameBM}`}
              onClick={() => closeLocationMenu()}
            >
              ×
            </button>
            <p>{STATUS_LABELS[selectedLocation.status]}</p>
            <h3 id="world-location-menu-title">{selectedLocation.nameBM}</h3>
            <div className="world-location-menu__action">{renderPrimaryAction()}</div>
          </aside>
        )}
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
            {questNavigation.target?.areaId === selectedLocation.areaId && (
              <p className="location-panel__quest-guidance">
                <strong>★ Misi dijejak: {questNavigation.target?.questTitle.bm}</strong>
                <span>{questNavigation.status === 'cross-area'
                  ? `Sasaran berada di ${questNavigation.target?.areaName.bm}. Lokasi tepat kekal tersembunyi sehingga ditemui.`
                  : questNavigation.guidance.bm}</span>
              </p>
            )}
          </div>
          <div className="location-panel__actions">
            <button type="button" className="button-secondary" disabled={interfaceLocked} onClick={() => closeLocationMenu()}>
              Tutup Maklumat
            </button>
          </div>
        </aside>
      )}
    </section>
  )
}
