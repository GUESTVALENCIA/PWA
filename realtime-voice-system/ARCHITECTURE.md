# System Architecture - Realtime Voice System

Detailed technical architecture, design patterns, and component interactions.

## Table of Contents

1. [System Overview](#system-overview)
2. [Core Components](#core-components)
3. [Data Flow](#data-flow)
4. [Server Architecture](#server-architecture)
5. [Client Architecture](#client-architecture)
6. [Service Integration](#service-integration)
7. [Design Patterns](#design-patterns)
8. [Performance Considerations](#performance-considerations)
9. [Security Architecture](#security-architecture)

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      REALTIME VOICE SYSTEM                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    BROWSER / APP                         │  │
│  │  ┌───────────────┐  ┌─────────────────┐  ┌───────────┐  │  │
│  │  │  Microphone   │  │  RealtimeVoice  │  │  Speaker  │  │  │
│  │  │   (AudioAPI)  │→ │    Client       │→ │ (WebAudio)│  │  │
│  │  └───────────────┘  └─────────────────┘  └───────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                         ▲                                       │
│                         │ WebSocket                            │
│                         │ Bidirectional                        │
│                         ▼                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                     SERVER (Node.js)                     │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │              Audio Processing Pipeline             │  │  │
│  │  │  Audio ──→ STT ──→ LLM ──→ TTS ──→ Audio Stream    │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │                                                            │  │
│  │  ┌─────────────┐  ┌──────────┐  ┌──────────────────┐     │  │
│  │  │  Deepgram   │  │ Gemini   │  │  MiVoz/Cartesia/ │     │  │
│  │  │   (Speech)  │  │ Claude   │  │  ElevenLabs      │     │  │
│  │  │   Recognition         OpenAI      (Voice)      │     │  │
│  │  └─────────────┘  └──────────┘  └──────────────────┘     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Key Characteristics

- **Real-time**: Streaming-first architecture with <300ms perceived latency
- **Universal**: Single codebase works in browser, React, React Native, Node.js, Electron
- **Modular**: Pluggable services with fallback chains
- **Secure**: Token authentication, rate limiting, input validation
- **Resilient**: Automatic reconnection, error recovery, graceful degradation

## Core Components

### 1. Client Library (`realtime-voice-client.js`)

**Purpose**: Browser and Node.js compatibility layer

**Key Classes**:

- `RealtimeVoiceClient` - Main client class
  - Connection management
  - Message routing
  - Event handling
  - State management

- `AudioProcessor` - Audio capture
  - WebAudio API integration
  - Float32 → Int16 PCM conversion
  - Microphone stream handling
  - 4096-sample buffer processing

- `AudioPlayback` - Audio playback
  - Queue-based playback
  - Int16 → Float32 conversion
  - Buffering and synchronization
  - Speaker output

**Responsibilities**:
- Establish WebSocket connection with token auth
- Capture microphone audio
- Send audio chunks to server
- Handle received messages (transcription, responses, audio)
- Manage playback
- Emit events to application

**API**:
```javascript
const client = new RealtimeVoiceClient(config);
await client.connect();
await client.startListening();
client.on('transcription', callback);
client.on('text', callback);
client.on('audio', callback);
```

### 2. WebSocket Server (`index.js`)

**Purpose**: Orchestrate real-time voice pipeline

**Architecture**:
```
HTTP Server (Express)
    │
    ├── REST Endpoints
    │   ├── /health
    │   ├── /api/config
    │   ├── /api/token
    │   ├── /api/metrics
    │   └── /api/status
    │
    └── WebSocket Server (ws://)
        │
        ├── Connection Handler
        │   ├── Token Validation
        │   ├── Client State Init
        │   └── Session Tracking
        │
        └── Message Handler
            ├── Audio → STT
            ├── Transcript → LLM
            ├── Response → TTS
            └── Audio → Client
```

**Key Functions**:

1. **Connection Handler**
   - Validates token before upgrade
   - Creates per-client state
   - Initializes conversation history
   - Sets default language/provider

2. **Audio Message Handler**
   - Validates audio (size, format)
   - Feeds to Deepgram STT
   - Receives transcription callback
   - Passes to LLM processor

3. **LLM Processor**
   - Sends transcript to LLM service
   - Streams response chunks
   - Accumulates full response
   - Updates conversation history

4. **TTS Processor**
   - Sends complete response to TTS
   - Streams audio chunks
   - Sends to client over WebSocket
   - Completes response

### 3. STT Service (`deepgram-streaming.js`)

**Purpose**: Real-time speech-to-text transcription

**Methods**:
- `startStream()` - Start WebSocket transcription
- `sendAudio()` - Send audio chunks
- `finalize()` - Complete transcription
- `healthCheck()` - Service health

**Key Features**:
- WebSocket primary path (<100ms latency)
- HTTP fallback for non-streaming
- Interim results support
- Confidence scores
- Multi-language support
- Automatic endpointing (100ms silence detection)

**Configuration**:
```javascript
{
  model: 'nova-2',        // Latest Deepgram model
  encoding: 'linear16',   // PCM format
  sampleRate: 16000,      // Standard audio rate
  language: 'es',         // Auto-detect or specified
  punctuate: true,        // Add punctuation
  smart_format: true      // Format numbers, currency
}
```

### 4. LLM Service (`llm-streaming.js`)

**Purpose**: Multi-provider LLM routing with streaming

**Providers** (in fallback order):
1. Gemini 2.0 Flash (primary - fastest)
2. Claude 3.5 Sonnet (fallback - best quality)
3. OpenAI GPT-4o-mini (fallback - general purpose)

**Key Features**:
- Streaming response via async generators
- Conversation history management
- Provider-specific message formatting
- Automatic fallback on failure
- System prompt injection
- Temperature and token configuration

**Streaming**:
```javascript
async *streamResponse(userMessage) {
  // Yields chunks as they arrive
  yield chunk1;
  yield chunk2;
  // ...
}
```

### 5. TTS Service (`tts-streaming.js`)

**Purpose**: Multi-provider text-to-speech with fallback

**Provider Routing**:
```
Primary: MiVoz Native (Spanish voices)
  ↓ (if fails)
Fallback: Cartesia Sonic (low latency)
  ↓ (if fails)
Fallback: ElevenLabs (high quality)
```

**Key Features**:
- Dynamic provider selection
- Automatic fallback on failure
- WebSocket and HTTP support
- Raw PCM output (16kHz, mono)
- Health checks per provider
- Voice ID configuration

### 6. Middleware Layer

#### Authentication (`auth.js`)
- Token generation (5-minute TTL)
- Token validation
- One-time use enforcement
- WebSocket upgrade verification

#### Rate Limiting (`rate-limiter.js`)
- Per-client rate limiting (60 req/min)
- Sliding window algorithm
- Temporary blocking after limit exceeded
- Automatic cleanup of old records

#### Input Validation (`validator.js`)
- Audio validation (256B - 1MB)
- Text validation (1 - 5000 chars)
- Message type validation
- Language and provider validation

#### Error Handling (`error-handler.js`)
- Categorized error responses
- Recovery strategies
- User-friendly error messages
- Error logging and tracking

## Data Flow

### Voice Interaction Pipeline

```
1. USER SPEAKS
   │
   ├─→ Client captures audio via WebAudio API
   │
   └─→ Float32 samples converted to Int16 PCM

2. AUDIO TRANSFER
   │
   ├─→ Chunked (4096 samples = ~256ms)
   │
   ├─→ Sent via WebSocket binary frames
   │
   └─→ Server rate-limited (60 chunks/min = acceptable)

3. SPEECH RECOGNITION
   │
   ├─→ Audio stream sent to Deepgram
   │
   ├─→ Interim results streamed back
   │
   ├─→ Final transcription when speech ends
   │
   └─→ Sent to client as { type: 'transcription', text: '...' }

4. LANGUAGE PROCESSING
   │
   ├─→ Transcript sent to LLM service
   │
   ├─→ LLM provider selected (Gemini/Claude/OpenAI)
   │
   ├─→ Response streamed chunk by chunk
   │
   ├─→ Each chunk sent to client as { type: 'text', content: '...' }
   │
   └─→ Full response accumulated on server

5. SPEECH SYNTHESIS
   │
   ├─→ Complete response sent to TTS
   │
   ├─→ Audio generated (WebSocket preferred)
   │
   ├─→ Audio chunks streamed back to client
   │
   └─→ Sent as binary WebSocket frames

6. AUDIO PLAYBACK
   │
   ├─→ Client receives audio chunks
   │
   ├─→ Queued in AudioPlayback buffer
   │
   ├─→ Int16 PCM converted to Float32
   │
   ├─→ Audio buffer created and played
   │
   └─→ Next chunk processed automatically
```

### Latency Breakdown

```
Optimal case (all local, fast network):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Audio capture      10ms   (buffering)
Network latency   20ms   (localhost)
STT first-token  100ms   (Deepgram)
LLM first-token  150ms   (Gemini 2.0 Flash)
TTS first-audio  200ms   (MiVoz)
Network latency   20ms
Audio playback    10ms
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total perceived   ~510ms (acceptable for real-time)
```

## Server Architecture

### Request Lifecycle

```
1. WebSocket Upgrade Request
   │
   └─→ auth.js: verifyClientUpgrade()
       └─→ Extract token from URL
       └─→ Validate token
       └─→ Attach clientId to request
       └─→ Allow/reject upgrade

2. Connection Established
   │
   └─→ Create client state object
       ├─→ clientId, language, llmProvider
       ├─→ conversationHistory []
       ├─→ isProcessing: false
       └─→ deepgramSession: null

3. Message Received
   │
   ├─→ Check if audio (binary) or control (JSON)
   │
   ├─→ For audio:
   │   ├─→ validator.validateInput.audio()
   │   ├─→ checkRateLimit(clientId)
   │   ├─→ Deepgram streaming
   │   └─→ STT callback → LLM → TTS
   │
   └─→ For control:
       ├─→ validator.validateInput.config()
       ├─→ Handle: setLanguage, setProvider, reset, ping
       └─→ Send acknowledgment

4. Response Streaming
   │
   ├─→ LLM chunks streamed immediately
   │   └─→ client.on('text', chunk)
   │
   ├─→ TTS audio streamed immediately
   │   └─→ ws.send(audioChunk) [binary]
   │
   └─→ response_complete event when done

5. Connection Close
   │
   └─→ Cleanup resources
       ├─→ deepgramSession.cleanup()
       ├─→ Log session metrics
       └─→ Remove from active clients
```

### Performance Optimization

1. **Per-Client Isolation**
   - Each client has separate STT/LLM/TTS instances
   - No shared state between clients
   - No blocking operations

2. **Streaming-First Design**
   - Async generators yield chunks immediately
   - No buffering before sending
   - Chunks sent as soon as available

3. **Connection Keep-Alive**
   - Ping/pong every 30 seconds
   - Prevents proxy timeouts
   - Graceful disconnection detection

4. **Message Queuing**
   - Queue for offline mode
   - Process when reconnected
   - No message loss

## Client Architecture

### Event-Driven Model

```javascript
client.on('ready', () => {})           // Connected & authenticated
client.on('listening_started', () => {}) // Microphone active
client.on('transcription', (text) => {}) // STT result
client.on('text', (chunk) => {})        // LLM text chunk
client.on('audio', (data) => {})        // TTS audio chunk
client.on('response_complete', () => {}) // Interaction complete
client.on('error', (err) => {})        // Error occurred
client.on('disconnected', () => {})    // Connection lost
```

### State Machine

```
    [DISCONNECTED]
         │
         └─→ connect() ──→ [CONNECTING] ──→ (on 'ready') ──→ [CONNECTED]
                                │
                                └─→ (error) ──→ (auto-reconnect)
                                      │
                                      └─→ [RECONNECTING]

    [CONNECTED]
         │
         ├─→ startListening() ──→ [LISTENING]
         │                            │
         │                            └─→ (speech received) ──→ [PROCESSING]
         │                                 │
         │                                 └─→ (response done) ──→ [LISTENING]
         │
         └─→ disconnect() ──→ [DISCONNECTED]
```

## Service Integration

### STT Integration

```javascript
// Deepgram with fallback to HTTP
async function handleAudioMessage(buffer, ws, client) {
  if (!client.deepgramSession) {
    client.deepgramSession = new DeepgramStreamingService(apiKey);

    await client.deepgramSession.startStream(
      client.language,
      (transcriptData) => {
        if (transcriptData.isFinal) {
          // Process with LLM
          processWithLLM(transcriptData.text, ws, client);
        }
      }
    );
  }

  client.deepgramSession.sendAudio(buffer);
}
```

### LLM Integration

```javascript
async function processWithLLM(transcript, ws, client) {
  let fullResponse = '';

  // Stream LLM response
  for await (const chunk of services.llmStreaming.streamResponse(transcript)) {
    fullResponse += chunk;

    // Send to client immediately
    ws.send(JSON.stringify({
      type: 'text',
      content: chunk
    }));
  }

  // Then stream TTS
  for await (const audioChunk of services.ttsStreaming.streamAudio(fullResponse)) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(audioChunk); // Binary
    }
  }
}
```

### TTS Integration

```javascript
async *streamAudio(textStream, options = {}) {
  const providers = this.getProviderChain(); // [MiVoz, Cartesia, ElevenLabs]

  for (const provider of providers) {
    try {
      yield* await provider.service.streamAudio(textStream, options);
      return; // Success
    } catch (error) {
      continue; // Try next
    }
  }

  throw new Error('All TTS providers failed');
}
```

## Design Patterns

### 1. Async Generator Pattern (Streaming)

**Problem**: Sending large responses in real-time without buffering

**Solution**:
```javascript
async *streamResponse(message) {
  for await (const chunk of llmStream) {
    yield chunk; // Send immediately
  }
}

// Consumer
for await (const chunk of generator) {
  console.log(chunk);
}
```

**Benefits**:
- Low latency (no buffering)
- Memory efficient
- Back-pressure handling

### 2. Provider Fallback Chain

**Problem**: Services may be unavailable

**Solution**:
```javascript
const providers = [primary, fallback1, fallback2];

for (const provider of providers) {
  try {
    return await provider.execute();
  } catch (error) {
    continue; // Try next
  }
}
```

**Benefits**:
- High availability
- Graceful degradation
- Transparent to caller

### 3. Per-Client Isolation

**Problem**: Shared state causes issues

**Solution**:
```javascript
const client = {
  id: clientId,
  deepgramSession: null,    // Per-client
  conversationHistory: [],  // Per-client
  llmProvider: 'gemini'     // Per-client
};
```

**Benefits**:
- No cross-client interference
- Conversation isolation
- Parallel request handling

### 4. Event Emitter Pattern

**Problem**: Application needs to react to multiple events

**Solution**:
```javascript
client.on('transcription', handleTranscription);
client.on('text', handleText);
client.on('error', handleError);
```

**Benefits**:
- Loose coupling
- Easy to extend
- Clear event flow

## Performance Considerations

### Optimization Strategies

1. **Network**
   - Binary WebSocket frames for audio
   - Compression disabled (audio already compressed)
   - Chunked transfer (reduce latency)

2. **CPU**
   - Single-threaded Node.js (sufficient)
   - Async/await prevents blocking
   - No heavy processing on server

3. **Memory**
   - Per-client state kept minimal
   - Audio buffers garbage collected
   - No unbounded queues

4. **Latency**
   - Streaming over buffering
   - Immediate transmission
   - Concurrent pipelines

### Capacity Planning

```
Single server estimate:
├─ CPU: 1 concurrent connection per core
├─ Memory: ~50MB + 10MB per active connection
├─ Network: ~100kbps per active connection
└─ Throughput: ~20-30 concurrent calls on modern hardware

Scaling:
├─ Load balancer distributes to multiple servers
├─ Sticky sessions for WebSocket persistence
├─ Shared conversation storage (Redis/Database)
└─ Service discovery for multi-region
```

## Security Architecture

(See WEBSOCKET_SECURITY_SPECIFICATION.md for detailed security design)

### Key Security Features

1. **Authentication**
   - Token-based (JWT-style)
   - One-time use
   - 5-minute expiry

2. **Authorization**
   - Per-client rate limiting
   - Input validation
   - Origin validation (CORS)

3. **Encryption**
   - HTTPS/WSS in production
   - TLS 1.2+
   - No sensitive data in logs

4. **Monitoring**
   - Request metrics
   - Error tracking
   - Anomaly detection

---

For more details, see:
- QUICKSTART.md - 5-minute setup
- INSTALLATION.md - Detailed installation
- API.md - API reference
- DEPLOYMENT.md - Production setup
