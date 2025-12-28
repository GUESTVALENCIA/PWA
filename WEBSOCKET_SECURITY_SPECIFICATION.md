# 🔐 WEBSOCKET SECURITY SPECIFICATION

**Status**: 🔴 SPECIFICATION PHASE
**Priority**: CRITICAL
**Scope**: WebSocket authentication, authorization, validation

---

## AUTHENTICATION FLOW

### Token Generation

**Endpoint**: `POST /api/sandra/websocket-token`

**Request**:
```json
{
  "clientId": "user-123",
  "sessionId": "session-abc123" // optional
}
```

**Response**:
```json
{
  "token": "hex_string_64_chars",
  "wsUrl": "wss://pwa-imbf.onrender.com/ws/stream?token=...",
  "expiresIn": 300,
  "maxConnections": 1
}
```

**Implementation**:
```javascript
const crypto = require('crypto');

class WebSocketTokenService {
  constructor() {
    this.tokens = new Map(); // token → {clientId, expiresAt, used}
  }

  generateToken(clientId) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 min

    this.tokens.set(token, {
      clientId,
      expiresAt,
      used: false,
      createdAt: Date.now()
    });

    // Auto-cleanup
    setTimeout(() => {
      if (this.tokens.has(token)) {
        this.tokens.delete(token);
      }
    }, 6 * 60 * 1000); // 6 min (buffer)

    return {
      token,
      expiresIn: 300,
      wsUrl: `wss://pwa-imbf.onrender.com/ws/stream?token=${token}`
    };
  }

  validateToken(token) {
    const tokenData = this.tokens.get(token);

    if (!tokenData) {
      return { valid: false, reason: 'Token not found' };
    }

    if (Date.now() > tokenData.expiresAt) {
      this.tokens.delete(token);
      return { valid: false, reason: 'Token expired' };
    }

    if (tokenData.used) {
      return { valid: false, reason: 'Token already used' };
    }

    // Mark as used (one-time token)
    tokenData.used = true;

    return {
      valid: true,
      clientId: tokenData.clientId
    };
  }
}
```

### WebSocket Upgrade Authentication

**Implementation**:
```javascript
const wss = new WebSocket.Server({
  server,
  path: '/ws/stream',
  verifyClient: (info, callback) => {
    try {
      // Extract token from URL
      const url = new URL(info.req.url, 'ws://localhost');
      const token = url.searchParams.get('token');

      if (!token) {
        callback(false, 401, 'Missing token');
        return;
      }

      // Validate token
      const validation = tokenService.validateToken(token);
      if (!validation.valid) {
        callback(false, 401, validation.reason);
        return;
      }

      // Attach clientId to request for later use
      info.req.clientId = validation.clientId;
      callback(true);

    } catch (error) {
      callback(false, 400, 'Invalid request');
    }
  }
});
```

---

## RATE LIMITING

### Per-Client Limiting

```javascript
class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60000; // 1 minute
    this.maxRequests = options.maxRequests || 60;
    this.clients = new Map();
  }

  checkLimit(clientId) {
    const now = Date.now();
    const clientData = this.clients.get(clientId) || {
      requests: [],
      blocked: false,
      blockedUntil: 0
    };

    // Check if currently blocked
    if (clientData.blocked && now < clientData.blockedUntil) {
      return {
        allowed: false,
        reason: 'Rate limit exceeded',
        retryAfter: Math.ceil((clientData.blockedUntil - now) / 1000)
      };
    }

    // Reset if window expired
    if (clientData.requests.length > 0) {
      clientData.requests = clientData.requests.filter(
        t => now - t < this.windowMs
      );
    }

    // Check count
    if (clientData.requests.length >= this.maxRequests) {
      clientData.blocked = true;
      clientData.blockedUntil = now + this.windowMs;

      return {
        allowed: false,
        reason: 'Rate limit exceeded',
        retryAfter: Math.ceil(this.windowMs / 1000)
      };
    }

    // Record request
    clientData.requests.push(now);
    this.clients.set(clientId, clientData);

    return { allowed: true };
  }
}

const limiter = new RateLimiter({
  windowMs: 60000,    // 1 minute window
  maxRequests: 60     // Max 60 requests/minute
});
```

### Global Rate Limiting

```javascript
const globalLimiter = {
  perIP: new Map(),      // IP → request count
  perProvider: new Map() // Provider → API call count
};

