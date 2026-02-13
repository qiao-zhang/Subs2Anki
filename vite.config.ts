import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
// @ts-ignore
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      headers: {
        // Required for SharedArrayBuffer (ffmpeg.wasm)
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      '__APP_VERSION__': JSON.stringify(require('./package.json').version)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        // Alias 'path' to our browser-friendly shim
        'path': path.resolve(__dirname, 'services/path-shim.ts'),
      }
    },
    optimizeDeps: {
      exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util', '@ffmpeg/core'],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // Split external library code from vendor bundle
            external: ['react', 'react-dom', 'react-virtuoso', 'lucide-react', '@ffmpeg/ffmpeg', '@ffmpeg/util', '@ffmpeg/core', 'file-saver'],
          },
        },
      },
      chunkSizeWarningLimit: 1000, // Increase limit to suppress warning (actual optimization is more important)
    },
  };
});
