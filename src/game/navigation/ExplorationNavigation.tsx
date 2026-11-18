import { useEffect, useMemo, useRef, useState } from 'react'
import type { AreaDefinition } from '../areas/types'
import { Pathfinder } from './Pathfinder'
import type { AreaPlaySession, PlayerPosition } from '../session/types'
import type { QuestNavigationState, QuestNavigationTarget } from './questNavigation'
import type { BilingualText } from '../questions/types'
import { getStaticAreaMap } from './illustratedAreaMap'

interface ExplorationNavigationProps {
  area: AreaDefinition
  session: AreaPlaySession
  visionRadius: number
  waypoint?: PlayerPosition
  questNavigation: QuestNavigationState
  disabled: boolean
  onWaypointChange: (waypoint: PlayerPosition | undefined) => void
  onExpandedChange: (open: boolean) => void
}

interface MapCanvasProps {
  area: AreaDefinition
  session: AreaPlaySession
  visionRadius: number
  waypoint?: PlayerPosition
  questTarget?: QuestNavigationTarget
  interactive?: boolean
  onSelect?: (position: PlayerPosition) => void
  label: string
}

const MAP_DRAW_WIDTH = 720
const NORTH_STAR_LABEL: BilingualText = {
  bm: 'Penunjuk arah utara',
  en: 'North direction indicator',
}

function isExplored(session: AreaPlaySession, position: PlayerPosition) {
  return session.fogDiscoveryPoints.some(
    (point) => Math.hypot(position.x - point.x, position.y - point.y) <= point.radius,
  )
}

function clipDiscovery(
  context: CanvasRenderingContext2D,
  points: AreaPlaySession['fogDiscoveryPoints'],
  scaleX: number,
  scaleY: number,
) {
  context.beginPath()
  points.forEach((point) => {
    context.moveTo((point.x + point.radius) * scaleX, point.y * scaleY)
    context.ellipse(
      point.x * scaleX,
      point.y * scaleY,
      point.radius * scaleX,
      point.radius * scaleY,
      0,
      0,
      Math.PI * 2,
    )
  })
  context.clip()
}

function renderMap(
  canvas: HTMLCanvasElement,
  area: AreaDefinition,
  session: AreaPlaySession,
  visionRadius: number,
  waypoint?: PlayerPosition,
  questTarget?: QuestNavigationTarget,
) {
  const height = Math.round(MAP_DRAW_WIDTH * area.height / area.width)
  if (canvas.width !== MAP_DRAW_WIDTH) canvas.width = MAP_DRAW_WIDTH
  if (canvas.height !== height) canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) return

  const scaleX = canvas.width / area.width
  const scaleY = canvas.height / area.height
  const staticBaseMap = getStaticAreaMap(area, canvas.width, canvas.height)
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = '#030711'
  context.fillRect(0, 0, canvas.width, canvas.height)

  context.save()
  clipDiscovery(context, session.fogDiscoveryPoints, scaleX, scaleY)
  context.drawImage(staticBaseMap, 0, 0)
  context.fillStyle = 'rgba(3, 12, 18, 0.42)'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.restore()

  context.save()
  context.beginPath()
  context.ellipse(
    session.playerPosition.x * scaleX,
    session.playerPosition.y * scaleY,
    visionRadius * scaleX,
    visionRadius * scaleY,
    0,
    0,
    Math.PI * 2,
  )
  context.clip()
  context.drawImage(staticBaseMap, 0, 0)
  context.restore()

  area.clues.forEach((clue) => {
    const state = session.clues[clue.id]?.state ?? clue.state
    if (state === 'hidden') return
    const x = clue.x * scaleX
    const y = clue.y * scaleY
    context.beginPath()
    context.arc(x, y, 6, 0, Math.PI * 2)
    context.fillStyle = state === 'completed' ? '#78c59b' : '#f4d58d'
    context.fill()
    context.strokeStyle = '#fff7df'
    context.lineWidth = 2
    context.stroke()
  })

  if (waypoint) {
    const x = waypoint.x * scaleX
    const y = waypoint.y * scaleY
    context.strokeStyle = '#e7b4ff'
    context.fillStyle = '#8c4bb4'
    context.lineWidth = 2
    context.beginPath()
    context.arc(x, y, 7, 0, Math.PI * 2)
    context.fill()
    context.stroke()
    context.beginPath()
    context.moveTo(x - 10, y)
    context.lineTo(x + 10, y)
    context.moveTo(x, y - 10)
    context.lineTo(x, y + 10)
    context.stroke()
  }

  if (questTarget?.position) {
    const x = questTarget.position.x * scaleX
    const y = questTarget.position.y * scaleY
    context.save()
    context.translate(x, y)
    context.rotate(Math.PI / 4)
    context.fillStyle = '#f6c85f'
    context.strokeStyle = '#fff7d6'
    context.lineWidth = 2
    context.fillRect(-7, -7, 14, 14)
    context.strokeRect(-7, -7, 14, 14)
    context.restore()
  }

  const playerX = session.playerPosition.x * scaleX
  const playerY = session.playerPosition.y * scaleY
  context.beginPath()
  context.arc(playerX, playerY, 7, 0, Math.PI * 2)
  context.fillStyle = '#4fd1c5'
  context.fill()
  context.strokeStyle = '#ffffff'
  context.lineWidth = 2
  context.stroke()

  context.strokeStyle = 'rgba(244, 213, 141, 0.65)'
  context.lineWidth = 2
  context.strokeRect(1, 1, canvas.width - 2, canvas.height - 2)
}

