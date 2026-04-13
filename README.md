# Subs2Anki

Subs2Anki is a subtitle-driven video study tool for creating Anki flashcards from video segments. It combines subtitle editing, media extraction, note template mapping, and Anki sync/export workflows in a single React + Vite application, with optional Tauri desktop support.

## Highlights

- Load a video and subtitle file, then navigate by subtitle line.
- Edit, split, merge, lock, ignore, and regroup subtitle segments.
- Generate audio clips and screenshots for each note.
- Customize Anki note fields, templates, CSS, deck, and tags.
- Sync directly to Anki through AnkiConnect or export as `.apkg`.
- Save and reopen `.subs2anki` project files.
- Use the built-in waveform and keyboard shortcuts for fast review.

## Current Feature Set

### Media and playback
- Built-in HTML5 video playback
- Subtitle-synchronized seeking and replay
- Waveform display for precise region selection
- Manual frame capture and audio clip download
- Audio gain setting for generated clips

### Subtitle editing
- SRT and VTT import/export
- Inline subtitle editing
- Split / merge / delete subtitle lines
- Lock / ignore status management
- Temporary subtitle region creation
- Undo / redo support through the shared undo-redo service

### Card generation
- Per-line card creation and batch creation
- Card preview and deletion
- Custom Anki note type fields / templates / CSS
- Optional furigana generation for Japanese content
- Screenshot timing setting with 5 positions: `0% / 25% / 50% / 75% / 100%` (default `50%`)

### Anki integration
- AnkiConnect connection test
- Deck list loading and refresh
- Automatic deck fallback/default selection after successful deck refresh
- Global tag support
- `.apkg` export support

### Project persistence
- Save and reopen `.subs2anki` project files
- Browser file picker flow for web builds
- Tauri-backed open/save flow when running in the desktop runtime

## Quick Start

### Requirements
- Node.js 18+
- npm
- Optional for desktop builds: Rust + Tauri prerequisites

### Install

```bash
npm install
```

### Run the web app in development

```bash
npm run dev
```

### Build the web app

```bash
npm run build
```

### Run quality checks

```bash
npm run typecheck
npm test
```

### Run the Tauri app

```bash
npm run tauri:dev
npm run tauri:build
```

## Basic Workflow

1. Load a video.
2. Load a subtitle file.
3. Review and edit subtitle lines.
4. Configure deck, tags, template, and settings.
5. Create one or more cards.
6. Sync to Anki or export as `.apkg`.
7. Save the project as `.subs2anki` if you want to continue later.

## Keyboard Shortcuts

| Shortcut   | Function                                            |
|------------|-----------------------------------------------------|
| / / Tab    | Show / hide shortcut hints                          |
| Space      | Replay current segment                              |
| P / Q      | Play / pause                                        |
| H          | Play the head part of current region                |
| T          | Play the tail part of current region                |
| J / D      | Previous subtitle line                              |
| K / F      | Next subtitle line                                  |
| S / L      | Hide / unhide subtitle regions                      |
| V          | Toggle video-only mode                              |
| C / N      | Create card for current subtitle line               |
| I / E      | Toggle current subtitle line status (forward)       |
| O / W      | Toggle current subtitle line status (backward)      |
| B          | Split current subtitle line into two lines          |
| A / M      | Merge current subtitle line with next subtitle line |
| X / ,      | Delete current subtitle line                        |
| U / Z      | Undo operation                                      |
| R / Y      | Redo operation                                      |
| . / Escape | Open / close settings modal                         |

## Project Structure

```text
App.tsx                     App composition entry
components/                 UI components and modals
hooks/                      UI and app-domain hooks
services/                   Core business logic and persistence
src-tauri/                  Optional Tauri desktop backend
tests/                      Component, hook, and core tests
```

Notable areas:
- `services/store.ts`: global Zustand store
- `hooks/app/`: app-level orchestration hooks split out from `App.tsx`
- `services/project-record.ts`: project file read/write and validation
- `services/anki-connect.ts`: AnkiConnect communication
- `services/anki-db.ts`: `.apkg` database generation

## Audit Snapshot (2026-04-13)

The repository was fully scanned and baseline checks were run.

### Verified status
- `npm run build`: passes
- `npm run typecheck`: passes
- `npm test`: passes (`19` test files / `60` tests)
- `App.tsx`: currently `471` lines

### P5 test coverage completed
- Core services now covered: `services/ffmpeg.ts`, `services/furigana.ts`, `services/anki-connect.ts`, `services/project-record.ts`
- Key hooks now covered: `hooks/useMediaProcessing.ts`, `hooks/app/useSyncActions.ts`, `hooks/app/useProjectActions.ts`, `hooks/app/useDeckSelection.ts`
- Regression scenarios covered:
  - missing screenshot timing in legacy project files falls back to `50%`
  - deck refresh default selection / fallback behavior
  - screenshot timing clamping boundaries
  - Tauri vs Web project save/load paths

### Verified issues
- Build output still shows `sql.js` browser externalization warnings (`fs`, `crypto`)
- Several flows still rely on `alert` / `confirm`, which makes UX and testing harder
- Some user-controlled HTML is interpolated into Anki fields / template help output without a sanitization boundary

See `TODOS.md` for the prioritized remediation list.

## Known Limitations

- Build output still shows `sql.js` browser externalization warnings.
- Settings persistence is split between project files and `localStorage`.
- Some UI text and dialogs are still not fully unified under the notification/i18n path.

## Contributing

Contributions are welcome. Before sending a PR, please at least run:

```bash
npm run build
npm run typecheck
npm test
```

If you change persistence, sync, or subtitle editing logic, also update `TODOS.md` or related docs where appropriate.

## Tech Stack

- React 19
- TypeScript 5.8
- Vite 6
- Zustand 5
- Tailwind CSS 3
- Vitest 4
- FFmpeg.wasm
- IndexedDB (`idb`)
- `sql.js`
- Tauri 2

## License

MIT License. See `LICENSE` for details.
