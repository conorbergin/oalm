import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    solidPlugin(),
    VitePWA({ 
      registerType: 'autoUpdate',
      devOptions:{enabled:true},
      manifest: {
        name: 'Infinite Notebook',
        short_name: 'Infinite Notebook',
        description: 'A notebook that never runs out of pages',
        theme_color: '#ffffff',
        icons: [
          {
            src: '/icon.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      }
    })
  ],
  build: {
    target: 'esnext',
  },
});
