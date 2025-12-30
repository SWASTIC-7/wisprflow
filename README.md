# Voice to Text Desktop App

A cross-platform desktop application for real-time voice-to-text transcription, built with Tauri + React + Deepgram. This is a clone of Wispr Flow, focusing on the core voice-to-text workflow.


## Features

- **Push-to-Talk Voice Input**: Hold the spacebar or click the record button to capture audio
- **Real-Time Transcription**: Stream audio to Deepgram for instant speech-to-text conversion
- **Interim Results**: See what you're saying as you speak
- **Copy to Clipboard**: Click any transcript to copy, or use "Copy All" for the entire session
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Clean UI**: Modern, intuitive interface with visual recording feedback

## Architecture

The application follows a clean separation of concerns:

```
src/
├── components/
│   ├── VoiceRecorder.jsx      # Recording controls and push-to-talk logic
│   ├── VoiceRecorder.css      # Recorder styling
│   ├── TranscriptionDisplay.jsx # Displays and manages transcriptions
│   └── TranscriptionDisplay.css # Transcription panel styling
├── services/
│   ├── audioCapture.js        # Microphone access and audio streaming
│   └── deepgramService.js     # WebSocket connection to Deepgram API
├── App.jsx                     # Main application layout
├── App.css                     # Global styles
└── main.jsx                    # React entry point

src-tauri/
├── src/
│   ├── lib.rs                 # Tauri plugin initialization
│   └── main.rs                # Tauri entry point
├── Cargo.toml                 # Rust dependencies
├── tauri.conf.json            # Tauri configuration
└── capabilities/
    └── default.json           # Permission capabilities
```

### Design Decisions

1. **WebSocket for Real-Time Streaming**: Direct WebSocket connection to Deepgram's API enables low-latency transcription without buffering the entire audio file.

2. **MediaRecorder API**: Uses the browser's native MediaRecorder with WebM/Opus encoding for efficient audio capture and streaming.

3. **Tauri v2**: Chosen over Electron for smaller bundle sizes (~5MB vs ~150MB), better performance, and native system integration.

4. **Service Layer Pattern**: Audio capture and transcription services are decoupled from UI components, making them testable and reusable.

5. **Push-to-Talk**: Implemented as the primary interaction model to give users explicit control over when recording occurs.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Rust](https://www.rust-lang.org/tools/install) (latest stable)
- [Tauri CLI](https://v2.tauri.app/start/prerequisites/)
- A [Deepgram API key](https://console.deepgram.com/) (free tier available)

### Linux Dependencies

For Linux, you'll also need:

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev

# Fedora
sudo dnf install webkit2gtk4.1-devel openssl-devel curl wget file gtk3-devel libappindicator-gtk3-devel librsvg2-devel

# Arch
sudo pacman -S webkit2gtk-4.1 base-devel curl wget file openssl gtk3 libappindicator-gtk3 librsvg
```

## Getting Started

1. **Clone the repository**
   ```bash
   git clone git@github.com:SWASTIC-7/wisprflow.git
   cd voice-to-text-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run in development mode**
   ```bash
   npm run tauri dev
   ```

4. **Build for production**
   ```bash
   npm run tauri build
   ```

## Usage

1. **Enter your Deepgram API Key** in the input field at the top
2. **Start Recording**:
   - **Push-to-Talk**: Press and hold the `Space` key
   - **Toggle**: Click the microphone button
3. **View Transcriptions**: Your speech appears in the transcription panel
4. **Copy Text**: Click any individual transcript or use "Copy All"
5. **Clear**: Use the clear button to start fresh

## Configuration

### Deepgram Settings

The Deepgram connection is configured in `src/services/deepgramService.js`:

```javascript
const url = 'wss://api.deepgram.com/v1/listen?encoding=webm&sample_rate=16000&punctuate=true&interim_results=true';
```

Available parameters:
- `punctuate=true`: Adds punctuation
- `interim_results=true`: Shows partial results while speaking
- `language=en-US`: Change language (see Deepgram docs for supported languages)
- `model=nova-2`: Specify transcription model

### Audio Settings

Audio capture settings in `src/services/audioCapture.js`:

```javascript
audio: {
  echoCancellation: true,
  noiseSuppression: true,
  sampleRate: 16000,
  channelCount: 1
}
```
