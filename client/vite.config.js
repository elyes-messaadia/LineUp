import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Désactiver le fast refresh en production
      fastRefresh: process.env.NODE_ENV !== 'production',
    }),
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
    assetsDir: 'assets',
    sourcemap: false, // Désactiver les sourcemaps en production
    minify: 'terser', // Utiliser terser pour la minification
    terserOptions: {
      compress: {
        drop_console: true, // Supprimer les console.log en production
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'utils': ['@heroicons/react', 'classnames']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true
  },
  preview: {
    port: 5173,
    strictPort: true,
    host: true
  }
});
