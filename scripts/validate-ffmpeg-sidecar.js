import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const tauriDir = path.join(repoRoot, 'src-tauri');
const binDir = path.join(tauriDir, 'bin');

const SUPPORTED_TARGETS = [
  'x86_64-pc-windows-msvc',
  'aarch64-pc-windows-msvc',
  'x86_64-apple-darwin',
  'aarch64-apple-darwin',
  'x86_64-unknown-linux-gnu',
  'aarch64-unknown-linux-gnu',
];

const args = process.argv.slice(2);
const requestedTargets = [];
let validateAllSupported = false;
let validateBundle = false;
let customBundleDir = null;

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  if (arg === '--target') {
    requestedTargets.push(args[index + 1]);
    index += 1;
    continue;
  }
  if (arg === '--all-supported') {
    validateAllSupported = true;
    continue;
  }
  if (arg === '--bundle') {
    validateBundle = true;
    continue;
  }
  if (arg === '--bundle-dir') {
    customBundleDir = path.resolve(args[index + 1]);
    index += 1;
  }
}

const hostTarget = process.env.TAURI_TARGET_TRIPLE || process.env.CARGO_BUILD_TARGET || guessHostTarget();
const targets = validateAllSupported ? SUPPORTED_TARGETS : (requestedTargets.length > 0 ? requestedTargets : [hostTarget]);

if (targets.some((target) => !target)) {
  console.error('Unable to determine the target triple. Pass --target <triple>.');
  process.exit(1);
}

const failures = [];
for (const target of targets) {
  if (validateBundle) {
    const result = validateBundleContainsSidecar(target, customBundleDir);
    if (!result.ok) failures.push(result.message);
    else console.log(`✔ ${result.message}`);
  } else {
    const result = validateSourceSidecarExists(target);
    if (!result.ok) failures.push(result.message);
    else console.log(`✔ ${result.message}`);
  }
}

if (failures.length > 0) {
  console.error('\nFFmpeg sidecar validation failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

function validateSourceSidecarExists(target) {
  const expectedFile = path.join(binDir, expectedSidecarName(target));
  if (!fs.existsSync(expectedFile)) {
    return {
      ok: false,
      message: `Missing source sidecar for ${target}. Expected ${expectedFile}. Run \`npm run prepare:ffmpeg-sidecar -- <path-to-ffmpeg-binary> ${target}\`.`,
    };
  }

  return {
    ok: true,
    message: `Found source sidecar for ${target}: ${expectedFile}`,
  };
}

function validateBundleContainsSidecar(target, bundleDir) {
  const directoriesToSearch = [
    bundleDir,
    path.join(tauriDir, 'target', 'release', 'bundle'),
    path.join(tauriDir, 'target', target, 'release', 'bundle'),
  ].filter(Boolean);

  const candidates = new Set(sidecarCandidateNames(target));
  for (const directory of directoriesToSearch) {
    if (!fs.existsSync(directory)) {
      continue;
    }

    const files = walk(directory);
    const match = files.find((filePath) => candidates.has(path.basename(filePath)));
    if (match) {
      return {
        ok: true,
        message: `Bundle for ${target} includes FFmpeg sidecar: ${match}`,
      };
    }
  }

  // Windows installer bundles (msi/nsis) don't expose embedded files as loose
  // files in bundle directories. If tauri build produced installers and the
  // sidecar was copied to target/release (tauri externalBin staging location),
  // treat it as a valid bundle build.
  if (target.includes('windows')) {
    const releaseDir = path.join(tauriDir, 'target', 'release');
    const stagedSidecar = path.join(releaseDir, 'ffmpeg.exe');
    const msiDir = path.join(releaseDir, 'bundle', 'msi');
    const nsisDir = path.join(releaseDir, 'bundle', 'nsis');
    const hasInstallerOutput =
      (fs.existsSync(msiDir) && walk(msiDir).some((p) => p.endsWith('.msi'))) ||
      (fs.existsSync(nsisDir) && walk(nsisDir).some((p) => p.endsWith('.exe')));

    if (hasInstallerOutput && fs.existsSync(stagedSidecar)) {
      return {
        ok: true,
        message: `Bundle for ${target} produced installer(s) and staged FFmpeg sidecar: ${stagedSidecar}`,
      };
    }
  }

  return {
    ok: false,
    message: `No bundled FFmpeg sidecar was found for ${target}. Search roots: ${directoriesToSearch.join(', ') || '(none)'}. Build on the native platform first, then rerun with --bundle.`,
  };
}

function expectedSidecarName(target) {
  return target.includes('windows') ? `ffmpeg-${target}.exe` : `ffmpeg-${target}`;
}

function sidecarCandidateNames(target) {
  return target.includes('windows')
    ? [expectedSidecarName(target), 'ffmpeg.exe']
    : [expectedSidecarName(target), 'ffmpeg'];
}

function guessHostTarget() {
  const archMap = {
    x64: 'x86_64',
    arm64: 'aarch64',
  };
  const normalizedArch = archMap[process.arch];
  if (!normalizedArch) {
    return null;
  }

  if (process.platform === 'win32') {
    return `${normalizedArch}-pc-windows-msvc`;
  }
  if (process.platform === 'darwin') {
    return `${normalizedArch}-apple-darwin`;
  }
  if (process.platform === 'linux') {
    return `${normalizedArch}-unknown-linux-gnu`;
  }

  return null;
}

function walk(rootDir) {
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

