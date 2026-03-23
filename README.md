# Subs2Anki

Subs2Anki is a video subtitle processing tool that provides subtitle processing and flashcard creation solutions, designed to help language learners extract useful language materials from video content and automatically generate Anki flashcards.

## Features

### 🎥 Video Player
- Built-in HTML5 video player with basic playback controls
- Video frame capture functionality to capture screenshots at any moment
- Timeline navigation based on subtitle lines, supporting quick jumps between subtitles
- Volume control
- Waveform visualization of audio tracks for precise time positioning

### 📄 Subtitle Processing
- Supports SRT and VTT subtitle file formats
- Subtitle editing functionality to modify subtitle line text
- Subtitle timeline offset adjustment to synchronize with video playback
- Subtitle line locking to prevent accidental modifications
- Subtitle line split and merge functionality

### 📺 Subtitle Display
- Real-time display of current subtitles on the video player
- Automatic synchronization of video playback time with subtitle display
- Waveform visualization of audio tracks

### 🃏 Anki Card Generation
- Support for custom card templates
- Automatic audio clip generation
- One-click Anki flashcard creation
- Batch card creation functionality
- Card preview functionality

### 🔤 Furigana Processing
- Integration with Kuroshiro library for Japanese furigana annotation
- Automatic hiragana/katakana annotation for kanji characters

### 🔄 Anki Connection
- Support for direct synchronization to Anki desktop application via AnkiConnect
- Support for exporting as .apkg files
- Automatic detection of Anki connection status
- Support for custom deck names

### ⌨️ Keyboard Shortcut Support
- Rich keyboard shortcuts to improve operational efficiency (see below)
- Press / key to display shortcut reference table

## Installation and Setup

### System Requirements
- Node.js 18+
- npm or yarn

### Installation Steps

1. Clone the project repository:
```bash
git clone <this-repo>
cd Subs2Anki
```

2. Install dependencies:
```bash
npm install
```

3. Start the web development server:
```bash
npm run dev
```

4. Start the Tauri desktop development build:
```bash
npm run tauri:dev
```

5. Build production versions:
```bash
npm run build
npm run tauri:build
```

### Tauri FFmpeg Backend

- Web mode still uses `FFmpeg.wasm` and the static files in `public/ffmpeg`.
- Tauri mode now routes audio extraction through the Rust backend and keeps the selected video as a local file path instead of copying the whole file into frontend memory first.
- Desktop video selection now uses a native picker exposed by the Tauri backend, and playback uses Tauri's asset protocol to load the chosen local file.
- Desktop subtitle selection and save-back now also use native Tauri file paths, while the web app keeps using the browser file picker / File System Access flow.
- Put target-specific FFmpeg sidecars in `src-tauri/bin/` (see `src-tauri/bin/README.md`), or copy one there with `npm run prepare:ffmpeg-sidecar -- <path-to-ffmpeg-binary> <target-triple>`.
- Desktop startup now probes FFmpeg immediately. If the sidecar or fallback binary is missing, the UI shows a persistent warning banner instead of waiting for the first audio extraction to fail.
- The Settings modal now shows the current desktop FFmpeg status, resolved binary path, a manual `Re-check FFmpeg` action, and step-by-step recovery instructions when the check fails.
- When a re-check succeeds, cards whose audio generation previously failed only because desktop FFmpeg was unavailable are automatically moved back to the pending queue.
- `src-tauri/build.rs` now prints a warning in debug builds and fails desktop release builds with a target-specific message if the expected sidecar file is missing.
- Use `npm run validate:ffmpeg-sidecars` to verify the expected source sidecar inventory, and `npm run validate:ffmpeg-bundle` after a native `tauri build` to confirm the built bundle contains FFmpeg.
- The release workflow `.github/workflows/ffmpeg-sidecar-validation.yml` now runs on native Windows/macOS/Linux runners, prepares a host-specific placeholder sidecar, performs a real `tauri build`, and then verifies the resulting bundle still contains the packaged sidecar.

## Usage Guide

### Basic Workflow

1. **Load Video**: Click on the video area or use the control bar to upload a video file
2. **Load Subtitles**: Click the folder icon in the right panel to load subtitle files
3. **Preview and Edit**: View and edit subtitles in the right subtitle panel
4. **Create Cards**: Click the "+" button on subtitle lines or use the shortcut C to create Anki cards
5. **Export or Sync**: Click the export or sync button in the left panel

### Keyboard Shortcuts Reference

| Shortcut   | Function                                            |
|------------|-----------------------------------------------------|
| / / Tab    | Show/Hide shortcut hints                            |
| Space      | Replay current segment                              |
| P / Q      | Play/Pause                                          |
| H          | Play the head part of current region                |
| T          | Play the tail part of current region                |
| J / D      | Previous subtitle line                              |
| K / F      | Next subtitle line                                  |
| S / L      | Hide/Unhide subtitle regions                        |
| V          | Toggle video-only mode                              |
| C / N      | Create card for current subtitle line               |
| I / E      | Toggle current subtitle line status (forward)       |
| O / W      | Toggle current subtitle line status (backward)      |
| B          | Split current subtitle line into two lines          |
| A / M      | Merge current subtitle line with next subtitle line |
| X / ,      | Delete current subtitle line                        |
| U / Z      | Undo operation                                      |
| R / Y      | Redo operation                                      |
| . / Escape | Open/close settings modal                           |

## Tech Stack

- **Frontend Framework**: React 19
- **UI Library**: Tailwind CSS, Lucide React
- **State Management**: Zustand
- **Audio Processing**: FFmpeg.wasm (web), native FFmpeg command via Tauri backend (desktop)
- **Database**: IndexedDB
- **Build Tool**: Vite
- **Type Checking**: TypeScript

## Contributing

Contributions are welcome! Feel free to submit issues and pull requests on the GitHub repository.

## License

MIT License. See the LICENSE file for more information.