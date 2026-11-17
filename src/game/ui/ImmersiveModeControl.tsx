import { useCallback, useEffect, useRef } from 'react'
import type { RefObject } from 'react'

export type ImmersiveMode = 'windowed' | 'native-fullscreen' | 'focus-mode'

interface ImmersiveModeControlProps {
  hostRef: RefObject<HTMLElement | null>
  mode: ImmersiveMode
  escapeBlocked: boolean
  onModeChange: (mode: ImmersiveMode) => void
}

export function ImmersiveModeControl({ hostRef, mode, escapeBlocked, onModeChange }: ImmersiveModeControlProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const modeRef = useRef(mode)
  const bodyOverflowRef = useRef<string | null>(null)
  const scrollPositionRef = useRef(0)
  modeRef.current = mode

  const commitMode = useCallback((nextMode: ImmersiveMode) => {
    modeRef.current = nextMode
    onModeChange(nextMode)
  }, [onModeChange])

  const restoreFocus = useCallback(() => {
    window.requestAnimationFrame(() => buttonRef.current?.focus())
  }, [])

  const leaveFocusMode = useCallback(() => {
    if (bodyOverflowRef.current !== null) {
      document.body.style.overflow = bodyOverflowRef.current
      bodyOverflowRef.current = null
    }
    commitMode('windowed')
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: scrollPositionRef.current })
      buttonRef.current?.focus()
    })
  }, [commitMode])

  const enterFocusMode = useCallback(() => {
    if (bodyOverflowRef.current === null) bodyOverflowRef.current = document.body.style.overflow
    scrollPositionRef.current = window.scrollY
    document.body.style.overflow = 'hidden'
    commitMode('focus-mode')
  }, [commitMode])

  useEffect(() => {
    const reconcileNativeFullscreen = () => {
      if (document.fullscreenElement === hostRef.current) {
        commitMode('native-fullscreen')
      } else if (modeRef.current === 'native-fullscreen') {
        commitMode('windowed')
        restoreFocus()
      }
    }
    const handleFullscreenError = () => {
      if (modeRef.current === 'windowed') enterFocusMode()
    }
    document.addEventListener('fullscreenchange', reconcileNativeFullscreen)
    document.addEventListener('fullscreenerror', handleFullscreenError)
    document.addEventListener('visibilitychange', reconcileNativeFullscreen)
    window.addEventListener('focus', reconcileNativeFullscreen)
    window.addEventListener('resize', reconcileNativeFullscreen)
    return () => {
      document.removeEventListener('fullscreenchange', reconcileNativeFullscreen)
      document.removeEventListener('fullscreenerror', handleFullscreenError)
      document.removeEventListener('visibilitychange', reconcileNativeFullscreen)
      window.removeEventListener('focus', reconcileNativeFullscreen)
      window.removeEventListener('resize', reconcileNativeFullscreen)
      if (bodyOverflowRef.current !== null) document.body.style.overflow = bodyOverflowRef.current
    }
  }, [commitMode, enterFocusMode, hostRef, restoreFocus])

  useEffect(() => {
    if (mode !== 'focus-mode') return
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.repeat || escapeBlocked) return
      event.preventDefault()
      leaveFocusMode()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [escapeBlocked, leaveFocusMode, mode])

  const toggleImmersiveMode = async () => {
    const host = hostRef.current
    if (!host) return
    if (mode === 'focus-mode') {
      leaveFocusMode()
      return
    }
    if (mode === 'native-fullscreen') {
      try { await document.exitFullscreen() } catch { commitMode('windowed'); restoreFocus() }
      return
    }

    if (typeof host.requestFullscreen !== 'function') {
      enterFocusMode()
      return
    }
    try {
      await host.requestFullscreen()
      if (document.fullscreenElement === host) commitMode('native-fullscreen')
      window.requestAnimationFrame(() => {
        if (modeRef.current === 'native-fullscreen' && document.fullscreenElement !== host) {
          commitMode('windowed')
          restoreFocus()
        }
      })
    } catch {
      enterFocusMode()
    }
  }

  const active = mode !== 'windowed'
  const label = active ? 'Keluar paparan imersif' : 'Buka paparan imersif'

  return (
    <div className="immersive-toolbar" aria-label="Kawalan paparan">
      {mode === 'focus-mode' && <span className="immersive-toolbar__status" role="status">Mod Fokus</span>}
      <button
        ref={buttonRef}
        type="button"
        className="immersive-toggle"
        aria-label={label}
        aria-pressed={active}
        title={label}
        onClick={toggleImmersiveMode}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          {active ? (
            <path d="M9 3v6H3M15 3v6h6M9 21v-6H3M15 21v-6h6" />
          ) : (
            <path d="M9 3H3v6M15 3h6v6M9 21H3v-6M15 21h6v-6" />
          )}
        </svg>
      </button>
    </div>
  )
}
