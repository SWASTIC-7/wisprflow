import { useState } from 'react';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import './TranscriptionDisplay.css';

function TranscriptionDisplay({ transcripts, onClear }) {
  const [copyFeedback, setCopyFeedback] = useState(null);

  const copyToClipboard = async (text, index = null) => {
    try {
      await writeText(text);
      setCopyFeedback(index !== null ? index : 'all');
      setTimeout(() => setCopyFeedback(null), 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback to browser clipboard API
      try {
        await navigator.clipboard.writeText(text);
        setCopyFeedback(index !== null ? index : 'all');
        setTimeout(() => setCopyFeedback(null), 1500);
      } catch (fallbackErr) {
        console.error('Fallback copy also failed:', fallbackErr);
      }
    }
  };

  const copyAll = () => {
    const allText = transcripts.join(' ');
    copyToClipboard(allText);
  };

  return (
    <div className="transcription-container">
      <div className="transcription-header">
        <h2 className="transcription-title">Transcription</h2>
        <div className="transcription-actions">
          <button
            onClick={copyAll}
            disabled={transcripts.length === 0}
            className={`btn btn-copy ${copyFeedback === 'all' ? 'copied' : ''}`}
          >
            {copyFeedback === 'all' ? 'Copied!' : 'Copy All'}
          </button>
          <button
            onClick={onClear}
            disabled={transcripts.length === 0}
            className="btn btn-clear"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="transcription-content">
        {transcripts.length === 0 ? (
          <div className="empty-state">
            <p>Your transcriptions will appear here...</p>
            <p className="empty-hint">Press and hold Space or click the record button to start</p>
          </div>
        ) : (
          <div className="transcript-list">
            {transcripts.map((transcript, index) => (
              <div
                key={index}
                className={`transcript-item ${copyFeedback === index ? 'copied' : ''}`}
                onClick={() => copyToClipboard(transcript, index)}
                title="Click to copy"
              >
                <span className="transcript-number">{index + 1}</span>
                <span className="transcript-text">{transcript}</span>
                <span className="copy-indicator">
                  {copyFeedback === index ? 'Copied' : 'Copy'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TranscriptionDisplay;