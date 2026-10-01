import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// base './' faz o site funcionar em qualquer endereço (GitHub Pages, Netlify, pasta local).
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icone.svg', 'icone-180.png'],
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,woff2}'] },
      manifest: {
        name: 'Trilha Ulife',
        short_name: 'Trilha',
        description: 'Jogo de estudo: Matemática Computacional e Exploração Digital',
        lang: 'pt-BR',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        background_color: '#12141c',
        theme_color: '#12141c',
        icons: [
          { src: 'icone-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icone-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  test: { environment: 'node', include: ['src/tests/**/*.test.ts', 'src/tests/**/*.test.tsx'] },
});
