
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
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
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        // Alias 'path' to our browser-friendly shim
        'path': path.resolve(__dirname, 'core/path-shim.ts'),
      }
    },
    optimizeDeps: {
      exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
    },
  };
});
