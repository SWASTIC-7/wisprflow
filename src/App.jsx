import { useState, useEffect } from 'react';
import VoiceRecorder from './components/VoiceRecorder';
import TranscriptionDisplay from './components/TranscriptionDisplay';
import './App.css';

// Load API key from environment variable
const ENV_API_KEY = import.meta.env.VITE_DEEPGRAM_API_KEY || '';
const GITHUB_REPO_URL = 'https://github.com/SWASTIC-7/wisprflow';

function App() {
  const [apiKey, setApiKey] = useState(ENV_API_KEY !== 'your_deepgram_api_key_here' ? ENV_API_KEY : '');
  const [transcripts, setTranscripts] = useState([]);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'light' === prev ? 'dark' : 'light');
  };

  const handleTranscript = (text) => {
    if (text.trim()) {
      setTranscripts(prev => [...prev, text]);
    }
  };

  const clearTranscripts = () => {
    setTranscripts([]);
  };

  const openGitHub = () => {
    window.open(GITHUB_REPO_URL, '_blank');
  };

  return (
    <div className="app">
      <nav className="navbar">
        <div className="navbar-brand">
          <h1>Voice to Text</h1>
          <span className="navbar-subtitle">Powered by Deepgram</span>
        </div>
        <div className="navbar-actions">
          <button className="theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
            {theme === 'dark' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"/>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>
          <button className="github-btn" onClick={openGitHub} title="View on GitHub">
            <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
            </svg>
            <span>GitHub</span>
          </button>
        </div>
      </nav>

      <main className="app-main">
        {/* <section className="api-key-section">
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
        </section> */}

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