import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { getCurrentLevelProgress } from '../progression/PlayerProgression'
import type { PlayerProgressionState } from '../progression/types'
import type { CameraViewMode } from '../camera/cameraConfig'
import { PERFORMANCE_MONITOR_INCLUDED } from '../performance/FrameDiagnostics'

interface AdventureHUDProps {
  title: string
  progression: PlayerProgressionState
  remainingHints: number
  maxHints: number
  mode: 'WORLD_MAP' | 'AREA_MAP'
  menuOpen: boolean
  actionsLocked: boolean
  reviewAvailable: boolean
  cameraViewMode: CameraViewMode
  mapViewMode: 'region' | 'location'
  visionRadius: number
  performanceMonitorEnabled: boolean
  saveStatus: string
  manualSaveStatus: string
  immersiveControl: ReactNode
  audioControl: ReactNode
  onMenuOpenChange: (open: boolean) => void
  onOpenQuestLog: () => void
  onOpenJournal: () => void
  onReturnWorldMap: () => void
  onOpenUpgrades: () => void
  onOpenMastery: () => void
  onOpenReview: () => void
  onCameraViewModeChange: (mode: CameraViewMode) => void
  onMapViewModeChange: (mode: 'region' | 'location') => void
  onPerformanceMonitorChange: (enabled: boolean) => void
  onManualSave: () => void
  onManualLoad: () => void
  manualLoadDisabled: boolean
  onOpenTutorial: () => void
  onOpenReset: () => void
  onNewTestRun: () => void
}

