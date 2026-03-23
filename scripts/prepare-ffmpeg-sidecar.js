import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const tauriDir = path.join(repoRoot, 'src-tauri');
const binDir = path.join(tauriDir, 'bin');

const sourceArg = process.argv[2] || process.env.SUBS2ANKI_FFMPEG_SOURCE;
const target = process.argv[3] || process.env.TAURI_TARGET_TRIPLE || process.env.CARGO_BUILD_TARGET || 'x86_64-pc-windows-msvc';

if (!sourceArg) {
  console.error('Usage: node scripts/prepare-ffmpeg-sidecar.js <path-to-ffmpeg-binary> [target-triple]');
  console.error('Or set SUBS2ANKI_FFMPEG_SOURCE and optionally TAURI_TARGET_TRIPLE.');
  process.exit(1);
}

const sourcePath = path.resolve(sourceArg);
if (!fs.existsSync(sourcePath) || !fs.statSync(sourcePath).isFile()) {
  console.error(`FFmpeg binary not found: ${sourcePath}`);
  process.exit(1);
}

fs.mkdirSync(binDir, { recursive: true });
const extension = target.includes('windows') ? '.exe' : '';
const destinationPath = path.join(binDir, `ffmpeg-${target}${extension}`);
fs.copyFileSync(sourcePath, destinationPath);
console.log(`Copied FFmpeg sidecar to ${destinationPath}`);

