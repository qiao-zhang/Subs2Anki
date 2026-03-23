import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv, Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tauriBuildCleanupPlugin = (isTauriBuild: boolean): Plugin => ({
  name: 'tauri-build-cleanup',
  closeBundle() {
    if (!isTauriBuild) {
      return;
    }

    const ffmpegDir = path.resolve(__dirname, 'dist', 'ffmpeg');
    if (fs.existsSync(ffmpegDir)) {
      fs.rmSync(ffmpegDir, { recursive: true, force: true });
    }
  },
});

// https://vitejs.dev/config/
// @ts-ignore
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const isTauriBuild = mode === 'tauri';
  const externalChunkLibraries = ['react', 'react-dom', 'react-virtuoso', 'lucide-react', 'file-saver'];

  if (!isTauriBuild) {
    externalChunkLibraries.push('@ffmpeg/ffmpeg', '@ffmpeg/util', '@ffmpeg/core');
  }

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      headers: isTauriBuild ? undefined : {
        // Required for SharedArrayBuffer (ffmpeg.wasm)
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
    },
    plugins: [react(), tauriBuildCleanupPlugin(isTauriBuild)],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      '__APP_VERSION__': JSON.stringify(require('./package.json').version),
      '__TAURI_BUILD__': JSON.stringify(isTauriBuild),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        // Alias 'path' to our browser-friendly shim
        'path': path.resolve(__dirname, 'services/path-shim.ts'),
      }
    },
    optimizeDeps: isTauriBuild ? undefined : {
      exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util', '@ffmpeg/core'],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // Split external library code from vendor bundle
            external: externalChunkLibraries,
          },
        },
      },
      chunkSizeWarningLimit: 1000, // Increase limit to suppress warning (actual optimization is more important)
    },
  };
});
