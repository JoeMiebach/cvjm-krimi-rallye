import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Team-App: Deployment im Domain-Root -> base bleibt '/'
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'Viking-Schatz Stadtrallye',
        short_name: 'Viking-Rallye',
        description: 'Krimi-Stadtrallye "Der verschwundene Viking-Schatz" – CVJM Ründeroths',
        theme_color: '#0f766e',
        background_color: '#fdf8ee',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        // App-Shell offline cachen, API-Calls bewusst NICHT cachen
        // (Spielstand muss immer aktuell sein)
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,png,svg,ico}']
      }
    })
  ],
  server: {
    port: 5173
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});
