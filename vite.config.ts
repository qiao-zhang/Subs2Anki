
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to copy WASM files
const copyWasmFiles = (sourceDir: string, destDir: string, files: string[]) => {
  // Create destination directory if it doesn't exist
  if (!existsSync(destDir)) {
    mkdirSync(destDir, { recursive: true });
  }

  files.forEach(file => {
    const sourcePath = path.join(sourceDir, file);
    const destPath = path.join(destDir, file);

    if (existsSync(sourcePath)) {
      copyFileSync(sourcePath, destPath);
      console.log(`Copied ${sourcePath} to ${destPath}`);
    } else {
      console.warn(`Warning: ${sourcePath} does not exist`);
    }
  });
};

// Custom plugin to copy WASM files
const copyWasmPlugin = {
  name: 'copy-wasm-files',
  apply: 'build', // Only run during build
  configResolved() {
    // Copy files when config is resolved
    /*
    copyWasmFiles(
      path.resolve(__dirname, 'node_modules/sql.js/dist'),
      path.resolve(__dirname, 'dist/assets/sql.js'),
      [
      'sql-wasm.wasm',
      'sql-asm.js',
      'sql-wasm.js',
    ]);
     */
    copyWasmFiles(
      path.resolve(__dirname, 'node_modules/@ffmpeg/core/dist/esm'),
      path.resolve(__dirname, 'dist/assets/ffmpeg'),
      [
        'ffmpeg-core.js',
        'ffmpeg-core.wasm',
      ]
    )
  }
};

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
    plugins: [react(), copyWasmPlugin],
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
      exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util', '@ffmpeg/core'],
    },
  };
});
