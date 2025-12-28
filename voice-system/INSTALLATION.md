# Installation Guide - Realtime Voice System

Complete step-by-step setup for production and development.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Setup](#server-setup)
3. [Client Setup](#client-setup)
4. [API Key Configuration](#api-key-configuration)
5. [Verification](#verification)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- **Node.js**: >= 16.0.0 (check with `node --version`)
- **npm**: >= 7.0.0 (check with `npm --version`)
- **Supported Platforms**: Linux, macOS, Windows
- **Browser Requirements**: Modern browser with WebAudio API support
  - Chrome/Edge 90+
  - Firefox 88+
  - Safari 14.1+

### Microphone & Speaker

- Browser needs microphone access (user permission)
- For production: HTTPS required (microphone only works on secure origins)
- For development: localhost OK without HTTPS

## Server Setup

### 1. Clone or Copy Files

```bash
# Option A: Clone entire repository
git clone <your-repo> my-project
cd my-project/realtime-voice-system/core/server

# Option B: Copy just the server
cp -r realtime-voice-system/core/server ./
cd server
```

### 2. Install Dependencies

```bash
# Install from package.json
npm install

# Verify installation
npm list
# Should show:
# ├── @anthropic-ai/sdk
# ├── @google/generative-ai
# ├── cors
# ├── dotenv
# ├── express
# ├── openai
# └── ws
```

### 3. Configure Environment

```bash
# Create .env file from example
cp .env.example .env

# Edit with your text editor
# nano .env      # Linux/Mac
# code .env      # VS Code
# open .env      # macOS
```

### 4. Add API Keys

Open `.env` and fill in at least these:

**Required for basic operation:**

```bash
# Deepgram for Speech-to-Text
DEEPGRAM_API_KEY=dg_xxxxx...

# At least one LLM provider
GEMINI_API_KEY=AIza...
# OR
ANTHROPIC_API_KEY=sk-ant-...
# OR
OPENAI_API_KEY=sk-...

# At least one TTS provider
MIVOZ_API_KEY=mv_xxxxx...
```

**Optional for fallback:**

```bash
# Fallback providers
CARTESIA_API_KEY=...
ELEVENLABS_API_KEY=...

# Custom configuration
PORT=4042
NODE_ENV=development
LOG_LEVEL=info
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 5. Start Server

```bash
# Development (with auto-restart on changes)
npm run dev
# Requires: npm install -D nodemon

# Production
npm start

# Expected output:
# ╔════════════════════════════════════════════════════════════╗
# ║  🚀 Realtime Voice System Server                          ║
# ║  Status: ✅ Ready                                         ║
# ╠════════════════════════════════════════════════════════════╣
# ║  HTTP:      http://localhost:4042                          ║
# ║  WebSocket: ws://localhost:4042/ws/stream                  ║
# ║  Health:    http://localhost:4042/health                   ║
# ║  Metrics:   http://localhost:4042/api/metrics              ║
# ╚════════════════════════════════════════════════════════════╝
```

### 6. Verify Server

```bash
# Health check
curl http://localhost:4042/health
# Response: {"status":"ok","server":"realtime-voice-system",...}

# Get configuration
curl http://localhost:4042/api/config
# Response: {"MCP_SERVER_URL":"ws://localhost:4042",...}

# Get service status
curl http://localhost:4042/api/status
# Response: {"status":"operational","services":{...}}
```

## Client Setup

### Option 1: Vanilla JavaScript / HTML

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Voice Chat</title>
</head>
<body>
  <div id="app"></div>

  <!-- Include client library -->
  <script src="path/to/realtime-voice-client.js"></script>

  <script>
    // Initialize client
    const client = new RealtimeVoiceClient({
      serverUrl: 'ws://localhost:4042',
      language: 'es',
      debug: true
    });

    // Connect
    document.getElementById('app').innerHTML = '<button id="connect">Connect</button>';

    document.getElementById('connect').addEventListener('click', async () => {
      try {
        await client.connect();
        console.log('✅ Connected');
      } catch (error) {
        console.error('❌ Connection failed:', error);
      }
    });
  </script>
</body>
</html>
```

### Option 2: React Component

```bash
# Install in your React project
npm install

# Copy client library to node_modules or src
cp core/client/src/realtime-voice-client.js ./src/

# Use component
```

```jsx
import React from 'react';
import RealtimeVoiceWidget from './components/RealtimeVoiceWidget';

export default function App() {
  return (
    <div>
      <h1>Voice Assistant</h1>
      <RealtimeVoiceWidget
        serverUrl="ws://localhost:4042"
        language="es"
        autoConnect={false}
      />
    </div>
  );
}
```

### Option 3: React Native

```javascript
// For React Native, use the client with these considerations:
// - Audio capture: Use react-native-audio-record or react-native-voice
// - Audio playback: Use react-native-sound or expo-audio
// - WebSocket: Native WebSocket (or use ws package)

import { RealtimeVoiceClient } from './realtime-voice-client';

const client = new RealtimeVoiceClient({
  serverUrl: 'ws://your-server:4042',
  language: 'es'
});

// Note: Audio capture/playback must be implemented with platform-specific libraries
```

### Option 4: Node.js Server

```javascript
const VoiceBot = require('./templates/nodejs-server-example.js');

// Create bot
const bot = new VoiceBot({
  serverUrl: 'ws://localhost:4042',
  language: 'es'
});

// Initialize
await bot.initialize();

// Process audio
const result = await bot.processAudioFile('./input.wav');
console.log('Result:', result);
```

## API Key Configuration

### Deepgram (Speech-to-Text)

1. Go to https://console.deepgram.com/
2. Sign up / Log in
3. Navigate to "API Keys"
4. Create new key
5. Copy key to `.env`:
   ```bash
   DEEPGRAM_API_KEY=dg_xxxxx
   ```

### Google Gemini (LLM)

1. Go to https://ai.google.dev/
2. Click "Get API Key"
3. Create key for your project
4. Copy to `.env`:
   ```bash
   GEMINI_API_KEY=AIza...
   ```

### Anthropic Claude (LLM)

1. Go to https://console.anthropic.com/
2. Sign up / Log in
3. Navigate to "API Keys"
4. Create new key
5. Copy to `.env`:
   ```bash
   ANTHROPIC_API_KEY=sk-ant-...
   ```

### OpenAI GPT (LLM)

1. Go to https://platform.openai.com/
2. Sign up / Log in
3. Navigate to "API Keys"
4. Create new secret key
5. Copy to `.env`:
   ```bash
   OPENAI_API_KEY=sk-...
   ```

### MiVoz (Text-to-Speech)

1. Go to https://www.mivoz.com/
2. Create account
3. Get API key from dashboard
4. Copy to `.env`:
   ```bash
   MIVOZ_API_KEY=mv_...
   MIVOZ_VOICE_ID=sandra-es  # Spanish voice ID
   ```

### Cartesia Sonic (TTS)

1. Go to https://www.cartesia.ai/
2. Create account
3. Get API key
4. Copy to `.env`:
   ```bash
   CARTESIA_API_KEY=...
   ```

### ElevenLabs (TTS)

1. Go to https://elevenlabs.io/
2. Create account
3. Navigate to "API"
4. Copy API key
5. Copy to `.env`:
   ```bash
   ELEVENLABS_API_KEY=...
   ```

## Verification

### Test Server Response

```bash
# Test REST endpoints
curl http://localhost:4042/health

# Test WebSocket
wscat -c ws://localhost:4042/ws/stream?token=test
# Should show connection error (expected - need valid token)
```

### Test Client Connection

```javascript
const client = new RealtimeVoiceClient({
  serverUrl: 'ws://localhost:4042'
});

await client.connect();
console.log('✅ Client connected');

client.on('error', (err) => {
  console.error('❌ Error:', err);
});
```

### Test Audio Pipeline

1. Open `templates/minimal-html-example.html` in browser
2. Click "Conectar"
3. Click "Escuchar"
4. Speak into microphone
5. Should see transcription and AI response

## Troubleshooting

### Server won't start

```bash
# Check port in use
lsof -i :4042

# Check Node.js version
node --version  # Should be >= 16

# Check dependencies
npm list
npm install  # Reinstall if needed

# Check for syntax errors
node src/index.js
```

### Connection fails

```bash
# Check server is running
curl http://localhost:4042/health

# Check CORS settings
# Edit .env:
ALLOWED_ORIGINS=http://localhost:3000,*

# Check firewall
# Allow port 4042 in firewall settings
```

### Microphone not working

```javascript
// Test microphone access
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => console.log('✅ Microphone OK'))
  .catch(err => console.error('❌ Microphone blocked:', err));

// In browser console, allow microphone permission
// Reload page after allowing
```

### API key errors

```bash
# Verify key format
echo $DEEPGRAM_API_KEY  # Should be non-empty

# Test Deepgram API directly
curl -H "Authorization: Token $DEEPGRAM_API_KEY" \
  https://api.deepgram.com/v1/models

# Check server logs for specific errors
npm start  # Will show API errors
```

### Audio quality issues

```javascript
// Adjust in client config:
const client = new RealtimeVoiceClient({
  serverUrl: 'ws://localhost:4042',
  sampleRate: 16000,  // Higher = better quality, more bandwidth
  channels: 1         // Mono is sufficient for voice
});
```

## Next Steps

- **ARCHITECTURE.md** - Understand system design
- **API.md** - Client and server API reference
- **DEPLOYMENT.md** - Production setup with Docker
- **templates/** - Full working examples

---

Need help? Check the troubleshooting section or review server logs with `npm start`.
