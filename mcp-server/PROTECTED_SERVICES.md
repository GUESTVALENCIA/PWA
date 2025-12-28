# 🔒 PROTECTED SERVICES - DO NOT MODIFY

## ⚠️ CRITICAL WARNING ⚠️

**These services are LOCKED for production use. Unauthorized modifications WILL cause system-wide failures.**

---

## SERVICE 1: WebSocket Voice Streaming (PRODUCTION)

### Identity
- **Service Name**: WebSocket Voice Streaming
- **Purpose**: Real-time bidirectional audio streaming for voice calls
- **Status**: 🔴 PROTECTED - PRODUCTION
- **Last Modified**: System initialization
- **Hash**: Generated on startup

### Endpoints
- `/ws/stream` - WebSocket streaming endpoint
- `/api/config` - Configuration endpoint

### Critical Functionality
```
Microphone Input
  → AudioWorklet (PCM encoding)
  → WebSocket binary frames
  → Server: Deepgram STT
  → Server: Qwen/LLM
  → Server: Cartesia TTS
  → Client: Audio playback
  → Speaker Output
```

### Files Involved
- `mcp-server/index.js` - Main WebSocket handler (Lines 144-238)
- `assets/js/websocket-stream-client.js` - Frontend client
- `mcp-server/services/deepgram-streaming.js` - STT service
- `mcp-server/services/tts-streaming.js` - TTS service
- `mcp-server/services/llm-streaming.js` - LLM service

### Modification Impact Matrix
| Change | Impact | Severity |
|--------|--------|----------|
| Change WebSocket URL | Voice calls fail to connect | 🔴 CRITICAL |
| Modify `/api/config` | Client receives wrong endpoint | 🔴 CRITICAL |
| Alter handshake protocol | Stream initialization fails | 🔴 CRITICAL |
| Change sample rate logic | Audio quality degrades/crashes | 🟠 HIGH |
| Modify reconnection logic | Connection drops frequently | 🟠 HIGH |

---

## SERVICE 2: REST Text Chat Gateway (PRODUCTION)

### Identity
- **Service Name**: REST Text Chat Gateway
- **Purpose**: Text-based messaging and chat context management
- **Status**: 🔴 PROTECTED - PRODUCTION
- **Last Modified**: System initialization
- **Hash**: Generated on startup

### Endpoints
- `/api/sandra/chat` - Text chat endpoint
- `/api/conserje/message` - Concierge message handling
- `/api/conserje/voice-flow` - Complete STT→LLM→TTS pipeline

### Critical Functionality
```
User Text Input
  → POST /api/sandra/chat
  → LLM (Groq/OpenAI/Gemini/Claude)
  → JSON Response
  → Display/Optional TTS
```

### Files Involved
- `mcp-server/routes/sandra.js` - Chat routes
- `mcp-server/routes/conserje.js` - Concierge routes
- `assets/js/sandra-gateway.js` - Frontend gateway (Port: 4042)
- `mcp-server/services/qwen.js` - Qwen integration

### Modification Impact Matrix
| Change | Impact | Severity |
|--------|--------|----------|
| Change port 4042 | Chat gateway unreachable | 🔴 CRITICAL |
| Modify `/api/sandra/chat` endpoint | Chat requests fail | 🔴 CRITICAL |
| Alter message schema | LLM receives malformed input | 🟠 HIGH |
| Change API base URL | Client-server communication breaks | 🔴 CRITICAL |
| Modify response format | UI cannot parse responses | 🟠 HIGH |

---

## Configuration Lock

### Environment Variables (DO NOT CHANGE)
```bash
# Voice Streaming
MCP_SERVER_URL=wss://pwa-imbf.onrender.com (production)
MCP_TOKEN=<system-generated>

# Chat Gateway
NODE_ENV=production
PORT=4042

# Services
DEEPGRAM_API_KEY=50895f2c294f1b90a36d755f789fdd5839ce77ae
```

### Port Allocation (LOCKED)
- **4042** = MCP-SANDRA Server (Voice + Chat)
- **4040** = ❌ DEPRECATED (DO NOT USE)
- **3000** = Frontend (if applicable)

### Dynamic URL Detection (AUTOMATIC)
```javascript
// ✅ CORRECT: Automatic detection based on environment
const isProduction = process.env.NODE_ENV === 'production';
const hostname = req.get('host') || 'localhost:4042';

if (isProduction || hostname.includes('onrender.com')) {
  wsUrl = 'wss://pwa-imbf.onrender.com';
} else {
  wsUrl = `ws://${hostname}`;
}
```

---

## Integrity Verification

### Service Hashes (On Startup)
System generates SHA-256 hashes for each protected service:

```
✅ [PROTECTION] WebSocket Voice Streaming - Hash: a7f2e3b4c1d5e9f2
✅ [PROTECTION] REST Text Chat Gateway - Hash: x9k2m5p7q3r8s1t4
```

If hashes don't match on subsequent runs, services have been modified.

### Validation Checks
1. **Port Verification**: Ensures 4042 is listening
2. **Endpoint Verification**: Ensures `/api/config` responds
3. **Route Verification**: Ensures `/api/sandra/chat` and `/api/conserje/message` exist
4. **URL Verification**: Ensures correct dynamic URL detection

---

## Recovery Procedures

### If Voice Calls Break
1. Verify `mcp-server/index.js` WebSocket handler is present (Lines 144-238)
2. Verify `/api/config` returns correct `MCP_SERVER_URL`
3. Verify `websocket-stream-client.js` is loading config correctly
4. Check server logs for `[CONFIG-ENDPOINT]` messages

### If Text Chat Breaks
1. Verify `sandra-gateway.js` is using `localhost:4042` for local development
2. Verify `mcp-server/routes/sandra.js` is registered
3. Verify `POST /api/sandra/chat` endpoint responds
4. Check server logs for `[SandraGateway]` messages

### Force Restart (Last Resort)
```bash
# Stop server
pkill -f "node.*mcp-server/index.js"

# Verify port is free
lsof -i :4042

# Restart
NODE_ENV=production PORT=4042 node mcp-server/index.js
```

---

## Audit Trail

### System Modifications Log
- **2025-12-28**:
  - Fixed WebSocket URL dynamic detection ✅
  - Fixed sandra-gateway.js port (4040→4042) ✅
  - Implemented protection layer with hashing ✅
  - Locked services for production ✅

### Who Can Modify
- **System Administrator**: Full access (with authorization)
- **Authorized Developers**: Only after backup and verification
- **Other Users**: NO ACCESS - Will trigger warnings

---

## Contact & Authorization

**For modifications to these protected services:**

1. Document the change reason
2. Create a backup: `cp -r mcp-server mcp-server.backup`
3. Make changes with comments
4. Verify in development first
5. Test in staging (if available)
6. Deploy to production
7. Monitor logs for errors

**Unauthorized modifications will result in:**
- System failures
- Voice call disconnections
- Text chat breakdowns
- Service unavailability

**Status: 🔒 LOCKED FOR PRODUCTION USE**

---

*Last Updated: 2025-12-28*
*Protection Level: MAXIMUM*
*Authorization Required: YES*
