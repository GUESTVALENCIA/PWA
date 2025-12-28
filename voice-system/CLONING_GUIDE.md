# Cloning Guide - Reuse in Other Projects

How to reuse the Realtime Voice System in other projects, applications, and platforms.

## Table of Contents

1. [Quick Clone (5 minutes)](#quick-clone-5-minutes)
2. [Integration Patterns](#integration-patterns)
3. [Platform-Specific Setup](#platform-specific-setup)
4. [Customization](#customization)
5. [Troubleshooting](#troubleshooting)

## Quick Clone (5 minutes)

### Step 1: Copy Core Files

```bash
# Copy the system to your project
cp -r realtime-voice-system/core ./my-project/

# Or just the parts you need:
cp -r realtime-voice-system/core/server ./my-backend/
cp -r realtime-voice-system/core/client ./my-frontend/
```

### Step 2: Server Setup

```bash
cd my-project/core/server

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Start server
npm start
```

### Step 3: Client Integration

**Option A: Web/React**
```html
<script src="path/to/realtime-voice-client.js"></script>
```

```jsx
import RealtimeVoiceWidget from './path/to/react-component-example.jsx';
```

**Option B: Node.js**
```javascript
const VoiceBot = require('./path/to/nodejs-server-example.js');
```

**Option C: React Native**
Copy `realtime-voice-client.js` to your project and import it.

### Step 4: Test

```bash
# Test server health
curl http://your-server:4042/health

# Test in browser
open templates/minimal-html-example.html
```

## Integration Patterns

### Pattern 1: Embedded Widget (Recommended for Most Projects)

For web applications, use as a simple widget component.

**Installation**:
```bash
# Copy client library and React component
cp realtime-voice-system/core/client/src/realtime-voice-client.js ./src/
cp realtime-voice-system/templates/react-component-example.jsx ./src/components/
```

**Usage**:
```jsx
import RealtimeVoiceWidget from './components/RealtimeVoiceWidget';

export default function ChatPage() {
  return (
    <div>
      <h1>Chat with AI</h1>
      <RealtimeVoiceWidget
        serverUrl="wss://api.myapp.com:4042"
        language="es"
        onTranscription={(text) => saveToHistory(text)}
        onResponse={(text) => displayResponse(text)}
      />
    </div>
  );
}
```

**What you get**:
- ✅ Full UI included
- ✅ State management
- ✅ Styling included
- ✅ Responsive design

### Pattern 2: Custom Implementation

For applications needing custom UI/UX.

**Installation**:
```javascript
// Import the client class
import { RealtimeVoiceClient } from './realtime-voice-client.js';
```

**Usage**:
```jsx
const [isListening, setIsListening] = useState(false);
const [transcript, setTranscript] = useState('');
const [response, setResponse] = useState('');
const clientRef = useRef(null);

const startVoiceChat = async () => {
  // Initialize client
  clientRef.current = new RealtimeVoiceClient({
    serverUrl: 'wss://api.myapp.com:4042',
    language: 'es'
  });

  // Listen for events
  clientRef.current.on('transcription', setTranscript);
  clientRef.current.on('text', (chunk) => {
    setResponse(prev => prev + chunk);
  });

  // Connect and start listening
  await clientRef.current.connect();
  await clientRef.current.startListening();
  setIsListening(true);
};

const stopVoiceChat = () => {
  clientRef.current?.stopListening();
  setIsListening(false);
};
```

**What you get**:
- ✅ Full control over UI
- ✅ Custom styling
- ✅ Integration with your components
- ✅ Flexible event handling

### Pattern 3: Backend Integration (Node.js/Server)

For server-side voice processing, APIs, chatbots.

**Installation**:
```bash
npm install realtime-voice-client
```

**Usage**:
```javascript
const VoiceBot = require('./realtime-voice-system/templates/nodejs-server-example.js');

const bot = new VoiceBot({
  serverUrl: 'ws://localhost:4042',
  language: 'es'
});

// Initialize
await bot.initialize();

// Process audio file
const result = await bot.processAudioFile('./user-audio.wav');

console.log('Transcription:', result.transcriptions);
console.log('AI Response:', result.response);

// Save conversation
await bot.saveConversation('conversation.json');
```

**What you get**:
- ✅ Voice API integration
- ✅ Batch processing
- ✅ Conversation history
- ✅ Server-side logic

### Pattern 4: Cross-Platform App (React Native)

For mobile applications.

**Installation**:
```bash
# Copy client to your React Native project
cp realtime-voice-system/core/client/src/realtime-voice-client.js ./src/

# Install WebSocket library
npm install ws
```

**Usage with React Native Audio**:
```javascript
import { RealtimeVoiceClient } from './realtime-voice-client';
import AudioRecord from 'react-native-audio-record';
import Sound from 'react-native-sound';

const client = new RealtimeVoiceClient({
  serverUrl: 'wss://api.myapp.com:4042',
  language: 'es'
});

// Custom audio capture (React Native specific)
let audioData = [];

AudioRecord.on('data', (data) => {
  // Convert string to buffer and send
  const buffer = Buffer.from(data, 'binary');
  client.sendAudio(buffer);
});

// Events
client.on('audio', (audioChunk) => {
  // Play audio using react-native-sound
  Sound.play(audioChunk);
});
```

**What you get**:
- ✅ Mobile-friendly
- ✅ Platform-specific audio handling
- ✅ Native performance

## Platform-Specific Setup

### Web Application (React/Vue/Angular)

```bash
# 1. Copy files
cp realtime-voice-system/core/client/src/realtime-voice-client.js ./src/

# 2. Import in component
import { RealtimeVoiceClient } from './realtime-voice-client';

# 3. Use with your framework
# React: Import as component or use hooks
# Vue: Create plugin or composable
# Angular: Create service
```

### Node.js Chatbot

```bash
# 1. Copy
cp realtime-voice-system/templates/nodejs-server-example.js ./

# 2. Import
const VoiceBot = require('./nodejs-server-example.js');

# 3. Use
const bot = new VoiceBot({...});
await bot.initialize();
```

### Electron Desktop App

```bash
# 1. Install
npm install realtime-voice-client

# 2. Use in preload script or renderer
const { RealtimeVoiceClient } = require('realtime-voice-client');

# 3. WebSocket works in Electron
const client = new RealtimeVoiceClient({...});
```

### Slack Bot

```javascript
// Slack integration example
const { App } = require('@slack/bolt');
const VoiceBot = require('./realtime-voice-system/templates/nodejs-server-example.js');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

// Handle voice messages
app.message(async ({ message, say }) => {
  const bot = new VoiceBot({...});
  await bot.initialize();

  const result = await bot.processAudioFile(message.file);

  await say({
    text: `Transcription: ${result.transcriptions[0].text}`,
    thread_ts: message.ts
  });
});
```

### Discord Bot

```javascript
// Discord.js integration example
const { Client, Intents } = require('discord.js');
const VoiceBot = require('./realtime-voice-system/templates/nodejs-server-example.js');

const client = new Client({ intents: [Intents.FLAGS.GUILD_VOICE_STATES] });

client.on('voiceStateUpdate', async (oldState, newState) => {
  const bot = new VoiceBot({...});
  await bot.initialize();

  // Process voice channel audio
  const result = await bot.processAudioBuffer(audioData);

  // Send response to text channel
  newState.guild.channels.cache
    .find(ch => ch.type === 'GUILD_TEXT')
    .send(result.response);
});
```

### Twilio Voice Integration

```javascript
// Twilio webhook endpoint
const express = require('express');
const VoiceBot = require('./realtime-voice-system/templates/nodejs-server-example.js');

const app = express();

app.post('/twilio-webhook', async (req, res) => {
  const bot = new VoiceBot({...});
  await bot.initialize();

  // Process voice from Twilio
  const result = await bot.processAudioBuffer(req.body.recording);

  // Use TwiML to respond
  const twiml = `
    <Response>
      <Say>${result.response}</Say>
    </Response>
  `;

  res.type('text/xml');
  res.send(twiml);
});
```

## Customization

### Custom Server Configuration

```javascript
// Custom configuration file: config/voice.js
module.exports = {
  // Override defaults
  port: 5000,
  defaultLanguage: 'en',
  defaultLLMProvider: 'claude',
  defaultTTSProvider: 'elevenlabs',

  // Custom options
  maxConnections: 100,
  tokenTTL: 600,
  rateLimitPerMinute: 120
};
```

### Custom UI Component

```jsx
// components/CustomVoiceWidget.jsx
import { RealtimeVoiceClient } from '../realtime-voice-client';

export default function CustomVoiceWidget() {
  // Your custom implementation
  // with your own styling and layout

  return (
    <div className="custom-voice-widget">
      {/* Your UI */}
    </div>
  );
}
```

### Custom Service Provider

```javascript
// services/custom-tts.js
class CustomTTSService {
  async streamAudio(textStream, options) {
    // Your custom TTS implementation
    for await (const chunk of customTTSStream) {
      yield chunk;
    }
  }
}

// Use in server
const ttsService = new CustomTTSService();
```

### Environment-Specific Configuration

```bash
# .env.production
NODE_ENV=production
PORT=4042
DEEPGRAM_API_KEY=prod_key...
GEMINI_API_KEY=prod_key...

# .env.staging
NODE_ENV=staging
PORT=4042
DEEPGRAM_API_KEY=staging_key...
GEMINI_API_KEY=staging_key...

# .env.development
NODE_ENV=development
PORT=3000
DEEPGRAM_API_KEY=dev_key...
GEMINI_API_KEY=dev_key...
```

## Troubleshooting

### Connection Fails After Cloning

```bash
# 1. Check server is running
curl http://localhost:4042/health

# 2. Check environment variables
cat .env | grep API_KEY

# 3. Check CORS settings
# Make sure ALLOWED_ORIGINS includes your client URL

# 4. Check WebSocket URL
# Browser → Server must be reachable
```

### "Module not found" Error

```javascript
// Make sure path is correct
import { RealtimeVoiceClient } from './path/to/realtime-voice-client.js';

// Or use relative imports
import { RealtimeVoiceClient } from '../../../realtime-voice-system/core/client/src/realtime-voice-client.js';
```

### CORS Issues

```bash
# In .env, add your client URL
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,https://myapp.com
```

### Authentication Failed

```bash
# Make sure you're:
# 1. Getting token from /api/token endpoint
# 2. Including token in WebSocket URL
# 3. Token is not expired (5 minutes default)
```

### Audio Quality Issues

```javascript
// Adjust sample rate in client
const client = new RealtimeVoiceClient({
  sampleRate: 24000  // Higher quality (more bandwidth)
});

// Or in server
DEEPGRAM_API_KEY=...
SAMPLE_RATE=24000
```

## Migration from Other Voice Systems

### From Twilio

```javascript
// Old: Twilio integration
const twilio = require('twilio');

// New: Realtime Voice System
const VoiceBot = require('./realtime-voice-system/...');
const bot = new VoiceBot({...});

// Wrapper for compatibility
function migrateFromTwilio(twilioAudio) {
  return bot.processAudioBuffer(twilioAudio);
}
```

### From Google Cloud Speech-to-Text

```javascript
// Old: Google Cloud
const speech = require('@google-cloud/speech');

// New: Realtime Voice System (with Deepgram)
const client = new RealtimeVoiceClient({
  serverUrl: 'ws://localhost:4042'
});

// Same API surface
await client.startListening();
client.on('transcription', handleTranscription);
```

### From Azure Speech Services

```javascript
// Old: Azure SDK
const { CognitiveServicesCredential, SpeechConfig } = require('microsoft-cognitiveservices-speech-sdk');

// New: Realtime Voice System
const bot = new VoiceBot({
  serverUrl: 'ws://localhost:4042'
});

// Drop-in replacement with better features
```

## Scaling the Cloned System

### Single Server (Development)
```
Client ──→ Server (localhost:4042)
```

### Multiple Servers (Production)
```
Clients
  ├─→ Load Balancer (localhost:4042)
  │   ├─→ Server 1
  │   ├─→ Server 2
  │   └─→ Server 3
  │
  └─→ Session Storage (Redis/Database)
      └─→ Conversation History
```

### Microservices (Advanced)
```
API Gateway
  ├─→ Voice Service Cluster
  ├─→ LLM Service Cluster
  ├─→ TTS Service Cluster
  └─→ Conversation Storage (PostgreSQL)
```

## License & Attribution

When cloning this system:

1. **Include attribution** in your project README
2. **Maintain open source** if forked from public repository
3. **Check API provider** licenses for commercial use
4. **Update documentation** with your customizations

---

## Support

Need help cloning? Check:
- QUICKSTART.md - 5-minute setup
- INSTALLATION.md - Detailed setup
- ARCHITECTURE.md - How it works
- templates/ - Working examples

**Ready to clone?** Copy the core directory and follow Quick Clone section above!
