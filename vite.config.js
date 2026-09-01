import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Bytes POS',
        short_name: 'Bytes',
        display: 'standalone',
        orientation: 'landscape',
        background_color: '#f5ead8',
        theme_color: '#643312',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'gfonts-css' }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
            handler: 'CacheFirst',
            options: { cacheName: 'gfonts', expiration: { maxEntries: 12, maxAgeSeconds: 31536000 } }
          }
        ]
      }
    })
  ]
})
