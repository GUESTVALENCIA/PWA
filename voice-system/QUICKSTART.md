# Realtime Voice System - Quickstart (5 minutes)

Get a working realtime voice system up and running in 5 minutes.

## Prerequisites

- Node.js >= 16.0.0
- API keys for at least one provider:
  - STT: [Deepgram](https://console.deepgram.com/)
  - LLM: [Google Gemini](https://ai.google.dev/), [Anthropic Claude](https://console.anthropic.com/), or [OpenAI](https://platform.openai.com/)
  - TTS: [MiVoz](https://www.mivoz.com/), [Cartesia](https://www.cartesia.ai/), or [ElevenLabs](https://elevenlabs.io/)

## 1. Setup Server (2 minutes)

```bash
# Clone or copy to your project
cd realtime-voice-system/core/server

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env with your API keys (see below)

# Start server
npm start
# ✅ Server running on ws://localhost:4042
```

### Minimal .env

```bash
# Required
DEEPGRAM_API_KEY=your_deepgram_key
GEMINI_API_KEY=your_gemini_key

# Optional (for fallback)
ANTHROPIC_API_KEY=your_claude_key
OPENAI_API_KEY=your_openai_key
MIVOZ_API_KEY=your_mivoz_key
```

## 2. Use Client (2 minutes)

### Option A: Vanilla JavaScript (HTML)

```html
<!DOCTYPE html>
<html>
<head>
  <script src="realtime-voice-client.js"></script>
</head>
<body>
  <button id="start">Start Listening</button>
  <div id="output"></div>

  <script>
    const client = new RealtimeVoiceClient({
      serverUrl: 'ws://localhost:4042',
      language: 'es'
    });

    document.getElementById('start').addEventListener('click', async () => {
      // Connect to server
      await client.connect();

      // Listen for responses
      client.on('transcription', (text) => {
        console.log('You said:', text);
      });

      client.on('text', (chunk) => {
        document.getElementById('output').innerHTML += chunk;
      });

      // Start microphone
      await client.startListening();
    });
  </script>
</body>
</html>
```

### Option B: React Component

```jsx
import RealtimeVoiceWidget from './templates/react-component-example.jsx';

export default function App() {
  return (
    <RealtimeVoiceWidget
      serverUrl="ws://localhost:4042"
      language="es"
      onTranscription={(text) => console.log('Transcribed:', text)}
      onResponse={(text) => console.log('Response:', text)}
    />
  );
}
```

### Option C: Node.js Server

```javascript
const VoiceBot = require('./templates/nodejs-server-example.js');

const bot = new VoiceBot({
  serverUrl: 'ws://localhost:4042',
  language: 'es'
});

// Initialize
await bot.initialize();

// Process audio
const result = await bot.processAudioFile('./audio.wav');
console.log('Transcription:', result.transcriptions);
console.log('Response:', result.response);
```

## 3. Test It (1 minute)

### Using provided HTML example:

```bash
# Open in browser
open templates/minimal-html-example.html

# Or in VS Code with Live Server extension
# Right-click → Open with Live Server
```

### Using CLI health check:

```bash
# Check if server is running
curl http://localhost:4042/health

# Expected response:
# {"status":"ok","server":"realtime-voice-system",...}
```

## Common Issues

### "Cannot get token" / Connection fails

```bash
# Check server is running on port 4042
lsof -i :4042

# Check firewall allows localhost:4042
# Check CORS settings in .env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### "No microphone access"

```javascript
// Browser blocks microphone on insecure origins
// Needs HTTPS in production or localhost
// Check browser console for permission error

// Test microphone access:
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => console.log('✅ Microphone OK'))
  .catch(err => console.error('❌', err));
```

### "API key errors"

```bash
# Verify API keys in .env
cat .env | grep API_KEY

# Test Deepgram key
curl -H "Authorization: Token YOUR_KEY" \
  https://api.deepgram.com/v1/models

# Test Gemini key
curl -X POST \
  https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-exp:generateContent?key=YOUR_KEY
```

## Next Steps

- **Read INSTALLATION.md** for detailed setup
- **Read ARCHITECTURE.md** for system design
- **Read API.md** for client/server API reference
- **See templates/** for complete examples
- **Read DEPLOYMENT.md** for production setup

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Browser/App)                 │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐   │
│  │  Microphone  │→ │  WebSocket  │→ │   Speaker    │   │
│  │   Capture    │  │  Connection │  │   Playback   │   │
│  └──────────────┘  └─────────────┘  └──────────────┘   │
└──────────────────────────┬──────────────────────────────┘
                           │
                    ws://localhost:4042
                           │
┌──────────────────────────▼──────────────────────────────┐
│               SERVER (WebSocket)                         │
│  ┌────────────────────────────────────────────────────┐ │
│  │                   Pipeline                         │ │
│  │  Audio → STT → LLM Response → TTS → Audio Stream  │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌──────────┐  ┌─────────┐  ┌──────────────────────┐    │
│  │ Deepgram │  │ Gemini  │  │ MiVoz / Cartesia /   │    │
│  │   (STT)  │  │ Claude  │  │ ElevenLabs (TTS)     │    │
│  │ OpenAI   │  │ OpenAI  │  │                      │    │
│  │          │  │ (LLM)   │  │                      │    │
│  └──────────┘  └─────────┘  └──────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## Support

- API Keys: Check provider dashboards
- Debug mode: Set `debug: true` in client config
- Logs: Check server console output
- Issues: See TROUBLESHOOTING section in docs

---

**Ready?** Start your server, open the HTML example, and click "Conectar" to begin!
