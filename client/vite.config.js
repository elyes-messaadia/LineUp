import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['assets/icon.png'],
      manifest: {
        name: 'LineUp - File d\'attente médicale',
        short_name: 'LineUp',
        description: 'Application de gestion de file d\'attente pour cabinets médicaux',
        theme_color: '#4F46E5',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          utils: ['classnames', 'qrcode.react']
        }
      }
    },
    chunkSizeWarningLimit: 300,
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    }
  },
  server: {
    port: 5174,
    strictPort: false,
    host: true
  },
  preview: {
    port: 5174,
    strictPort: false,
    host: true
  },
  esbuild: {
    jsxInject: `import React from 'react'`
  }
});
