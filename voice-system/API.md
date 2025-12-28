# API Reference - Realtime Voice System

Complete API documentation for client and server.

## Table of Contents

1. [RealtimeVoiceClient](#realtimevoiceclient)
2. [Server REST API](#server-rest-api)
3. [WebSocket Protocol](#websocket-protocol)
4. [Events](#events)
5. [Configuration](#configuration)
6. [Error Handling](#error-handling)

## RealtimeVoiceClient

### Constructor

```javascript
new RealtimeVoiceClient(config: Object)
```

**Parameters**:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| serverUrl | string | 'ws://localhost:4042' | WebSocket server address |
| language | string | 'es' | Default language code |
| sampleRate | number | 16000 | Audio sample rate (Hz) |
| channels | number | 1 | Audio channels (1 = mono) |
| encoding | string | 'linear16' | Audio encoding format |
| autoReconnect | boolean | true | Auto-reconnect on disconnect |
| maxReconnectAttempts | number | 5 | Max reconnection tries |
| reconnectDelay | number | 1000 | Initial reconnect delay (ms) |
| debug | boolean | false | Enable debug logging |

**Example**:

```javascript
const client = new RealtimeVoiceClient({
  serverUrl: 'wss://api.myapp.com:4042',
  language: 'es',
  autoReconnect: true,
  debug: true
});
```

### Methods

#### connect()

```javascript
await client.connect(): Promise<void>
```

Establish WebSocket connection to server.

**Returns**: Promise that resolves when connected

**Throws**: Error if connection fails or timeout

**Example**:

```javascript
try {
  await client.connect();
  console.log('✅ Connected');
} catch (error) {
  console.error('❌ Connection failed:', error);
}
```

#### startListening()

```javascript
await client.startListening(): Promise<void>
```

Start capturing audio from microphone.

**Returns**: Promise that resolves when listening started

**Throws**: Error if microphone unavailable or permission denied

**Permissions**: Requires user to grant microphone access

**Example**:

```javascript
await client.startListening();
console.log('🎤 Listening...');
```

#### stopListening()

```javascript
client.stopListening(): void
```

Stop microphone capture and clean up audio resources.

**Example**:

```javascript
client.stopListening();
console.log('🔇 Stopped listening');
```

#### setLanguage(language)

```javascript
client.setLanguage(language: string): void
```

Change recognition language (must be connected).

**Parameters**:

| Name | Type | Values |
|------|------|--------|
| language | string | 'es', 'en', 'fr', 'de', 'it', 'pt', 'ja', 'zh', 'ko', 'ar', 'hi' |

**Example**:

```javascript
client.setLanguage('en');
```

#### setLLMProvider(provider)

```javascript
client.setLLMProvider(provider: string): void
```

Change language model provider.

**Parameters**:

| Name | Type | Values |
|------|------|--------|
| provider | string | 'gemini', 'claude', 'openai' |

**Example**:

```javascript
client.setLLMProvider('claude');
```

#### reset()

```javascript
client.reset(): void
```

Reset conversation and clear history.

**Example**:

```javascript
client.reset();
```

#### enableAudioPlayback()

```javascript
client.enableAudioPlayback(): void
```

Enable automatic audio playback for TTS responses.

**Note**: Must call before connecting for best results

**Example**:

```javascript
client.enableAudioPlayback();
```

#### disableAudioPlayback()

```javascript
client.disableAudioPlayback(): void
```

Disable automatic audio playback.

**Example**:

```javascript
client.disableAudioPlayback();
```

#### sendAudio(audioData)

```javascript
client.sendAudio(audioData: ArrayBuffer | Buffer): void
```

Send audio to server for processing.

**Parameters**:

| Name | Type | Description |
|------|------|-------------|
| audioData | ArrayBuffer \| Buffer | Raw audio (PCM, 16-bit, 16kHz) |

**Example**:

```javascript
const audioBuffer = new ArrayBuffer(4096);
client.sendAudio(audioBuffer);
```

#### sendMessage(message)

```javascript
client.sendMessage(message: Object): void
```

Send control message to server.

**Parameters**:

```javascript
{
  type: 'setLanguage' | 'setProvider' | 'reset' | 'ping',
  language?: string,    // For setLanguage
  provider?: string     // For setProvider
}
```

**Example**:

```javascript
client.sendMessage({
  type: 'setLanguage',
  language: 'en'
});
```

#### disconnect()

```javascript
client.disconnect(): void
```

Disconnect from server and clean up resources.

**Example**:

```javascript
client.disconnect();
console.log('✅ Disconnected');
```

#### on(event, callback)

```javascript
client.on(event: string, callback: Function): void
```

Register event listener.

**Parameters**:

| Name | Type | Description |
|------|------|-------------|
| event | string | Event name (see Events section) |
| callback | Function | Called when event fires |

**Example**:

```javascript
client.on('transcription', (text) => {
  console.log('You said:', text);
});
```

#### once(event, callback)

```javascript
client.once(event: string, callback: Function): void
```

Register one-time event listener (auto-removes after firing).

**Example**:

```javascript
client.once('ready', () => {
  console.log('Ready!');
});
```

#### off(event, callback)

```javascript
client.off(event: string, callback: Function): void
```

Unregister event listener.

**Example**:

```javascript
client.off('transcription', myCallback);
```

#### emit(event, data)

```javascript
client.emit(event: string, data?: any): void
```

Emit custom event (for internal use).

#### getState()

```javascript
client.getState(): Object
```

Get current client state.

**Returns**:

```javascript
{
  connected: boolean,
  listening: boolean,
  processing: boolean,
  reconnectAttempts: number
}
```

**Example**:

```javascript
const state = client.getState();
console.log('Connected:', state.connected);
```

## Server REST API

### GET /health

Health check endpoint.

**Response** (200):

```json
{
  "status": "ok",
  "server": "realtime-voice-system",
  "timestamp": "2024-12-28T12:00:00.000Z",
  "uptime": 3600
}
```

**Example**:

```bash
curl http://localhost:4042/health
```

### GET /api/config

Get WebSocket configuration and server info.

**Response** (200):

```json
{
  "MCP_SERVER_URL": "ws://localhost:4042",
  "MCP_TOKEN": null,
  "PROTECTED_CONFIG": true,
  "timestamp": 1703767200000
}
```

**Example**:

```bash
curl http://localhost:4042/api/config
```

### POST /api/token

Generate WebSocket authentication token.

**Request Body**:

```json
{
  "clientId": "optional-custom-id"
}
```

**Response** (200):

```json
{
  "token": {
    "token": "abc123def456...",
    "expiresIn": 300
  },
  "expiresIn": 300,
  "clientId": "client-1234567890"
}
```

**Example**:

```bash
curl -X POST http://localhost:4042/api/token \
  -H "Content-Type: application/json" \
  -d '{"clientId":"my-client"}'
```

### GET /api/status

Get service health status.

**Response** (200):

```json
{
  "status": "operational",
  "timestamp": "2024-12-28T12:00:00.000Z",
  "services": {
    "deepgram": {
      "healthy": true
    },
    "llm": {
      "gemini": {
        "healthy": true
      },
      "claude": {
        "healthy": true
      }
    },
    "tts": {
      "mivoz": {
        "healthy": true
      },
      "cartesia": {
        "healthy": false,
        "error": "API unreachable"
      }
    }
  }
}
```

**Example**:

```bash
curl http://localhost:4042/api/status
```

### GET /api/metrics

Get real-time metrics.

**Response** (200):

```json
{
  "timestamp": "2024-12-28T12:00:00.000Z",
  "activeConnections": 5,
  "totalRequests": 142,
  "totalErrors": 3,
  "averageLatency": 450,
  "providers": {
    "deepgram": {
      "healthy": true
    },
    "llm": {
      "healthy": true
    },
    "tts": {
      "healthy": true
    }
  }
}
```

**Example**:

```bash
curl http://localhost:4042/api/metrics
```

## WebSocket Protocol

### Connection

**URL**: `ws://localhost:4042/ws/stream?token=YOUR_TOKEN`

**Authentication**:
1. Call `POST /api/token` to get token
2. Connect WebSocket with `?token=` URL parameter
3. Server validates token on upgrade

### Message Types

#### Connected (Server → Client)

Sent when client first connects.

```json
{
  "type": "connected",
  "clientId": "client-1234567890",
  "timestamp": 1703767200000
}
```

#### Transcription (Server → Client)

Interim or final transcription from Deepgram.

```json
{
  "type": "transcription",
  "text": "Hello, how are you"
}
```

#### Text (Server → Client)

Chunk of LLM response.

```json
{
  "type": "text",
  "content": "I'm doing well, thank you"
}
```

#### Audio (Server → Client)

Binary audio chunk (PCM, 16-bit, 16kHz).

```
[Binary data - 16 KB chunks]
```

#### Response Complete (Server → Client)

Sent when response is complete.

```json
{
  "type": "response_complete",
  "text": "Full response text here...",
  "timestamp": 1703767200000
}
```

#### Error (Server → Client)

Error message.

```json
{
  "type": "error",
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

#### Acknowledgment (Server → Client)

Confirmation of control message.

```json
{
  "type": "ack",
  "action": "setLanguage"
}
```

#### Pong (Server → Client)

Response to client ping.

```json
{
  "type": "pong",
  "timestamp": 1703767200000
}
```

### Client Messages

#### Audio (Client → Server)

Binary PCM audio data.

```javascript
// Send audio
const audioBuffer = new ArrayBuffer(4096);
ws.send(audioBuffer);
```

#### Set Language (Client → Server)

```json
{
  "type": "setLanguage",
  "language": "en"
}
```

#### Set Provider (Client → Server)

```json
{
  "type": "setProvider",
  "provider": "claude"
}
```

#### Reset (Client → Server)

```json
{
  "type": "reset"
}
```

#### Ping (Client → Server)

```json
{
  "type": "ping"
}
```

## Events

### ready

Emitted when connected and authenticated.

```javascript
client.on('ready', () => {
  console.log('Ready for interaction');
});
```

### listening_started

Emitted when microphone starts.

```javascript
client.on('listening_started', () => {
  console.log('Microphone active');
});
```

### listening_stopped

Emitted when microphone stops.

```javascript
client.on('listening_stopped', () => {
  console.log('Microphone inactive');
});
```

### transcription

Emitted when speech is recognized.

```javascript
client.on('transcription', (text) => {
  console.log('Recognized:', text);
});
```

### text

Emitted for each LLM response chunk.

```javascript
client.on('text', (chunk) => {
  console.log('Response chunk:', chunk);
});
```

### audio

Emitted for each audio chunk from TTS.

```javascript
client.on('audio', (audioData) => {
  console.log('Audio chunk received');
});
```

### response_complete

Emitted when response is complete.

```javascript
client.on('response_complete', (data) => {
  console.log('Response:', data.text);
});
```

### error

Emitted on error.

```javascript
client.on('error', (error) => {
  console.error('Error:', error.message);
});
```

### disconnected

Emitted when connection is lost.

```javascript
client.on('disconnected', () => {
  console.log('Disconnected');
});
```

### message

Emitted for unhandled messages.

```javascript
client.on('message', (msg) => {
  console.log('Message:', msg);
});
```

## Configuration

### Environment Variables (.env)

```bash
# Server
NODE_ENV=development
PORT=4042
LOG_LEVEL=info

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Services
DEEPGRAM_API_KEY=
GEMINI_API_KEY=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
MIVOZ_API_KEY=
CARTESIA_API_KEY=
ELEVENLABS_API_KEY=

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60

# Security
TOKEN_TTL=300
```

### Client Configuration

```javascript
const client = new RealtimeVoiceClient({
  serverUrl: 'ws://localhost:4042',    // Server URL
  language: 'es',                       // Default language
  sampleRate: 16000,                    // Audio sample rate
  channels: 1,                          // Audio channels
  encoding: 'linear16',                 // Audio encoding
  autoReconnect: true,                  // Auto-reconnect
  maxReconnectAttempts: 5,              // Max attempts
  reconnectDelay: 1000,                 // Initial delay
  debug: false                          // Debug logging
});
```

## Error Handling

### Error Types

| Code | Status | Description |
|------|--------|-------------|
| UNAUTHORIZED | 401 | Invalid or expired token |
| INVALID_INPUT | 400 | Invalid audio/message format |
| RATE_LIMITED | 429 | Too many requests |
| SERVICE_UNAVAILABLE | 503 | LLM/STT/TTS unavailable |
| CONNECTION_ERROR | - | WebSocket connection failed |
| AUDIO_CAPTURE_ERROR | - | Microphone unavailable |
| WEBSOCKET_ERROR | - | WebSocket error |

### Error Handling Example

```javascript
client.on('error', (error) => {
  switch (error.code) {
    case 'RATE_LIMITED':
      console.log('Too many requests, waiting...');
      setTimeout(() => client.reset(), 60000);
      break;

    case 'UNAUTHORIZED':
      console.log('Token expired, reconnecting...');
      client.disconnect();
      client.connect();
      break;

    case 'SERVICE_UNAVAILABLE':
      console.log('Service unavailable, will retry...');
      break;

    default:
      console.error('Error:', error.message);
  }
});
```

### Recovery Strategies

**Automatic**:
- Token expiry → Auto-reconnect with new token
- Network error → Exponential backoff retry
- Service unavailable → Provider fallback

**Manual**:
- Rate limit → Wait and retry
- Auth error → Get new token and reconnect
- Connection error → Explicit reconnect

---

For more information:
- QUICKSTART.md - Quick setup
- INSTALLATION.md - Detailed installation
- ARCHITECTURE.md - System design
- DEPLOYMENT.md - Production deployment
