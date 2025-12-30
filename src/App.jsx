import { useState } from 'react';
import VoiceRecorder from './components/VoiceRecorder';
import TranscriptionDisplay from './components/TranscriptionDisplay';
import './App.css';

// Load API key from environment variable
const ENV_API_KEY = import.meta.env.VITE_DEEPGRAM_API_KEY || '';

function App() {
  const [apiKey, setApiKey] = useState(ENV_API_KEY !== 'your_deepgram_api_key_here' ? ENV_API_KEY : '');
  const [transcripts, setTranscripts] = useState([]);
  const [interimTranscript, setInterimTranscript] = useState('');

  const handleTranscript = (text) => {
    if (text.trim()) {
      setTranscripts(prev => [...prev, text]);
    }
  };

  const clearTranscripts = () => {
    setTranscripts([]);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-logo">
          <div className="logo-text">
            <h1>Voice to Text</h1>
            <span className="logo-subtitle">Powered by Deepgram</span>
          </div>
        </div>
      </header>

      <main className="app-main">
        <section className="api-key-section">
          <label className="api-key-label" htmlFor="api-key">
            Deepgram API Key
          </label>
          <div className="api-key-input-wrapper">
            <input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Deepgram API key"
              className="api-key-input"
            />
            {apiKey && (
              <span className="api-key-status">✓</span>
            )}
          </div>
          <p className="api-key-hint">
            Get your free API key at{' '}
            <a href="https://console.deepgram.com" target="_blank" rel="noopener noreferrer">
              console.deepgram.com
            </a>
          </p>
        </section>

        <div className="app-content">
          <section className="recorder-section">
            <VoiceRecorder
              apiKey={apiKey}
              onTranscript={handleTranscript}
              onInterimTranscript={setInterimTranscript}
            />
            
            {interimTranscript && (
              <div className="interim-transcript">
                <span className="interim-label">Listening...</span>
                <span className="interim-text">{interimTranscript}</span>
              </div>
            )}
          </section>

          <section className="transcription-section">
            <TranscriptionDisplay
              transcripts={transcripts}
              onClear={clearTranscripts}
            />
          </section>
        </div>
      </main>

      <footer className="app-footer">
        <p>
          Built with Tauri + React + Deepgram
        </p>
      </footer>
    </div>
  );
}

export default App;