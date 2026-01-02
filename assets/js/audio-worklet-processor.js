/**
 * AudioWorklet Processor for PCM playback
 * Handles both native audio (WAV) and streaming PCM from TTS
 * FASE 1: Pipeline Enterprise - TTS WebSocket + PCM + AudioWorklet
 */

class PCMPlaybackProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.audioQueue = [];
    this.isPlaying = false;
    this.sampleRate = 24000; // Match Deepgram TTS sample rate
    
    // Listen for messages from main thread
    this.port.onmessage = (event) => {
      const { type, data } = event.data;
      
      if (type === 'audio') {
        // Add PCM audio chunk to queue
        if (data instanceof ArrayBuffer) {
          // Convert ArrayBuffer to Float32Array
          const float32Array = new Float32Array(data);
          this.audioQueue.push(float32Array);
          this.isPlaying = true;
        } else if (data instanceof Float32Array) {
          this.audioQueue.push(data);
          this.isPlaying = true;
        }
      } else if (type === 'clear') {
        // Clear audio queue (for barge-in)
        this.audioQueue = [];
        this.isPlaying = false;
      } else if (type === 'native') {
        // Load native audio file (WAV)
        this.loadNativeAudio(data);
      }
    };
  }

  /**
   * Load and decode native WAV audio file
   */
  loadNativeAudio(audioBuffer) {
    try {
      // Decode WAV file (simple WAV parser for PCM)
      const wavData = this.parseWAV(audioBuffer);
      if (wavData) {
        this.audioQueue.push(wavData.samples);
        this.isPlaying = true;
      }
    } catch (error) {
      console.error('[AudioWorklet] Error loading native audio:', error);
    }
  }

  /**
   * Simple WAV parser for PCM data
   */
  parseWAV(buffer) {
    const view = new DataView(buffer);
    
    // Check RIFF header
    if (view.getUint32(0, true) !== 0x46464952) { // "RIFF"
      return null;
    }
    
    // Check WAVE header
    if (view.getUint32(8, true) !== 0x45564157) { // "WAVE"
      return null;
    }
    
    // Find fmt chunk
    let offset = 12;
    while (offset < buffer.byteLength) {
      const chunkId = view.getUint32(offset, true);
      const chunkSize = view.getUint32(offset + 4, true);
      
      if (chunkId === 0x20746d66) { // "fmt "
        const sampleRate = view.getUint32(offset + 12, true);
        const bitsPerSample = view.getUint16(offset + 22, true);
        const numChannels = view.getUint16(offset + 10, true);
        
        // Find data chunk
        let dataOffset = offset + 8 + chunkSize;
        while (dataOffset < buffer.byteLength) {
          const dataChunkId = view.getUint32(dataOffset, true);
          const dataChunkSize = view.getUint32(dataOffset + 4, true);
          
          if (dataChunkId === 0x61746164) { // "data"
            const audioData = new Int16Array(buffer, dataOffset + 8, dataChunkSize / 2);
            // Convert Int16 to Float32 (-1.0 to 1.0)
            const float32Data = new Float32Array(audioData.length);
            for (let i = 0; i < audioData.length; i++) {
              float32Data[i] = audioData[i] / 32768.0;
            }
            
            return {
              samples: float32Data,
              sampleRate: sampleRate,
              channels: numChannels,
              bitsPerSample: bitsPerSample
            };
          }
          
          dataOffset += 8 + dataChunkSize;
        }
      }
      
      offset += 8 + chunkSize;
    }
    
    return null;
  }

  /**
   * Process audio - called by AudioWorklet
   */
  process(inputs, outputs) {
    const output = outputs[0];
    
    if (output.length > 0 && this.audioQueue.length > 0) {
      const channel = output[0];
      const audioData = this.audioQueue[0];
      
      // Copy audio data to output
      const length = Math.min(channel.length, audioData.length);
      for (let i = 0; i < length; i++) {
        channel[i] = audioData[i];
      }
      
      // Remove processed samples
      if (audioData.length <= channel.length) {
        this.audioQueue.shift();
      } else {
        // Partial consumption
        this.audioQueue[0] = audioData.subarray(channel.length);
      }
      
      // Fill rest with silence if needed
      for (let i = length; i < channel.length; i++) {
        channel[i] = 0;
      }
    } else {
      // No audio data - output silence
      if (output.length > 0) {
        output[0].fill(0);
      }
    }
    
    return true; // Keep processor alive
  }
}

registerProcessor('pcm-playback-processor', PCMPlaybackProcessor);
