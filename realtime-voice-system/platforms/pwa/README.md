# PWA Realtime Voice System

Progressive Web App version of the Realtime Voice System - works seamlessly on **Desktop**, **iOS** (via Safari), and **Android** (via Chrome/Edge).

## Overview

The PWA version uses the same universal backend as all other platforms, with a responsive web interface that works both in the browser and as an installed home screen app.

### Platform Support

| Platform | Method | Installation |
|----------|--------|--------------|
| **Desktop** | Any modern browser (Chrome, Firefox, Safari, Edge) | Install prompt or manual "Install app" button |
| **iOS** | Safari only | Share menu → "Add to Home Screen" |
| **Android** | Chrome/Edge | Install prompt or "Add to Home Screen" |
| **Tablet** | Any modern browser | Responsive layout optimized for larger screens |

## Installation

### From Source (Development)

```bash
# 1. Clone the unified system
git clone https://github.com/yourusername/realtime-voice-system.git
cd realtime-voice-system

# 2. Navigate to PWA platform
cd platforms/pwa

# 3. Install dependencies
npm install

# 4. Start development server
npm run dev

# 5. Open http://localhost:5173 (or shown URL)
```

### Served Deployment

```bash
# 1. Build for production
npm run build

# 2. Serve the dist folder with any HTTP server
npx http-server dist -c-1 -o
```

## Mobile Installation

### iOS (Safari)

1. Open Safari on your iPhone/iPad
2. Navigate to your PWA URL
3. Tap the **Share** button (arrow icon)
4. Select **"Add to Home Screen"**
5. Customize the name if desired
6. Tap **"Add"**
7. The app now appears on your home screen and works offline!

### Android (Chrome/Edge)

1. Open Chrome or Edge on your Android device
2. Navigate to your PWA URL
3. Tap the **menu** (three dots) in the top right
4. Select **"Install app"** or **"Add to Home Screen"**
5. Follow the prompt to install
6. The app is now on your home screen

## Usage

### Starting a Call

1. **Tap "Iniciar Llamada"** (Start Call) button
2. Grant **microphone permission** when prompted
3. Wait for confirmation ("✅ Micrófono activo")
4. **Speak naturally** - the app listens and transcribes

### During a Call

- **Status indicator** shows real-time connection state
- **Conversation panel** displays your transcriptions and AI responses
- **Audio visualizer** shows microphone input levels
- **Latency display** shows real-time response time (target <300ms)

### Settings

Customize during a call or between calls:

- **Idioma** (Language): Spanish, English, French, German, Portuguese
- **Modelo IA** (LLM): Gemini, Claude, GPT-4
- **Voz** (TTS): ElevenLabs, Cartesia, or MiVoz

Settings are automatically saved to your device's local storage.

### Ending a Call

- **Tap "Finalizar"** (End Call) button
- Microphone stops listening
- Call conversation saved in local history

### Reset Conversation

- **Tap "Reiniciar"** (Reset) button
- Clears conversation history
- Starts fresh conversation

## Features

### Progressive Web App (PWA)

✅ **Installable** - Add to home screen on any device
✅ **Offline support** - Service Worker caches app assets
✅ **Fast** - Cached assets load instantly
✅ **Responsive** - Optimized for mobile, tablet, desktop
✅ **Touch-friendly** - Large buttons, intuitive gestures
✅ **Secure** - HTTPS only, token-based auth
✅ **Battery efficient** - Optimized for mobile devices

### Realtime Communication

✅ **Low latency** - WebSocket bidirectional streaming
✅ **Streaming pipeline** - STT → LLM → TTS in parallel
✅ **Auto-reconnect** - Handles network interruptions
✅ **Offline message queue** - Messages sent when reconnected

### Audio Processing

✅ **Automatic STT** - Speech-to-text transcription
✅ **Real-time display** - Transcriptions appear as you speak
✅ **Audio visualizer** - Visual feedback of microphone input
✅ **Microphone permission** - Handled automatically via WebAudio API

## Architecture

### File Structure

```
platforms/pwa/
├── src/
│   ├── index.html              # PWA entry point with manifest
│   ├── manifest.json           # PWA configuration
│   ├── service-worker.js       # Offline support & caching
│   ├── css/
│   │   └── styles.css          # Responsive styling (mobile-first)
│   ├── js/
│   │   └── app.js              # Main app controller
│   └── public/
│       ├── icon-*.png          # App icons (72-512px)
│       ├── screenshot-*.png    # Store screenshots
│       └── favicon.ico         # Browser favicon
├── dist/                       # Production build (generated)
├── package.json               # Dependencies & build scripts
└── vite.config.js            # Build configuration (optional)
```

### Technology Stack

- **Frontend**: Vanilla JavaScript (zero framework overhead)
- **Styling**: CSS Grid + Flexbox (fully responsive)
- **Audio**: WebAudio API for capture & playback
- **Networking**: WebSocket (real-time) + HTTP (REST)
- **Offline**: Service Worker + Cache API
- **State**: LocalStorage for preferences
- **Build**: Vite (optional, for optimization)

## Configuration

### Server Connection

The app automatically detects the server URL based on environment:

