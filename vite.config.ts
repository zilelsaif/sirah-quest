import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const excludePerformanceMonitor = env.VITE_INCLUDE_PERFORMANCE_MONITOR === 'false'
  const disabledMonitorPath = decodeURIComponent(
    new URL('./src/game/performance/FrameDiagnostics.disabled.tsx', import.meta.url).pathname,
  ).replace(/^\/([A-Za-z]:)/, '$1')
  return {
    plugins: [react()],
    resolve: {
      alias: excludePerformanceMonitor ? [{
        find: /^(?:.*\/)FrameDiagnostics$/,
        replacement: disabledMonitorPath,
      }] : [],
    },
  }
})
