import { useState, useEffect, useRef } from 'react';
import audioCapture from '../services/audioCapture';
import deepgramService from '../services/deepgramService';
import './VoiceRecorder.css';

function VoiceRecorder({ apiKey, onTranscript, onInterimTranscript }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState(null);
  const [isPushToTalkActive, setIsPushToTalkActive] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const interimTranscriptRef = useRef('');
  const durationIntervalRef = useRef(null);

  // Initialize audio capture on mount
  useEffect(() => {
    const init = async () => {
      setIsInitializing(true);
      try {
        console.log('Starting microphone initialization...');
        await audioCapture.initialize();
        console.log('Microphone initialized successfully!');
        setIsInitialized(true);
        setError(null);
      } catch (err) {
        console.error('Microphone initialization failed:', err);
        setError(err.message);
        setIsInitialized(false);
      } finally {
        setIsInitializing(false);
      }
    };
    init();

    return () => {
      audioCapture.cleanup();
      deepgramService.disconnect();
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, []);

  // Retry initialization
  const retryInitialization = async () => {
    setError(null);
    setIsInitializing(true);
    try {
      await audioCapture.initialize();
      setIsInitialized(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsInitializing(false);
    }
  };

  // Handle keyboard shortcuts for push-to-talk
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Use spacebar for push-to-talk (but not when typing in input)
      if (e.code === 'Space' && !isRecording && isInitialized && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        startRecording();
        setIsPushToTalkActive(true);
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space' && isRecording && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        stopRecording();
        setIsPushToTalkActive(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isRecording, isInitialized]);

  // Recording duration timer
  useEffect(() => {
    if (isRecording) {
      setRecordingDuration(0);
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      setRecordingDuration(0);
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [isRecording]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    if (!apiKey) {
      setError('Please enter your Deepgram API key');
      return;
    }

    setError(null);

    try {
      deepgramService.setApiKey(apiKey);
      
      // Connect to Deepgram first
      deepgramService.connect(
        (transcript) => {
          if (transcript.isFinal) {
            onTranscript(transcript.text);
            interimTranscriptRef.current = '';
            if (onInterimTranscript) {
              onInterimTranscript('');
            }
          } else {
            interimTranscriptRef.current = transcript.text;
            if (onInterimTranscript) {
              onInterimTranscript(transcript.text);
            }
          }
        },
        (err) => {
          setError(err.message);
          setIsRecording(false);
          audioCapture.stopRecording();
        }
      );

      // Wait a bit for the connection to establish
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check if connection is ready
      if (!deepgramService.isConnected()) {
        // Wait a bit more
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Start audio capture
      audioCapture.startRecording((audioData) => {
        if (deepgramService.isConnected()) {
          deepgramService.sendAudio(audioData);
        }
      });

      setIsRecording(true);
    } catch (err) {
      setError(err.message);
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      await audioCapture.stopRecording();
      deepgramService.disconnect();
      setIsRecording(false);
      interimTranscriptRef.current = '';
      if (onInterimTranscript) {
        onInterimTranscript('');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="voice-recorder">
      {error && (
        <div className="error-banner">
          <span className="error-icon">!</span>
          <span>{error}</span>
          <button className="error-dismiss" onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="recorder-main">
        <button
          onClick={toggleRecording}
          disabled={!isInitialized || !apiKey || isInitializing}
          className={`record-button ${isRecording ? 'recording' : ''} ${isInitializing ? 'initializing' : ''}`}
        >
          <div className="record-button-inner">
            {isInitializing ? (
              <span className="record-icon">...</span>
            ) : isRecording ? (
              <>
                <div className="pulse-ring"></div>
                <div className="pulse-ring delay"></div>
                <span className="record-icon">Stop</span>
              </>
            ) : (
              <span className="record-icon">Record</span>
            )}
          </div>
        </button>

        {isRecording && (
          <div className="recording-duration">
            {formatDuration(recordingDuration)}
          </div>
        )}
      </div>

      <div className="recorder-status">
        {isRecording ? (
          <div className="status-recording">
            <span className="recording-indicator">●</span>
            <span>Recording in progress...</span>
            <span className="status-hint">
              {isPushToTalkActive ? 'Release Space to stop' : 'Click button or press Space to stop'}
            </span>
          </div>
        ) : (
          <div className="status-idle">
            {isInitializing ? (
              <span className="status-init">Initializing microphone... Please allow access when prompted.</span>
            ) : !isInitialized ? (
              <div className="status-error">
                <span>Microphone not available</span>
                <button className="retry-button" onClick={retryInitialization}>
                  Retry
                </button>
              </div>
            ) : !apiKey ? (
              <span className="status-key">Enter API key to begin</span>
            ) : (
              <span>Press and hold <kbd>Space</kbd> or click the button to record</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
export default VoiceRecorder;