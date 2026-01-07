# Sub2Anki AI

A powerful video-to-flashcard tool using **Google Gemini** to analyze subtitles, capture screenshots, and generate comprehensive Anki cards directly from your local video files.

## Features

*   **Video Player Integration**: Seamlessly syncs local video files with subtitle tracks.
*   **Subtitle Parsing**: Robust support for `.srt` and `.vtt` formats.
*   **AI Analysis**: Uses Gemini 2.5 Flash to automatically provide translations, grammar notes, and vocabulary lists.
*   **Smart Capture**: Automatically captures the video frame when creating a card.
*   **Anki Export**: Generates a ready-to-import `.zip` file containing the deck and media assets.

---

## Prerequisites

*   **Node.js**: v18 or higher recommended.
*   **API Key**: A valid Google GenAI API Key.

---

## Installation & Setup

1.  **Install Dependencies**
    
    Run the following command to install the required packages:
    ```bash
    npm install
    ```

2.  **Configure API Key**

    The application requires the `API_KEY` environment variable to be set.
    
    *   **Local Development**: Create a `.env` file in the root directory:
        ```env
        API_KEY=your_actual_api_key_here
        ```
    *   **Cloud IDEs**: Set the `API_KEY` in your environment secrets configuration.

---

## Running the Application

To start the local development server:

```bash
npm run dev
```

*   The application usually runs at `http://localhost:5173` (or the port specified by your bundler).
*   Open this URL in your browser to start using the app.

---

## Running Tests

This project uses **Vitest** and **React Testing Library** to ensure code quality and reliability.

### Run All Tests
To execute the full test suite once:

```bash
npm test
```

### Watch Mode
To run tests and watch for file changes (useful during development):

```bash
npm run test:watch
```

### What is Tested?
1.  **Core Logic**: 
    *   Time formatting utilities (`MM:SS` conversion).
    *   Subtitle parsing logic (handling SRT/VTT edge cases).
2.  **AI Services**: 
    *   Mocks the Google GenAI SDK to verify prompt construction and error handling without making real API calls.
3.  **UI Components**: 
    *   Verifies that cards render correctly.
    *   Ensures buttons (Delete, Analyze) trigger the correct actions.

---

## User Guide

1.  **Load Media**:
    *   Click **Select Video File** to choose a video from your computer.
    *   Click **Select Subtitle** to upload a matching `.srt` or `.vtt` file.
    
2.  **Navigation**:
    *   The subtitle list on the right will auto-scroll as the video plays.
    *   **Click** any subtitle line to jump the video to that exact timestamp.

3.  **Create Cards**:
    *   Hover over a subtitle line and click the **(+)** button.
    *   This pauses the video and captures a screenshot at the optimal moment.

4.  **AI Analysis**:
    *   In the "Your Deck" panel, click the **Magic Wand** icon on a card.
    *   Gemini will fill in the Translation, Notes, and Keywords.

5.  **Export to Anki**:
    *   Click the **Export** button at the top of the deck list.
    *   This downloads a `.zip` file.
    *   **In Anki**: Go to `File -> Import` and select the downloaded zip file.
