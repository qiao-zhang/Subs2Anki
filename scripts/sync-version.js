import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

// 获取当前文件所在目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取 package.json 中的版本号
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const version = packageJson.version;

console.log(`Syncing version: ${version}`);

// 更新 tauri.conf.json
const tauriConfPath = path.join(__dirname, '..', 'src-tauri', 'tauri.conf.json');
let tauriConfContent = fs.readFileSync(tauriConfPath, 'utf8');
tauriConfContent = tauriConfContent.replace(/"version":\s*"[^"]+"/, `"version": "${version}"`);
fs.writeFileSync(tauriConfPath, tauriConfContent);

console.log('Updated tauri.conf.json');

// 更新 Cargo.toml
const cargoTomlPath = path.join(__dirname, '..', 'src-tauri', 'Cargo.toml');
let cargoTomlContent = fs.readFileSync(cargoTomlPath, 'utf8');
cargoTomlContent = cargoTomlContent.replace(/^version = "[^"]+"$/m, `version = "${version}"`);
fs.writeFileSync(cargoTomlPath, cargoTomlContent);

console.log('Updated Cargo.toml');

console.log('Version sync completed!');