function MapCanvas({
  area,
  session,
  visionRadius,
  waypoint,
  questTarget,
  interactive = false,
  onSelect,
  label,
}: MapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const frame = window.requestAnimationFrame(() => {
      renderMap(canvas, area, session, visionRadius, waypoint, questTarget)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [area, session.playerPosition, session.fogDiscoveryPoints, session.clues, visionRadius, waypoint, questTarget])

  const selectPosition = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas || !onSelect) return
    const bounds = canvas.getBoundingClientRect()
    onSelect({
      x: (clientX - bounds.left) / bounds.width * area.width,
      y: (clientY - bounds.top) / bounds.height * area.height,
    })
  }

  return (
    <canvas
      ref={canvasRef}
      className={`exploration-map-canvas${interactive ? ' is-interactive' : ''}`}
      style={{ aspectRatio: `${area.width} / ${area.height}` }}
      aria-label={label}
      role="img"
      onPointerDown={interactive ? (event) => {
        event.preventDefault()
        event.stopPropagation()
        selectPosition(event.clientX, event.clientY)
      } : undefined}
    />
  )
}

export function ExplorationNavigation({
  area,
  session,
  visionRadius,
  waypoint,
  questNavigation,
  disabled,
  onWaypointChange,
  onExpandedChange,
}: ExplorationNavigationProps) {
  const [expanded, setExpanded] = useState(false)
  const [collapsed, setCollapsed] = useState(() =>
    window.matchMedia('(max-height: 500px) and (orientation: landscape)').matches,
  )
  const [message, setMessage] = useState('Pilih kawasan yang telah diterokai.')
  const pathfinder = useMemo(() => new Pathfinder(area), [area])
  const bearing = useMemo(() => {
    const target = questNavigation.target?.position
    if (!target || questNavigation.status !== 'known') return undefined
    const deltaX = target.x - session.playerPosition.x
    const deltaY = target.y - session.playerPosition.y
    return {
      degrees: Math.atan2(deltaY, deltaX) * 180 / Math.PI + 90,
      distance: Math.round(Math.hypot(deltaX, deltaY)),
    }
  }, [questNavigation, session.playerPosition])

  useEffect(() => {
    onExpandedChange(expanded)
  }, [expanded, onExpandedChange])

  useEffect(() => {
    if (!expanded) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      setExpanded(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [expanded])

  useEffect(() => {
    if (disabled) setExpanded(false)
  }, [disabled])

  const placeWaypoint = (position: PlayerPosition) => {
    if (position.x < 0 || position.x > area.width || position.y < 0 || position.y > area.height) {
      setMessage('Destinasi berada di luar sempadan peta.')
      return
    }
    if (!isExplored(session, position)) {
      setMessage('Destinasi mesti berada dalam kawasan yang telah diterokai.')
      return
    }
    if (!pathfinder.isPointWalkable(position)) {
      setMessage('Destinasi itu terhalang. Pilih ruang yang boleh dilalui.')
      return
    }
    onWaypointChange(position)
    setMessage('Tanda destinasi telah ditetapkan.')
  }

  return (
    <>
      <svg className="north-star" viewBox="0 0 48 48" role="img" aria-label={NORTH_STAR_LABEL.bm}>
        <path className="north-star__tip" d="M24 2 30 20 24 17 18 20Z" />
        <path className="north-star__body" d="M24 46 18 28 24 31 30 28ZM2 24 20 18 17 24 20 30ZM46 24 28 30 31 24 28 18Z" />
        <circle className="north-star__core" cx="24" cy="24" r="4" />
      </svg>
      <aside className={`mini-map${collapsed ? ' is-collapsed' : ''}`} aria-label="Mini Map kawasan">
        <div className="mini-map__header">
          <strong>Mini Map</strong>
          <button
            type="button"
            aria-expanded={!collapsed}
            aria-label={collapsed ? 'Buka Mini Map' : 'Kecilkan Mini Map'}
            onClick={() => setCollapsed((value) => !value)}
          >
            {collapsed ? '＋' : '−'}
          </button>
        </div>
        {!collapsed && (
          <>
            <MapCanvas
              area={area}
              session={session}
              visionRadius={visionRadius}
              waypoint={waypoint}
              questTarget={questNavigation.status === 'known' ? questNavigation.target : undefined}
              label={`Mini Map ${area.nameBM}`}
            />
            <button type="button" className="mini-map__expand" disabled={disabled} onClick={() => setExpanded(true)}>
              Peta Kawasan
            </button>
          </>
        )}
      </aside>

      {questNavigation.status !== 'untracked' && (
        <aside className={`quest-compass is-${questNavigation.status}`} aria-label="Kompas misi">
          <span
            className="quest-compass__arrow"
            style={bearing ? { transform: `rotate(${bearing.degrees}deg)` } : undefined}
            aria-hidden="true"
          >▲</span>
          <span>
            <strong>{questNavigation.target?.questTitle.bm ?? 'Misi selesai'}</strong>
            <small>{questNavigation.guidance.bm}</small>
            {bearing && <small>{bearing.distance} unit · arah terus</small>}
          </span>
        </aside>
      )}

      {expanded && (
        <div className="exploration-map-overlay" role="presentation" onPointerDown={(event) => event.stopPropagation()}>
          <section className="exploration-map-panel" role="dialog" aria-modal="true" aria-labelledby="exploration-map-title">
            <header>
              <div>
                <p>PETA EKSPLORASI</p>
                <h3 id="exploration-map-title">Peta Kawasan · {area.nameBM}</h3>
              </div>
              <button type="button" autoFocus onClick={() => setExpanded(false)}>Tutup</button>
            </header>
            <div className="exploration-map-panel__map">
              <MapCanvas
                area={area}
                session={session}
                visionRadius={visionRadius}
                waypoint={waypoint}
                questTarget={questNavigation.status === 'known' ? questNavigation.target : undefined}
                interactive
                onSelect={placeWaypoint}
                label={`Peta Kawasan ${area.nameBM}. Pilih kawasan diterokai untuk meletakkan tanda destinasi.`}
              />
            </div>
            <div className="exploration-map-legend" aria-label="Petunjuk peta">
              <span><i className="is-player" /> Anda Di Sini</span>
              <span><i className="is-explored" /> Kawasan Diterokai</span>
              <span><i className="is-clue" /> Petunjuk Ditemui</span>
              <span><i className="is-waypoint" /> Tanda Destinasi</span>
              <span><i className="is-quest" /> Sasaran Misi Ditemui</span>
            </div>
            <p className="exploration-map-panel__message" role="status">{message}</p>
            <div className="exploration-map-panel__actions">
              <button
                type="button"
                disabled={!waypoint}
                onClick={() => {
                  onWaypointChange(undefined)
                  setMessage('Tanda destinasi telah dipadam.')
                }}
              >
                Padam Tanda
              </button>
              <button type="button" onClick={() => setExpanded(false)}>Tutup</button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