function checkGlobalLimit(clientIP, provider) {
  const now = Date.now();

  // Per-IP limit: 100 connections
  const ipData = globalLimiter.perIP.get(clientIP) || { count: 0, resetAt: now + 60000 };
  if (now > ipData.resetAt) {
    ipData.count = 0;
    ipData.resetAt = now + 60000;
  }

  if (ipData.count >= 100) {
    return { allowed: false, reason: 'Too many connections from this IP' };
  }

  ipData.count++;
  globalLimiter.perIP.set(clientIP, ipData);

  return { allowed: true };
}
```

---

## INPUT VALIDATION

### Audio Input Validation

```javascript
function validateAudioBuffer(buffer) {
  // Size check
  if (buffer.length === 0) {
    return { valid: false, reason: 'Empty buffer' };
  }

  if (buffer.length > 1024 * 1024) { // 1MB max
    return { valid: false, reason: 'Buffer too large' };
  }

  // Format check (basic)
  if (buffer.length % 2 !== 0) {
    return { valid: false, reason: 'Invalid PCM format (odd length)' };
  }

  // Content check (not complete silence)
  const int16Array = new Int16Array(buffer.buffer, buffer.byteOffset, buffer.length / 2);
  const nonZeroSamples = Array.from(int16Array).filter(s => Math.abs(s) > 100).length;

  if (nonZeroSamples === 0) {
    return { valid: false, reason: 'Empty audio (all silence)' };
  }

  return { valid: true };
}
```

### Text Input Validation

```javascript
function validateTranscript(text) {
  // Null/undefined check
  if (!text || typeof text !== 'string') {
    return { valid: false, reason: 'Invalid text type' };
  }

  // Trim and check length
  text = text.trim();

  if (text.length === 0) {
    return { valid: false, reason: 'Empty text' };
  }

  if (text.length > 500) {
    return { valid: false, reason: 'Text too long (>500 chars)' };
  }

  // Encoding check (UTF-8)
  try {
    const encoded = Buffer.from(text, 'utf8');
    const decoded = encoded.toString('utf8');
    if (decoded !== text) {
      return { valid: false, reason: 'Invalid UTF-8 encoding' };
    }
  } catch (err) {
    return { valid: false, reason: 'Encoding error' };
  }

  // Sanitization (remove harmful characters)
  const sanitized = text
    .replace(/[<>]/g, '')           // Remove HTML brackets
    .replace(/javascript:/gi, '')   // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '');    // Remove event handlers

  // Language validation (only Spanish/English characters allowed)
  const allowedPattern = /^[\w\s\.,\?¿!¡\-áéíóúñÁÉÍÓÚÑ']+$/;
  if (!allowedPattern.test(sanitized)) {
    return { valid: false, reason: 'Invalid characters in text' };
  }

  return { valid: true, text: sanitized };
}
```

### Configuration Message Validation

```javascript
function validateConfigMessage(msg) {
  const validTypes = ['setLanguage', 'setProvider', 'reset'];
  if (!validTypes.includes(msg.type)) {
    return { valid: false, reason: 'Invalid message type' };
  }

  const validLanguages = ['es', 'en', 'fr', 'de', 'pt'];
  const validProviders = ['gemini', 'claude', 'openai'];
  const validVoices = ['sandra-es', 'sandra-en', 'default'];

  switch (msg.type) {
    case 'setLanguage':
      if (!validLanguages.includes(msg.language)) {
        return { valid: false, reason: 'Invalid language' };
      }
      break;

    case 'setProvider':
      if (!validProviders.includes(msg.provider)) {
        return { valid: false, reason: 'Invalid provider' };
      }
      break;

    case 'reset':
      // No parameters needed
      break;
  }

  return { valid: true };
}
```

---

## CORS & ORIGIN VALIDATION

```javascript
const ALLOWED_ORIGINS = [
  'https://pwa-chi-six.vercel.app',
  'http://localhost:3000',
  'http://localhost:4042'
];

function validateOrigin(req) {
  const origin = req.headers.origin || req.headers.referer;

  if (!origin) {
    return { valid: true }; // No origin header is OK for WebSocket
  }

  const isAllowed = ALLOWED_ORIGINS.some(allowed =>
    origin.includes(allowed)
  );

  return {
    valid: isAllowed,
    reason: isAllowed ? null : 'Origin not allowed'
  };
}

// Use in verifyClient
verifyClient: (info, callback) => {
  const originCheck = validateOrigin(info.req);
  if (!originCheck.valid) {
    callback(false, 403, originCheck.reason);
    return;
  }

  // Continue with token validation...
}
```

---

## ERROR RESPONSES

### Standard Error Format

```json
{
  "type": "error",
  "code": "ERROR_CODE",
  "message": "Human-readable message",
  "timestamp": 1234567890,
  "source": "stt|llm|tts|validation",
  "fallback": "action_to_take"
}
```

### Error Codes

| Code | Meaning | Recovery |
|------|---------|----------|
| `AUTH_INVALID_TOKEN` | Token not found/expired | Request new token |
| `AUTH_RATE_LIMIT` | Rate limit exceeded | Wait and retry |
| `VALIDATION_INVALID_AUDIO` | Audio format invalid | Resend valid audio |
| `VALIDATION_INVALID_TEXT` | Text contains harmful chars | Sanitized text provided |
| `STT_TIMEOUT` | Deepgram didn't respond | Use text input |
| `LLM_TIMEOUT` | LLM took too long | Fallback response |
| `TTS_UNAVAILABLE` | TTS service down | Use browser speech |
| `INTERNAL_ERROR` | Unexpected server error | Retry in 30s |

### No Sensitive Information in Errors

✅ **Good**:
```json
{ "type": "error", "message": "Service temporarily unavailable" }
```

❌ **Bad**:
```json
{
  "type": "error",
  "message": "Deepgram API error: Invalid key format",
  "apiKey": "dg_xxxx..."  // NEVER expose keys!
}
```

---

## SECURITY HEADERS

```javascript
app.use((req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // XSS protection
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;"
  );

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // HSTS (HTTPS only)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  next();
});
```

---

## LOGGING & AUDITING

### Security Event Logging

```javascript
class SecurityAuditLog {
  constructor() {
    this.events = [];
  }

