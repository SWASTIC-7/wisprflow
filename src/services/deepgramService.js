class DeepgramService {
  constructor() {
    this.socket = null;
    this.apiKey = null;
    this.isConnecting = false;
  }

  /**
   * Initialize connection with API key
   */
  setApiKey(apiKey) {
    this.apiKey = apiKey?.trim();
  }

  /**
   * Connect to Deepgram's real-time transcription service
   */
  connect(onTranscript, onError) {
    if (!this.apiKey) {
      onError(new Error('Deepgram API key not set'));
      return;
    }

    if (this.isConnecting) {
      console.log('Already connecting...');
      return;
    }

    // Close existing connection
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.isConnecting = true;

    try {
      // Create WebSocket connection to Deepgram
      // Using encoding=linear16 is more reliable, but webm/opus works with MediaRecorder
      const params = new URLSearchParams({
        encoding: 'linear16',
        sample_rate: '16000',
        channels: '1',
        punctuate: 'true',
        interim_results: 'true',
        language: 'en',
        model: 'nova-2'
      });
      
      const url = `wss://api.deepgram.com/v1/listen?${params.toString()}`;
      
      console.log('Connecting to Deepgram...');
      
      // Use Authorization header via subprotocol
      this.socket = new WebSocket(url, ['token', this.apiKey]);
      this.socket.binaryType = 'arraybuffer';

      this.socket.onopen = () => {
        console.log('Deepgram connection established successfully!');
        this.isConnecting = false;
      };

      this.socket.onmessage = (message) => {
        try {
          const data = JSON.parse(message.data);
          
          // Handle different message types
          if (data.type === 'Results' && data.channel) {
            const transcript = data.channel.alternatives[0]?.transcript;
            const isFinal = data.is_final;
            
            if (transcript && transcript.length > 0) {
              onTranscript({
                text: transcript,
                isFinal: isFinal
              });
            }
          } else if (data.type === 'Metadata') {
            console.log('Deepgram metadata:', data);
          } else if (data.type === 'Error') {
            console.error('Deepgram error:', data);
            onError(new Error(data.message || 'Deepgram transcription error'));
          }
        } catch (error) {
          console.error('Error parsing Deepgram response:', error);
        }
      };

      this.socket.onerror = (error) => {
        console.error('Deepgram WebSocket error:', error);
        this.isConnecting = false;
        onError(new Error('Connection failed. Please verify your API key is correct and has sufficient credits.'));
      };

      this.socket.onclose = (event) => {
        console.log('Deepgram connection closed:', event.code, event.reason);
        this.isConnecting = false;
        
        // Provide more helpful error messages based on close code
        if (event.code === 1008) {
          onError(new Error('Invalid API key. Please check your Deepgram API key.'));
        } else if (event.code === 1011) {
          onError(new Error('Server error. Please try again later.'));
        }
      };

    } catch (error) {
      this.isConnecting = false;
      onError(error);
    }
  }

  /**
   * Send audio data to Deepgram
   */
  sendAudio(audioData) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(audioData);
    }
  }

  /**
   * Close connection safely
   */
  disconnect() {
    this.isConnecting = false;
    if (this.socket) {
      if (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING) {
        this.socket.close(1000, 'Recording stopped');
      }
      this.socket = null;
    }
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.socket && this.socket.readyState === WebSocket.OPEN;
  }
}

export default new DeepgramService();