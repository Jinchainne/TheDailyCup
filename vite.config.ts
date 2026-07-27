import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('react-router-dom')) {
            return 'react';
          }

          if (
            id.includes('node_modules/wagmi') ||
            id.includes('node_modules/viem') ||
            id.includes('@coinbase/wallet-sdk') ||
            id.includes('@tanstack/react-query')
          ) {
            return 'web3';
          }

          if (
            id.includes('node_modules/lucide-react') ||
            id.includes('node_modules/framer-motion') ||
            id.includes('node_modules/qrcode.react')
          ) {
            return 'ui';
          }
        },
      },
    },
  },
})
