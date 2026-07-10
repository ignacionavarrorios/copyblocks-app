import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  base: './',
  plugins: [tailwindcss(), react()],
  server: {
    watch: {
      ignored: [
        '**/.codex-run/**',
        '**/.tmp/**',
        '**/.npm-cache/**',
        '**/adblocks-*.log',
        '**/data/store.json',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
