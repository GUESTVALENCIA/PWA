// ═══════════════════════════════════════════════════════════════════
// DEEPGRAM INTEGRATION - Advanced Voice Recognition & TTS
// Sandra Studio Ultimate - Enterprise Edition
// ═══════════════════════════════════════════════════════════════════

class DeepGramIntegration {
    constructor() {
        this.apiKey = null;
        this.socket = null;
        this.isConnected = false;
        this.isRecording = false;
        this.audioContext = null;
        this.mediaStream = null;
        this.processor = null;
        this.source = null;
        
        // Configuration
        this.config = {
            model: 'nova-2',
            language: 'es',
            punctuate: true,
            profanity_filter: false,
            redact: false,
            diarize: false,
            multichannel: false,
            alternatives: 1,
            numerals: true,
            search: [],
            replace: [],
            keywords: [],
            interim_results: true,
            endpointing: 300,
            vad_turnoff: 600
        };
        
        // Callbacks
        this.onTranscript = null;
        this.onError = null;
        this.onConnect = null;
        this.onDisconnect = null;
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════
    
    async initialize(apiKey) {
        this.apiKey = apiKey || localStorage.getItem('deepgramKey');
        if (!this.apiKey) {
            throw new Error('DeepGram API key is required');
        }
        
        // Initialize audio context
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
            sampleRate: 16000
        });
        
        console.log(' DeepGram initialized');
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // WEBSOCKET CONNECTION
    // ═══════════════════════════════════════════════════════════════════
    
    connect() {
        if (this.isConnected) return;
        
        const params = new URLSearchParams({
            ...this.config,
            encoding: 'linear16',
            sample_rate: '16000',
            channels: 1
        });
        
        const url = `wss://api.deepgram.com/v1/listen?${params.toString()}`;
        
        this.socket = new WebSocket(url, {
            headers: {
                'Authorization': `Token ${this.apiKey}`
            }
        });
        
        this.socket.onopen = () => {
            this.isConnected = true;
            console.log(' DeepGram WebSocket connected');
            if (this.onConnect) this.onConnect();
        };
        
        this.socket.onmessage = (event) => {
            this.handleMessage(event.data);
        };
        
        this.socket.onerror = (error) => {
            console.error(' DeepGram WebSocket error:', error);
            if (this.onError) this.onError(error);
        };
        
        this.socket.onclose = () => {
            this.isConnected = false;
            console.log(' DeepGram WebSocket disconnected');
            if (this.onDisconnect) this.onDisconnect();
        };
    }
    
    disconnect() {
        if (this.socket && this.isConnected) {
            this.socket.close();
            this.socket = null;
            this.isConnected = false;
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // MESSAGE HANDLING
    // ═══════════════════════════════════════════════════════════════════
    
    handleMessage(data) {
        try {
            const response = JSON.parse(data);
            
            if (response.channel) {
                const transcript = response.channel.alternatives[0];
                
                if (transcript.transcript && transcript.transcript.trim()) {
                    const result = {
                        text: transcript.transcript,
                        confidence: transcript.confidence,
                        words: transcript.words || [],
                        is_final: response.is_final || false,
                        speech_final: response.speech_final || false,
                        language: response.channel.detected_language || this.config.language
                    };
                    
                    if (this.onTranscript) {
                        this.onTranscript(result);
                    }
                    
                    // Auto-insert into input if final
                    if (result.is_final || result.speech_final) {
                        this.insertTranscript(result.text);
                    }
                }
            }
        } catch (error) {
            console.error('Error parsing DeepGram message:', error);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // AUDIO RECORDING
    // ═══════════════════════════════════════════════════════════════════
    
    async startRecording() {
        if (this.isRecording) return;
        
        try {
            // Get microphone access
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 16000
                }
            });
            
            // Connect to DeepGram if not connected
            if (!this.isConnected) {
                this.connect();
                // Wait for connection
                await new Promise(resolve => {
                    this.onConnect = resolve;
                    setTimeout(resolve, 2000); // Timeout after 2s
                });
            }
            
            // Create audio processing pipeline
            this.source = this.audioContext.createMediaStreamSource(this.mediaStream);
            this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
            
            this.processor.onaudioprocess = (e) => {
                if (!this.isRecording) return;
                
                const inputData = e.inputBuffer.getChannelData(0);
                const outputData = new Int16Array(inputData.length);
                
                // Convert float32 to int16
                for (let i = 0; i < inputData.length; i++) {
                    const s = Math.max(-1, Math.min(1, inputData[i]));
                    outputData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                }
                
                // Send to DeepGram
                if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                    this.socket.send(outputData.buffer);
                }
            };
            
            // Connect audio nodes
            this.source.connect(this.processor);
            this.processor.connect(this.audioContext.destination);
            
            this.isRecording = true;
            
            // Update UI
            this.updateRecordingUI(true);
            
            console.log(' Recording started');
            
        } catch (error) {
            console.error('Error starting recording:', error);
            throw error;
        }
    }
    
    stopRecording() {
        if (!this.isRecording) return;
        
        this.isRecording = false;
        
        // Stop audio processing
        if (this.processor) {
            this.processor.disconnect();
            this.processor = null;
        }
        
        if (this.source) {
            this.source.disconnect();
            this.source = null;
        }
        
        // Stop media stream
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }
        
