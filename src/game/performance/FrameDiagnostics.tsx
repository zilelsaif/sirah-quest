import { useEffect, useRef } from 'react'

export const PERFORMANCE_MONITOR_INCLUDED = import.meta.env.VITE_INCLUDE_PERFORMANCE_MONITOR !== 'false'
export const PERFORMANCE_MONITOR_PREFERENCE_KEY = 'sirahQuest.performanceMonitor.v1'
export const FRAME_DIAGNOSTIC_BUFFER_SIZE = 600
export const FRAME_DIAGNOSTIC_UPDATE_MS = 500

export interface FrameDiagnosticSnapshot {
  sampleCount: number
  medianFps: number
  medianFrameMs: number
  p95FrameMs: number
  over33Ms: number
  over50Ms: number
  sceneLoadMs: number
  displayObjectCount: number
  activeMaskCount: number
  textureCount: number
  renderLabel: string
}

const EMPTY_SNAPSHOT: FrameDiagnosticSnapshot = {
  sampleCount: 0,
  medianFps: 0,
  medianFrameMs: 0,
  p95FrameMs: 0,
  over33Ms: 0,
  over50Ms: 0,
  sceneLoadMs: 0,
  displayObjectCount: 0,
  activeMaskCount: 0,
  textureCount: 0,
  renderLabel: 'pending',
}

function percentile(sorted: readonly number[], fraction: number) {
  if (sorted.length === 0) return 0
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1)]
}

export class FrameDiagnostics {
  private readonly samples = new Float64Array(FRAME_DIAGNOSTIC_BUFFER_SIZE)
  private sampleCount = 0
  private writeIndex = 0
  private lastPublishedAt = 0
  private skipNextSample = true
  private listeners = new Set<(snapshot: FrameDiagnosticSnapshot) => void>()
  private sceneMetrics = {
    sceneLoadMs: 0, displayObjectCount: 0, activeMaskCount: 0, textureCount: 0, renderLabel: 'pending',
  }

  record(deltaMs: number, now = performance.now()) {
    if (document.hidden || !Number.isFinite(deltaMs) || deltaMs <= 0) {
      this.skipNextSample = true
      return
    }
    if (this.skipNextSample) {
      this.skipNextSample = false
      return
    }

    this.samples[this.writeIndex] = deltaMs
    this.writeIndex = (this.writeIndex + 1) % FRAME_DIAGNOSTIC_BUFFER_SIZE
    this.sampleCount = Math.min(this.sampleCount + 1, FRAME_DIAGNOSTIC_BUFFER_SIZE)

    if (now - this.lastPublishedAt >= FRAME_DIAGNOSTIC_UPDATE_MS) {
      this.lastPublishedAt = now
      this.publish()
    }
  }

  pause() {
    this.skipNextSample = true
  }

  clear() {
    this.sampleCount = 0
    this.writeIndex = 0
    this.lastPublishedAt = 0
    this.skipNextSample = true
    this.publish()
  }

  setSceneMetrics(metrics: typeof this.sceneMetrics) {
    this.sceneMetrics = metrics
    this.publish()
  }

  snapshot(): FrameDiagnosticSnapshot {
    if (this.sampleCount === 0) return { ...EMPTY_SNAPSHOT, ...this.sceneMetrics }
    const ordered = Array.from(this.samples.slice(0, this.sampleCount)).sort((a, b) => a - b)
    const medianFrameMs = percentile(ordered, 0.5)
    return {
      sampleCount: this.sampleCount,
      medianFps: medianFrameMs > 0 ? 1000 / medianFrameMs : 0,
      medianFrameMs,
      p95FrameMs: percentile(ordered, 0.95),
      over33Ms: ordered.filter((value) => value > 33).length,
      over50Ms: ordered.filter((value) => value > 50).length,
      ...this.sceneMetrics,
    }
  }

  subscribe(listener: (snapshot: FrameDiagnosticSnapshot) => void) {
    this.listeners.add(listener)
    listener(this.snapshot())
    return () => { this.listeners.delete(listener) }
  }

  private publish() {
    const snapshot = this.snapshot()
    this.listeners.forEach((listener) => listener(snapshot))
  }
}

export function FrameDiagnosticsOverlay({ diagnostics }: { diagnostics: FrameDiagnostics }) {
  const fpsRef = useRef<HTMLElement>(null)
  const frameRef = useRef<HTMLSpanElement>(null)
  const p95Ref = useRef<HTMLElement>(null)
  const slowRef = useRef<HTMLElement>(null)
  const sampleRef = useRef<HTMLElement>(null)
  const sceneRef = useRef<HTMLElement>(null)

  useEffect(() => diagnostics.subscribe((snapshot) => {
    if (fpsRef.current) fpsRef.current.textContent = `${snapshot.medianFps.toFixed(0)} FPS`
    if (frameRef.current) frameRef.current.textContent = `${snapshot.medianFrameMs.toFixed(1)} ms`
    if (p95Ref.current) p95Ref.current.textContent = `P95 ${snapshot.p95FrameMs.toFixed(1)} ms`
    if (slowRef.current) slowRef.current.textContent = `>33 ms ${snapshot.over33Ms} · >50 ms ${snapshot.over50Ms}`
    if (sampleRef.current) sampleRef.current.textContent = `${snapshot.sampleCount}/${FRAME_DIAGNOSTIC_BUFFER_SIZE} sampel`
    if (sceneRef.current) sceneRef.current.textContent = `${snapshot.renderLabel} · load ${snapshot.sceneLoadMs.toFixed(0)} ms · obj ${snapshot.displayObjectCount} · mask ${snapshot.activeMaskCount} · tex ${snapshot.textureCount}`
  }), [diagnostics])

  return (
    <aside className="frame-diagnostics" aria-label="Diagnostik prestasi pembangunan">
      <strong ref={fpsRef}>0 FPS</strong>
      <span ref={frameRef}>0.0 ms</span>
      <small ref={p95Ref}>P95 0.0 ms</small>
      <small ref={slowRef}>&gt;33 ms 0 · &gt;50 ms 0</small>
      <small ref={sampleRef}>0/{FRAME_DIAGNOSTIC_BUFFER_SIZE} sampel</small>
      <small ref={sceneRef}>Menunggu diagnostik scene</small>
    </aside>
  )
}