  logAuthEvent(event) {
    this.events.push({
      timestamp: new Date().toISOString(),
      type: 'AUTH',
      clientId: event.clientId,
      ip: event.ip,
      action: event.action, // 'TOKEN_GENERATED', 'TOKEN_VALIDATED', 'AUTH_FAILED'
      reason: event.reason,
      result: event.result
    });
  }

  logSecurityEvent(event) {
    this.events.push({
      timestamp: new Date().toISOString(),
      type: 'SECURITY',
      clientId: event.clientId,
      ip: event.ip,
      event: event.event, // 'RATE_LIMIT_EXCEEDED', 'VALIDATION_FAILED', 'XSS_ATTEMPT'
      details: event.details
    });

    // Alert if critical
    if (event.critical) {
      sendSecurityAlert(event);
    }
  }

  getRecentEvents(hours = 24) {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    return this.events.filter(e => new Date(e.timestamp) > new Date(cutoff));
  }
}

const auditLog = new SecurityAuditLog();

// Usage
auditLog.logAuthEvent({
  clientId: 'user-123',
  ip: '192.168.1.1',
  action: 'TOKEN_VALIDATED',
  result: 'success'
});

auditLog.logSecurityEvent({
  clientId: 'attacker-ip',
  ip: '10.0.0.1',
  event: 'RATE_LIMIT_EXCEEDED',
  details: '150 requests in 1 minute',
  critical: true
});
```

---

## INCIDENT RESPONSE

### Immediate Actions

**If Rate Limiting Triggered**:
```javascript
if (violatesRateLimit) {
  // Block temporarily
  blockIP(clientIP, 60 * 1000); // 1 minute ban

  // Log incident
  auditLog.logSecurityEvent({
    ip: clientIP,
    event: 'RATE_LIMIT_EXCEEDED',
    critical: false
  });

  // Notify (if repeated)
  if (recentViolations > 5) {
    sendSecurityAlert({
      ip: clientIP,
      violations: recentViolations,
      action: 'Consider DDoS protection'
    });
  }
}
```

**If Invalid Token Detected**:
```javascript
if (!token || !validateToken(token)) {
  // Reject connection
  ws.close(1008, 'Unauthorized');

  // Log attempt
  auditLog.logAuthEvent({
    action: 'AUTH_FAILED',
    reason: 'Invalid token',
    ip: getClientIP(req),
    critical: false
  });

  // Check for suspicious patterns
  if (isRepeatedAttack(clientIP)) {
    blockIP(clientIP, 24 * 60 * 60 * 1000); // 24 hour ban
  }
}
```

**If XSS/SQL Injection Detected**:
```javascript
if (containsMaliciousPayload(userInput)) {
  // Block immediately
  ws.close(1008, 'Invalid input');

  // Log critical incident
  auditLog.logSecurityEvent({
    event: 'XSS_OR_INJECTION_ATTEMPT',
    payload: userInput.substring(0, 100), // First 100 chars only
    ip: getClientIP(req),
    critical: true
  });

  // Notify security team
  sendSecurityAlert({
    severity: 'HIGH',
    type: 'XSS_ATTEMPT',
    ip: getClientIP(req),
    action: 'IP added to blocklist'
  });

  // Block IP permanently
  addToBlocklist(getClientIP(req));
}
```

---

## COMPLIANCE & STANDARDS

### OWASP Top 10 Mitigation

| Category | Mitigation |
|----------|-----------|
| **A01: Injection** | Input validation + sanitization |
| **A02: Broken Auth** | Token-based auth + rate limiting |
| **A03: Sensitive Data Exposure** | WSS (HTTPS) + no logging of sensitive data |
| **A04: XML External Entities** | Not applicable (JSON only) |
| **A05: Broken Access Control** | Token validation + per-client isolation |
| **A06: Security Misconfiguration** | Security headers + CSP |
| **A07: XSS** | Sanitization + CSP |
| **A08: Insecure Deserialization** | No deserialization of user data |
| **A09: Using Components with Known Vulnerabilities** | Regular npm audit |
| **A10: Insufficient Logging & Monitoring** | Comprehensive audit logs |

### Compliance Checklist

- [ ] GDPR compliance (data retention policy)
- [ ] CCPA compliance (user rights)
- [ ] PCI DSS (if handling payments)
- [ ] SOC 2 compliance (security standards)
- [ ] ISO 27001 (information security)

---

**This specification is LOCKED.**
**No modifications without security review.**

---

*Last Updated: 2025-12-28*
