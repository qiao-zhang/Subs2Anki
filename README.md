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

3. Start the development server:
```bash
npm run dev
```

4. Build production version:
```bash
npm run build
```

## Usage Guide

### Basic Workflow

1. **Load Video**: Click on the video area or use the control bar to upload a video file
2. **Load Subtitles**: Click the folder icon in the right panel to load subtitle files
3. **Preview and Edit**: View and edit subtitles in the right subtitle panel
4. **Create Cards**: Click the "+" button on subtitle lines or use the shortcut C to create Anki cards
5. **Export or Sync**: Click the export or sync button in the left panel

### Keyboard Shortcuts Reference

| Shortcut | Function |
|----------|----------|
| / / Tab | Show/Hide shortcut hints |
| Space | Replay current segment |
| P / Q | Play/Pause |
| J / D | Previous subtitle line |
| K / F | Next subtitle line |
| H | Show/Hide subtitle regions |
| V | Toggle video-only mode |
| C / N | Create card for current subtitle line |
| I / E | Toggle current subtitle line status (forward) |
| O / W | Toggle current subtitle line status (backward) |
| B / S | Split current subtitle line into two lines |
| A / ; | Merge current subtitle line with next subtitle line |
| X / , | Delete current subtitle line |
| U / Z | Undo operation |
| R / Y | Redo operation |
| . / Escape | Open/close settings modal |

## Tech Stack

- **Frontend Framework**: React 19
- **UI Library**: Tailwind CSS, Lucide React
- **State Management**: Zustand
- **Audio Processing**: FFmpeg.wasm
- **Database**: IndexedDB
- **Build Tool**: Vite
- **Type Checking**: TypeScript

## Contributing

Contributions are welcome! Feel free to submit issues and pull requests on the GitHub repository.

## License

MIT License. See the LICENSE file for more information.