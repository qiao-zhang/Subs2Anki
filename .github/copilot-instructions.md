# Copilot Instructions for Subs2Anki

## Build, test, and validation commands

- Install deps: `npm ci` (CI uses this) or `npm install`.
- Frontend dev server: `npm run dev`
- Tauri dev app: `npm run tauri:dev`
- Type-check TS: `npm run typecheck`
- Frontend tests (Vitest): `npm run test`
- Run a single Vitest file: `npm run test -- tests/core/parser.test.ts`
- Run a single test by name: `npm run test -- tests/core/parser.test.ts -t "parses"`
- Build web app: `npm run build`
- Build Tauri web assets: `npm run build:tauri`
- Rust checks/tests (from `src-tauri`): `cargo check`, `cargo test`
- Run a single Rust test (from `src-tauri`): `cargo test clip_duration_rejects_invalid_ranges`

There is currently no dedicated `npm run lint` script. Use `npm run typecheck` plus tests as the primary JS/TS validation path.

## High-level architecture

- `App.tsx` is the orchestration root: it wires Zustand state (`services/store.ts`), UI components (`components/*`), and workflow hooks (`hooks/*`) for card creation, sync, project persistence/reset, subtitle playback, and desktop FFmpeg status.
- Core domain is split into:
  - `services/*`: parsing (`parser.ts`), app state (`store.ts`), media DB (`db.ts`), Anki integration (`anki-connect.ts`, `anki-db.ts`), export, time/path helpers, and FFmpeg abstraction.
  - `hooks/*`: feature workflows that compose services and store state (e.g., `useCardCreationFlow`, `useAnkiSync`, `useProjectPersistence`).
- Audio extraction uses a facade in `services/ffmpeg.ts`:
  - Web build (`__TAURI_BUILD__ === false`): `ffmpeg-web.ts` with `FFmpeg.wasm` assets from `public/ffmpeg`.
  - Desktop build (`__TAURI_BUILD__ === true`): `ffmpeg-tauri.ts` which calls Rust Tauri commands.
- Tauri backend (`src-tauri/src/ffmpeg.rs`) owns desktop file picking, subtitle read/write, FFmpeg availability probing, and clip extraction; commands are registered in `src-tauri/src/lib.rs`.
- Persistence model:
  - Binary media (screenshots/audio) in IndexedDB (`services/db.ts`).
  - Project metadata in `.subs2anki` JSON via `services/project-record.ts` (includes legacy subtitle format conversion).
- i18n is centralized in `services/i18n.ts` with `locales/en.json` and `locales/zh.json`.

## Key repository conventions

- Subtitle editing/card flow uses a **tri-state** status model: `'normal' | 'locked' | 'ignored'` (`services/types.ts`, `services/store.ts`). Avoid reintroducing old boolean `locked` logic in new code.
- Card generation only operates on `normal` subtitle lines and then typically locks them (`hooks/useCardCreationFlow.ts`).
- Keep web vs desktop branching explicit via `__TAURI_BUILD__`; desktop-only behavior should go through Tauri commands/services, while web-only behavior should continue to work without Tauri APIs.
- Preserve localStorage keys under the `subs2anki_*` namespace used in `services/store.ts` (changing keys breaks persisted user settings).
- Project record compatibility matters: `services/project-record.ts` validates and converts legacy subtitle records; maintain backward compatibility when evolving schema.
- Sidecar FFmpeg packaging is part of release behavior:
  - Sidecars live in `src-tauri/bin/` with target-specific names (see `src-tauri/bin/README.md`).
  - `src-tauri/build.rs` injects `bundle.externalBin` when sidecar exists and fails desktop release builds when missing (unless explicitly skipped).
  - Validate with `npm run validate:ffmpeg-sidecars` and `npm run validate:ffmpeg-bundle` when changing desktop packaging.
