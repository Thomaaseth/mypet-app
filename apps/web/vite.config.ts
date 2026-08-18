import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import path from 'path'
import { fileURLToPath } from 'url'
import type { Plugin } from 'vite'
import { visualizer } from 'rollup-plugin-visualizer'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const BUILD_ID =
  process.env.CF_PAGES_COMMIT_SHA ?? process.env.BUILD_ID ?? Date.now().toString()

function emitVersionJson(): Plugin {
  return {
    name: 'emit-version-json',
    apply: 'build',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({ buildId: BUILD_ID }),
      })
    },
  }
}

export default defineConfig({
  define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(),
    emitVersionJson()
  ],
  resolve: {
    alias: {
      '@/shared': path.resolve(__dirname, '../../packages/shared/src'),
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    strictPort:true,
  },
})