const Icon = ({ type }: { type: 'quest' | 'journal' | 'map' | 'menu' }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    {type === 'quest' && <path d="M6 4h12v16H6zM9 8h6M9 12h6M9 16h4" />}
    {type === 'journal' && <path d="M3 5.5c3-1.2 6-.8 9 1.2 3-2 6-2.4 9-1.2v14c-3-1.2-6-.8-9 1.2-3-2-6-2.4-9-1.2zM12 6.7v14" />}
    {type === 'map' && <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15" />}
    {type === 'menu' && <path d="M4 7h16M4 12h16M4 17h16" />}
  </svg>
)

export function AdventureHUD(props: AdventureHUDProps) {
  const menuTriggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const level = getCurrentLevelProgress(props.progression)

  useEffect(() => {
    if (props.menuOpen) closeRef.current?.focus()
  }, [props.menuOpen])

  useEffect(() => {
    if (!props.menuOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.repeat) return
      event.preventDefault()
      props.onMenuOpenChange(false)
      window.requestAnimationFrame(() => menuTriggerRef.current?.focus())
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [props.menuOpen, props.onMenuOpenChange])

  const closeMenu = (restore = true) => {
    props.onMenuOpenChange(false)
    if (restore) window.requestAnimationFrame(() => menuTriggerRef.current?.focus())
  }
  const launch = (action: () => void) => {
    closeMenu(false)
    window.requestAnimationFrame(() => {
      menuTriggerRef.current?.focus()
      action()
    })
  }

  return (
    <>
      <header className="adventure-hud" aria-label="HUD pengembaraan">
        <div className="adventure-hud__identity">
          <strong>Sirah Quest</strong>
          <span>{props.title}</span>
        </div>
        <div className="adventure-hud__progress" aria-label="Kemajuan pemain ringkas">
          <strong>Tahap {props.progression.level}</strong>
          <span>{level.isMaxLevel ? 'Maksimum' : `${level.currentXP}/${level.requiredXP} XP`}</span>
          <span>Petunjuk {props.remainingHints}/{props.maxHints}</span>
        </div>
        <nav className="adventure-hud__shortcuts" aria-label="Pintasan pengembaraan">
          <button type="button" disabled={props.actionsLocked} aria-label="Log Quest" title="Log Quest" onClick={props.onOpenQuestLog}><Icon type="quest" /></button>
          <button type="button" disabled={props.actionsLocked} aria-label="Jurnal" title="Jurnal" onClick={props.onOpenJournal}><Icon type="journal" /></button>
          {props.mode === 'AREA_MAP' && <button type="button" disabled={props.actionsLocked} aria-label="Kembali ke Peta Dunia" title="Peta Dunia" onClick={props.onReturnWorldMap}><Icon type="map" /></button>}
          {props.immersiveControl}
          <button
            ref={menuTriggerRef}
            type="button"
            disabled={props.actionsLocked}
            aria-label="Buka menu pengembaraan"
            aria-expanded={props.menuOpen}
            title="Menu"
            onClick={() => props.onMenuOpenChange(!props.menuOpen)}
          ><Icon type="menu" /></button>
        </nav>
      </header>

      <div
        className="adventure-menu-overlay"
        hidden={!props.menuOpen}
        role="presentation"
        onPointerDown={(event) => { if (event.target === event.currentTarget) closeMenu() }}
      >
        <section className="adventure-menu" role="dialog" aria-modal="true" aria-labelledby="adventure-menu-title" onPointerDown={(event) => event.stopPropagation()}>
          <header>
            <div><p>MENU PENGEMBARAAN</p><h2 id="adventure-menu-title">Pilihan Permainan</h2></div>
            <button ref={closeRef} type="button" className="button-secondary" onClick={() => closeMenu()}>Tutup</button>
          </header>
          <div className="adventure-menu__content">
            <details open><summary>Watak</summary><div className="adventure-menu__actions">
              <button type="button" onClick={() => launch(props.onOpenUpgrades)}>Naik Taraf</button>
              <button type="button" onClick={() => launch(props.onOpenMastery)}>Penguasaan</button>
            </div></details>
            <details><summary>Pembelajaran</summary><div className="adventure-menu__actions">
              <button type="button" disabled={!props.reviewAvailable} onClick={() => launch(props.onOpenReview)}>Ulang Kaji</button>
              <button type="button" onClick={() => launch(props.onOpenJournal)}>Jurnal</button>
            </div></details>
            <details><summary>Paparan &amp; Audio</summary><div className="adventure-menu__section">
              {props.mode === 'AREA_MAP' ? <>
                <span>Zum kamera · Radius penglihatan {props.visionRadius} unit</span>
                <div className="adventure-menu__actions"><button type="button" aria-pressed={props.cameraViewMode === 'normal'} onClick={() => props.onCameraViewModeChange('normal')}>Paparan Biasa</button><button type="button" aria-pressed={props.cameraViewMode === 'wide'} onClick={() => props.onCameraViewModeChange('wide')}>Paparan Luas</button></div>
              </> : <>
                <span>Skala Peta Dunia</span>
                <div className="adventure-menu__actions"><button type="button" aria-pressed={props.mapViewMode === 'region'} onClick={() => props.onMapViewModeChange('region')}>Rantau</button><button type="button" aria-pressed={props.mapViewMode === 'location'} onClick={() => props.onMapViewModeChange('location')}>Lokasi</button></div>
              </>}
              {props.audioControl}
              {PERFORMANCE_MONITOR_INCLUDED && <label className="adventure-menu__toggle">
                <input
                  type="checkbox"
                  checked={props.performanceMonitorEnabled}
                  onChange={(event) => props.onPerformanceMonitorChange(event.target.checked)}
                />
                <span>Monitor FPS pembangunan</span>
              </label>}
            </div></details>
            <details><summary>Simpanan</summary><div className="adventure-menu__section">
              <small role="status">{props.saveStatus}</small><small>{props.manualSaveStatus}</small>
              <div className="adventure-menu__actions"><button type="button" onClick={() => launch(props.onManualSave)}>Simpan Permainan</button><button type="button" disabled={props.manualLoadDisabled} onClick={() => launch(props.onManualLoad)}>Muat Permainan</button></div>
            </div></details>
            <details><summary>Bantuan &amp; Lain-lain</summary><div className="adventure-menu__actions">
              <button type="button" onClick={() => launch(props.onOpenTutorial)}>Panduan</button>
              <button type="button" className="is-danger" onClick={() => launch(props.onOpenReset)}>Padam Semua Kemajuan…</button>
              {import.meta.env.DEV && <button type="button" onClick={() => launch(props.onNewTestRun)}>New Test Run</button>}
            </div></details>
          </div>
        </section>
      </div>
    </>
  )
}
