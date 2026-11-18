export type KampungRenderMode = 'baked' | 'modular'
export type FogEdgeMode = 'classic' | 'soft'

export interface DevelopmentRenderingConfig {
  kampungRenderMode: KampungRenderMode
  fogEdgeMode: FogEdgeMode
}

export const DEFAULT_RENDERING_CONFIG: DevelopmentRenderingConfig = {
  kampungRenderMode: 'baked',
  fogEdgeMode: 'classic',
}

export const RENDER_MODE_PREFERENCE_KEY = 'sirahQuest.kampungRenderMode.v1'
export const FOG_MODE_PREFERENCE_KEY = 'sirahQuest.fogEdgeMode.v1'

export function readDevelopmentRenderingConfig(): DevelopmentRenderingConfig {
  return {
    kampungRenderMode: localStorage.getItem(RENDER_MODE_PREFERENCE_KEY) === 'modular' ? 'modular' : 'baked',
    fogEdgeMode: localStorage.getItem(FOG_MODE_PREFERENCE_KEY) === 'soft' ? 'soft' : 'classic',
  }
}