- **Local development**: `ws://localhost:8080`
- **Production**: Uses same host as app (`wss://` if HTTPS)

Edit `src/js/app.js` → `getServerURL()` function to customize.

### API Keys

Ensure the backend server has these environment variables set:

```env
# Core APIs
DEEPGRAM_API_KEY=xxx          # Speech-to-text
GEMINI_API_KEY=xxx            # LLM option
ANTHROPIC_API_KEY=xxx         # LLM option
OPENAI_API_KEY=xxx            # LLM option

# Voice options
MIVOZ_API_KEY=xxx             # Native Spanish TTS
CARTESIA_API_KEY=xxx          # Fast TTS option
ELEVENLABS_API_KEY=xxx        # Premium TTS option
```

See [../../core/server/.env.example](../../core/server/.env.example) for full configuration.

## Performance

### Mobile Optimization

- **CSS**: Mobile-first responsive design
- **JavaScript**: Minified bundle (< 50KB)
- **Icons**: Optimized PNG format
- **Caching**: Service Worker handles offline
- **Battery**: Efficient WebAudio processing

### Target Metrics

| Metric | Target | Current |
|--------|--------|---------|
| First Contentful Paint (FCP) | < 1.5s | - |
| Largest Contentful Paint (LCP) | < 2.5s | - |
| Time to Interactive (TTI) | < 3.5s | - |
| Cumulative Layout Shift (CLS) | < 0.1 | - |
| Latency (voice response) | < 300ms | - |

### Measuring Performance

```bash
# Run Lighthouse audit
npm run lighthouse

# Analyze bundle size
npm run analyze
```

## Troubleshooting

### Microphone Permission Denied

**iOS**: Settings > Safari > Microphone > [Your Domain] > Allow
**Android**: Open Chrome Settings > Site permissions > Microphone > [Your Domain] > Allow

### Connection Issues

1. Check your internet connection
2. Ensure server is running (`npm run start` in `core/server/`)
3. Verify correct server URL in browser console
4. Check API keys are set on backend

### Service Worker Stuck

```javascript
// In browser console:
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => reg.unregister());
});
location.reload();
```

### App Not Installing

- Ensure HTTPS (except localhost)
- Check manifest.json is valid
- Ensure app is served from root path `/`
- Try different browser/device

## Development

### Add New Feature

1. Edit `src/js/app.js` for logic
2. Update `src/index.html` for UI
3. Modify `src/css/styles.css` for styling
4. Test on mobile: `npm run dev` → open on mobile device via IP

### Testing on Real Device

```bash
# 1. Get your computer's local IP
# macOS/Linux: ifconfig | grep inet
# Windows: ipconfig | findstr IPv4

# 2. Run dev server
npm run dev

# 3. On mobile, visit: http://<YOUR_IP>:5173

# 4. Add to home screen to test PWA features
```

### Build for Production

```bash
# 1. Build optimized bundle
npm run build

# 2. Preview production build
npm run preview

# 3. Deploy dist/ folder to web server
```

## Deployment

### Option 1: Static Hosting (Recommended)

Deploy to **Netlify**, **Vercel**, **GitHub Pages**, or similar:

```bash
# Build
npm run build

# Upload dist/ folder
# (Service automatically detects dist/manifest.json)
```

### Option 2: Docker

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm install && npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Option 3: Node.js Server

```bash
# Serve with Node.js
npx http-server dist -c-1 -p 3000
```

## Security

✅ **Content Security Policy** - Prevents XSS attacks
✅ **HTTPS only** - Secure WebSocket connections (wss://)
✅ **Token auth** - 5-minute TTL tokens with one-time use
✅ **Rate limiting** - 60 requests per minute per client
✅ **CORS protection** - Restricted to configured origins
✅ **No sensitive data** - API keys never stored client-side

## Browser Support

| Browser | Desktop | iOS | Android |
|---------|---------|-----|---------|
| Chrome | ✅ Yes | - | ✅ Yes |
| Firefox | ✅ Yes | - | ✅ Yes |
| Safari | ✅ Yes | ✅ Yes | - |
| Edge | ✅ Yes | - | ✅ Yes |
| Opera | ✅ Yes | - | ✅ Yes |

Minimum versions: ES2020 support required.

## Known Limitations

- iOS: Cannot record audio in browser (use home screen app instead)
- Android: Some devices may have audio permission quirks
- Offline: Call history not synced between devices
- Tablet: Optimized but not as fully featured as mobile

## API Reference

See [../../API.md](../../API.md) for complete client library API documentation.

## Support & Troubleshooting

For issues and feature requests, see:

- **Main README**: [../../README.md](../../README.md)
- **Architecture Guide**: [../../ARCHITECTURE.md](../../ARCHITECTURE.md)
- **API Documentation**: [../../API.md](../../API.md)
- **Issues**: [GitHub Issues](https://github.com/yourusername/realtime-voice-system/issues)

## License

MIT - See [../../LICENSE](../../LICENSE) for details.

## Authors

**GuestsValencia** - Enterprise Realtime Communication Systems

---

**Built with** ❤️ **for mobile-first conversational AI**

Last updated: 2025-01-01
Version: 1.0.0
