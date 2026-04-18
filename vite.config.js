import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),

    // ─── PWA — Phase 8 ───────────────────────────────────────
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',

      // Web App Manifest
      manifest: {
        name: 'CivicFix — Civic Issue Tracker',
        short_name: 'CivicFix',
        description: 'Report, track, and resolve civic issues in your community.',
        theme_color: '#2563eb',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Report Issue',
            short_name: 'Report',
            description: 'Submit a new civic issue',
            url: '/report',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
          },
          {
            name: 'Track Report',
            short_name: 'Track',
            description: 'Track your submitted report',
            url: '/track',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
          },
        ],
        categories: ['utilities', 'productivity', 'social'],
      },

      // Workbox Strategy Config
      workbox: {
        // App shell — cache core assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],

        // Runtime caching strategies
        runtimeCaching: [
          // API: reports feed — network-first with 60s timeout
          {
            urlPattern: /^https?:\/\/.*\/api\/reports(?!.*\/map)/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-reports-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5, // 5 minutes
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // API: map data — stale-while-revalidate
          {
            urlPattern: /^https?:\/\/.*\/api\/reports\/map/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-map-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 10, // 10 minutes
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Tile images (OpenStreetMap) — cache-first
          {
            urlPattern: /^https:\/\/.*\.tile\.openstreetmap\.org\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles-cache',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Google Fonts
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],

        // Offline fallback
        navigateFallback: '/offline.html',
        navigateFallbackDenylist: [/^\/api\//],
      },

      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],

  // ─── Build Optimization — Phase 8.3 ────────────────────────
  build: {
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'map-vendor': ['leaflet', 'react-leaflet'],
          'socket-vendor': ['socket.io-client'],
        },
      },
    },
    // Enable source maps for production debugging
    sourcemap: false,
    // Chunk size warning threshold
    chunkSizeWarningLimit: 1000,
  },
});