        // Send stop signal to DeepGram
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ type: 'CloseStream' }));
        }
        
        // Update UI
        this.updateRecordingUI(false);
        
        console.log(' Recording stopped');
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // CONTINUOUS RECORDING MODE (ChatGPT Style)
    // ═══════════════════════════════════════════════════════════════════
    
    async startContinuousMode() {
        console.log(' Starting continuous recording mode...');
        
        this.continuousMode = true;
        
        // Start recording
        await this.startRecording();
        
        // Set up voice activity detection
        this.setupVoiceActivityDetection();
        
        // Show continuous mode UI
        this.showContinuousModeUI();
    }
    
    stopContinuousMode() {
        console.log(' Stopping continuous recording mode...');
        
        this.continuousMode = false;
        this.stopRecording();
        this.disconnect();
        
        // Hide continuous mode UI
        this.hideContinuousModeUI();
    }
    
    setupVoiceActivityDetection() {
        // Implement voice activity detection
        // This would detect when user starts/stops speaking
        // and automatically process the audio
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // TEXT TO SPEECH (TTS)
    // ═══════════════════════════════════════════════════════════════════
    
    async textToSpeech(text, voice = 'aura-asteria-en') {
        if (!this.apiKey) {
            throw new Error('DeepGram API key is required for TTS');
        }
        
        const url = 'https://api.deepgram.com/v1/speak';
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Token ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: text,
                voice: voice,
                encoding: 'mp3',
                container: 'none',
                sample_rate: 24000
            })
        });
        
        if (!response.ok) {
            throw new Error(`TTS failed: ${response.statusText}`);
        }
        
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Play audio
        const audio = new Audio(audioUrl);
        audio.play();
        
        return audio;
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // UI INTEGRATION
    // ═══════════════════════════════════════════════════════════════════
    
    updateRecordingUI(isRecording) {
        const voiceBtn = document.getElementById('voiceBtn');
        const recordBtn = document.getElementById('recordBtn');
        const input = document.getElementById('chatInput');
        const waveform = document.getElementById('audioWaveform');
        
        if (isRecording) {
            voiceBtn?.classList.add('recording');
            recordBtn?.classList.add('recording');
            
            // Show waveform
            if (waveform) {
                waveform.style.display = 'block';
                this.startWaveformAnimation();
            }
            
            // Show recording indicator in input
            if (input) {
                input.placeholder = ' Escuchando... Habla ahora';
            }
        } else {
            voiceBtn?.classList.remove('recording');
            recordBtn?.classList.remove('recording');
            
            // Hide waveform
            if (waveform) {
                waveform.style.display = 'none';
                this.stopWaveformAnimation();
            }
            
            // Reset input placeholder
            if (input) {
                input.placeholder = 'Escribe tu mensaje o pega imágenes con Ctrl+V...';
            }
        }
    }
    
    startWaveformAnimation() {
        const canvas = document.getElementById('audioWaveform');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width = canvas.offsetWidth;
        const height = canvas.height = 40;
        
        let animationId;
        
        const draw = () => {
            ctx.clearRect(0, 0, width, height);
            
            // Draw waveform bars
            const barCount = 30;
            const barWidth = width / barCount;
            
            ctx.fillStyle = 'rgba(102, 126, 234, 0.6)';
            
            for (let i = 0; i < barCount; i++) {
                const barHeight = Math.random() * height * 0.8 + height * 0.1;
                const x = i * barWidth;
                const y = (height - barHeight) / 2;
                
                ctx.fillRect(x + 2, y, barWidth - 4, barHeight);
            }
            
            animationId = requestAnimationFrame(draw);
        };
        
        draw();
        this.waveformAnimation = animationId;
    }
    
    stopWaveformAnimation() {
        if (this.waveformAnimation) {
            cancelAnimationFrame(this.waveformAnimation);
            this.waveformAnimation = null;
        }
    }
    
    insertTranscript(text) {
        const input = document.getElementById('chatInput');
        if (input) {
            const currentValue = input.value;
            const needsSpace = currentValue && !currentValue.endsWith(' ');
            input.value = currentValue + (needsSpace ? ' ' : '') + text;
            
            // Auto-resize
            if (window.autoResize) {
                window.autoResize(input);
            }
            
            // Move cursor to end
            input.setSelectionRange(input.value.length, input.value.length);
        }
    }
    
    showContinuousModeUI() {
        // Create floating indicator
        const indicator = document.createElement('div');
        indicator.id = 'continuousModeIndicator';
        indicator.className = 'continuous-mode-indicator glass-morph';
        indicator.innerHTML = `
            <div class="continuous-mode-content">
                <div class="recording-pulse"></div>
                <span>Modo de grabación continua activo</span>
                <button onclick="deepgram.stopContinuousMode()">Detener</button>
            </div>
        `;
        
        document.body.appendChild(indicator);
    }
    
    hideContinuousModeUI() {
        const indicator = document.getElementById('continuousModeIndicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════
    
    updateConfig(config) {
        this.config = { ...this.config, ...config };
        
        // If connected, reconnect with new config
        if (this.isConnected) {
            this.disconnect();
            this.connect();
        }
    }
    
    setLanguage(language) {
        this.config.language = language;
        localStorage.setItem('deepgramLanguage', language);
    }
    
    setModel(model) {
        this.config.model = model;
        localStorage.setItem('deepgramModel', model);
    }
}

// ═══════════════════════════════════════════════════════════════════
// GLOBAL INSTANCE
// ═══════════════════════════════════════════════════════════════════

const deepgram = new DeepGramIntegration();

// Auto-initialize on load
document.addEventListener('DOMContentLoaded', () => {
    const apiKey = localStorage.getItem('deepgramKey');
    if (apiKey) {
        deepgram.initialize(apiKey).catch(console.error);
    }
});

// Export for global use
window.deepgram = deepgram;



