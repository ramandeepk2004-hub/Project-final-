import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        name: 'Omni Translator',
        short_name: 'OmniTranslate',
        description: 'Real-time translation for speech, text, and images.',
        theme_color: '#0B1220',
        background_color: '#0B1220',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,ico,json}'],
      },
    }),
  ],
  server: {
    proxy: {
      '/process': 'http://localhost:8000',
      '/process-audio': 'http://localhost:8000',
      '/process-image': 'http://localhost:8000',
      '/translate-image': 'http://localhost:8000',
      '/translate-pdf': 'http://localhost:8000',
      '/translate-text-file': 'http://localhost:8000',
      '/process-text': 'http://localhost:8000',
      '/phrase-suggestions': 'http://localhost:8000',
      '/ai': 'http://localhost:8000',
      '/ws/stream-translate': {
        target: 'ws://localhost:8000',
        ws: true
      },
      '/export': 'http://localhost:8000',
      '/languages': 'http://localhost:8000',
      '/audio': 'http://localhost:8000',
      '/exports': 'http://localhost:8000'
    }
  }
});
