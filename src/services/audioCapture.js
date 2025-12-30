class AudioCaptureService {
  constructor() {
    this.mediaStream = null;
    this.audioContext = null;
    this.processor = null;
    this.source = null;
    this.isRecording = false;
  }

  /**
   * Check if getUserMedia is available
   */
  isSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  /**
   * Request microphone permission and initialize stream
   */
  async initialize() {
    // Check if getUserMedia is supported
    if (!this.isSupported()) {
      console.error('getUserMedia not supported');
      throw new Error('Microphone access is not supported in this browser/environment. Please ensure you are using HTTPS or localhost.');
    }

    try {
      console.log('Requesting microphone access...');
      
      // First try with constraints
      try {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 16000,
            channelCount: 1
          }
        });
      } catch (constraintError) {
        console.warn('Failed with constraints, trying basic audio:', constraintError);
        // Fallback to basic audio request
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      
      console.log('Microphone access granted!', this.mediaStream);
      return true;
    } catch (error) {
      console.error('Microphone access error:', error.name, error.message);
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        throw new Error('Microphone permission denied. Please allow microphone access in your browser/system settings.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        throw new Error('No microphone found. Please connect a microphone and try again.');
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        throw new Error('Microphone is being used by another application. Please close other apps using the microphone.');
      } else if (error.name === 'OverconstrainedError') {
        throw new Error('Microphone does not meet the required constraints.');
      } else if (error.name === 'SecurityError') {
        throw new Error('Microphone access blocked due to security settings. Please use HTTPS.');
      } else {
        throw new Error(`Microphone error: ${error.message || error.name || 'Unknown error'}`);
      }
    }
  }

  /**
   * Start recording audio and stream as Linear16 PCM
   */
  startRecording(onDataAvailable) {
    if (!this.mediaStream) {
      throw new Error('Media stream not initialized');
    }

    if (this.isRecording) {
      console.warn('Already recording');
      return;
    }

    this.isRecording = true;

    // Create AudioContext for processing
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
      sampleRate: 16000
    });

    this.source = this.audioContext.createMediaStreamSource(this.mediaStream);

    // Create a ScriptProcessor (or AudioWorklet for modern browsers)
    // Buffer size of 4096 gives us ~256ms of audio at 16kHz
    const bufferSize = 4096;
    this.processor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);

    this.processor.onaudioprocess = (e) => {
      if (!this.isRecording) return;
      
      const inputData = e.inputBuffer.getChannelData(0);
      
      // Convert Float32Array to Int16Array (Linear16)
      const pcmData = this.float32ToInt16(inputData);
      
      // Send as ArrayBuffer
      if (onDataAvailable) {
        onDataAvailable(pcmData.buffer);
      }
    };

    // Connect the nodes
    this.source.connect(this.processor);
    this.processor.connect(this.audioContext.destination);

    console.log('Recording started with Linear16 PCM encoding');
  }

  /**
   * Convert Float32 audio samples to Int16 (Linear16 PCM)
   */
  float32ToInt16(float32Array) {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      // Clamp the value to -1 to 1 range
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      // Convert to 16-bit signed integer
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16Array;
  }

  /**
   * Stop recording
   */
  async stopRecording() {
    this.isRecording = false;

    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }

    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      await this.audioContext.close();
      this.audioContext = null;
    }

    console.log('Recording stopped');
    return null;
  }

  /**
   * Check if currently recording
   */
  getIsRecording() {
    return this.isRecording;
  }

  /**
   * Clean up resources
   */
  cleanup() {
    this.stopRecording();
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    
    console.log('Audio capture cleaned up');
  }
}

export default new AudioCaptureService();