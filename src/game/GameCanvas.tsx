import { useEffect, useRef } from 'react'
import { createGame } from './bootstrap'

export function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const game = createGame(container)

    return () => {
      game.destroy(true)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="game-canvas"
      aria-label="Sirah Quest movement prototype"
      role="application"
    />
  )
}
