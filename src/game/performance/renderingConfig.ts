export type KampungRenderMode = 'baked' | 'modular'
export type FogEdgeMode = 'classic' | 'soft'
export type FogIsolationMode = 'normal' | 'explored-disabled' | 'all-disabled'

export interface DevelopmentRenderingConfig {
  kampungRenderMode: KampungRenderMode
  fogEdgeMode: FogEdgeMode
  fogIsolationMode: FogIsolationMode
  miniMapDisabled: boolean
  minimalScene: boolean
  syntheticDiscoveryPointCount: number
}

export const DEFAULT_RENDERING_CONFIG: DevelopmentRenderingConfig = {
  kampungRenderMode: 'baked',
  fogEdgeMode: 'classic',
  fogIsolationMode: 'normal',
  miniMapDisabled: false,
  minimalScene: false,
  syntheticDiscoveryPointCount: 0,
}

export const RENDER_MODE_PREFERENCE_KEY = 'sirahQuest.kampungRenderMode.v1'
export const FOG_MODE_PREFERENCE_KEY = 'sirahQuest.fogEdgeMode.v1'

export function readDevelopmentRenderingConfig(): DevelopmentRenderingConfig {
  const isolation = import.meta.env.DEV
    ? new URLSearchParams(window.location.search).get('n09gIsolation')
    : null
  const syntheticPoints = import.meta.env.DEV
    ? Number(new URLSearchParams(window.location.search).get('n09gSyntheticPoints'))
    : 0
  return {
    kampungRenderMode: localStorage.getItem(RENDER_MODE_PREFERENCE_KEY) === 'modular' ? 'modular' : 'baked',
    fogEdgeMode: localStorage.getItem(FOG_MODE_PREFERENCE_KEY) === 'soft' ? 'soft' : 'classic',
    fogIsolationMode: isolation === 'minimal-scene' ? 'all-disabled'
      : isolation === 'explored-disabled' || isolation === 'all-disabled' ? isolation : 'normal',
    miniMapDisabled: isolation === 'mini-map-disabled' || isolation === 'minimal-scene',
    minimalScene: isolation === 'minimal-scene',
    syntheticDiscoveryPointCount: Number.isInteger(syntheticPoints) && syntheticPoints > 0
      ? Math.min(syntheticPoints, 2500)
      : 0,
  }
}
