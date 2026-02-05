# Subs2Anki

Subs2Anki is a video subtitle processing tool that provides subtitle processing and flashcard creation solutions, designed to help language learners extract useful language materials from video content and automatically generate Anki flashcards.

## Features

### 🎥 Video Player
- Built-in HTML5 video player with basic playback controls
- Video frame capture functionality to capture screenshots at any moment
- Precise timeline control with fine-tuning of playback progress

### 📄 Subtitle Processing
- Supports SRT and VTT subtitle file formats
- Subtitle editing functionality to modify subtitle text
- Subtitle locking feature to prevent accidental modifications
- Subtitle timeline offset adjustment to synchronize with video playback

### 📺 Subtitle Display
- Real-time display of current subtitles on the video player
- Aesthetic subtitle styling with semi-transparent backgrounds for easy reading
- Automatic synchronization of video playback time with subtitle display

### 🃏 Anki Card Generation
- Generation of Anki flashcard for current subtitle line by one click
- Support for custom card templates
- Automatic audio clip generation
- Support for furigana (Japanese phonetic annotation)

### 🔤 Furigana Processing
- Integration with Kuroshiro library for Japanese phonetic annotation
- Automatic hiragana/katakana annotation for kanji characters

### 🔁 Anki Connection
- Support for direct synchronization to Anki desktop application via AnkiConnect
- Support for exporting as apkg files

### ⌨️ Keyboard Shortcuts
- Rich keyboard shortcuts to improve operational efficiency
- Shift+H to display shortcut reference table

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
4. **Create Cards**: Click the "+" button on subtitle rows or use the shortcut C to create Anki cards
5. **Export or Sync**: Click the export or sync button in the left panel

### Shortcut Reference

| Shortcut | Function |
|----------|----------|
| Space | Play/Pause |
| ← / K | Rewind 0.5 seconds |
| → / L | Forward 0.5 seconds |
| Shift + ← / Shift + K | Rewind 5 seconds |
| Shift + → / Shift + L | Forward 5 seconds |
| Ctrl + ← / Ctrl + K | Rewind 0.1 seconds |
| Ctrl + → / Ctrl + L | Forward 0.1 seconds |
| ↑ / K | Previous subtitle |
| ↓ / J | Next subtitle |
| R | Replay current segment |
| C | Create card for current subtitle row |
| N | Show/hide subtitle area |
| V | Toggle video-only mode |
| Shift + H | Show/hide shortcut hints |

## Tech Stack

- **Frontend Framework**: React 19
- **UI Library**: Tailwind CSS, Lucide React
- **State Management**: Zustand
- **Audio Processing**: FFmpeg.wasm
- **Database**: IndexedDB
- **Build Tool**: Vite
- **Type Checking**: TypeScript
