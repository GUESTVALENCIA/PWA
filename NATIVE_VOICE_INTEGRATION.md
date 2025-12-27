# Native Voice Library Integration Guide

## Overview

This guide explains how to integrate Cartesia-generated voices (or any TTS voices) as native audio files in the GuestsValencia PWA. The system intelligently selects voices based on response context without requiring API calls at runtime.

## System Architecture

### Current Flow

```
OpenAI WebRTC Chat → Response Text
                         ↓
                  Voice Library Manager
                         ↓
              Response Type Detection
                         ↓
          Select Appropriate Native Voice File
                         ↓
              Play Audio via HTML5 <Audio>
```

### Key Components

1. **Voice Library Configuration** (`/assets/config/voice-library.json`)
   - Maps voice providers to audio files
   - Defines response type mappings
   - Stores voice metadata

2. **Voice Library Manager** (`/assets/js/voice-library-manager.js`)
   - Loads and manages voice configuration
   - Handles voice file existence checks
   - Implements fallback chain
   - Manages audio playback with proper error handling

3. **Integration Point** (`/index.html` - playFallback function)
   - Detects response context
   - Selects appropriate voice
   - Plays native audio files

## Adding Cartesia Voices

### Step 1: Generate Voice Files with Cartesia

Generate audio files for your key response types:

```bash
# Example: Generate professional hospitality voice
curl https://api.cartesia.ai/tts/stream \
  -H "X-API-Key: YOUR_CARTESIA_API_KEY" \
  -d '{
    "model_id": "sonic-english",
    "voice": {
      "mode": "id",
      "id": "professional-hospitality"
    },
    "transcript": "Bienvenido a Guests Valencia. Estoy aquí para ayudarte con tu experiencia de alojamiento premium.",
    "duration": 8.0
  }' \
  --output /assets/audio/cartesia-professional.mp3
```

### Step 2: Store Audio Files

Place generated audio files in `/assets/audio/`:

```
/assets/audio/
├── sandra-voice.mp3                 # Default/fallback voice
├── welcome.mp3                      # Existing welcome greeting
├── cartesia-professional.mp3        # NEW: Formal/hospitality responses
├── cartesia-friendly.mp3            # NEW: Casual/general responses
└── cartesia-luxury.mp3              # NEW: VIP/premium responses
```

### Step 3: Update Voice Library Configuration

Edit `/assets/config/voice-library.json`:

```json
{
  "voiceLibrary": {
    "cartesia-professional": {
      "file": "/assets/audio/cartesia-professional.mp3",
      "name": "Sandra Cartesia Professional",
      "language": "es",
      "provider": "cartesia",
      "description": "Professional Cartesia voice for formal hospitality interactions",
      "generated": true,
      "model": "sonic-english",
      "voice_id": "professional-hospitality"
    },
    "cartesia-friendly": {
      "file": "/assets/audio/cartesia-friendly.mp3",
      "name": "Sandra Cartesia Friendly",
      "language": "es",
      "provider": "cartesia",
      "description": "Friendly Cartesia voice for casual interactions",
      "generated": true,
      "model": "sonic-english",
      "voice_id": "friendly-casual"
    },
    "cartesia-luxury": {
      "file": "/assets/audio/cartesia-luxury.mp3",
      "name": "Sandra Cartesia Luxury",
      "language": "es",
      "provider": "cartesia",
      "description": "Luxury/premium Cartesia voice for VIP interactions",
      "generated": true,
      "model": "sonic-english",
      "voice_id": "luxury-premium"
    }
  },
  "responseTypeMapping": {
    "greeting": "welcome",
    "general": "cartesia-friendly",
    "hospitality": "cartesia-professional",
    "luxury": "cartesia-luxury",
    "support": "cartesia-friendly",
    "error": "cartesia-professional",
    "default": "cartesia-friendly"
  }
}
```

## Response Type Detection

The system automatically detects response type from Sandra's text:

| Keywords | Type | Voice |
|----------|------|-------|
| bienvenid, hola, buenos | welcome | welcome.mp3 |
| lujo, premium, vip | luxury | cartesia-luxury.mp3 |
| error, problema, fallo | error | cartesia-professional.mp3 |
| ayuda, soporte, técnico | support | cartesia-friendly.mp3 |
| (all others) | general | cartesia-friendly.mp3 |

### Custom Response Types

Add custom detection in `/index.html` `playFallback()` function:

```javascript
let responseType = 'general';
if (text.toLowerCase().includes('piscina')) responseType = 'luxury';
else if (text.toLowerCase().includes('wifi')) responseType = 'support';
// Add more conditions as needed
```

## Voice Library Manager API

### Methods

#### `playVoice(responseType, responseText)`
Play voice for a given response type.

```javascript
// Automatically detect type and play
await window.voiceLibraryManager.playVoice('general', 'Hola, ¿cómo estás?');

// Play specific voice type
await window.voiceLibraryManager.playVoice('luxury', 'Welcome to our premium suite...');
```

#### `selectVoice(responseType)`
Get voice configuration without playing.

```javascript
const voice = window.voiceLibraryManager.selectVoice('hospitality');
console.log(voice.file); // "/assets/audio/cartesia-professional.mp3"
```

#### `getAvailableVoices()`
Get list of all configured voices.

```javascript
const voices = window.voiceLibraryManager.getAvailableVoices();
voices.forEach(v => console.log(`${v.name}: ${v.file}`));
```

#### `setVoiceForType(responseType, voiceKey)`
Change voice for a response type.

```javascript
// Use luxury voice for all 'support' responses
window.voiceLibraryManager.setVoiceForType('support', 'cartesia-luxury');
```

#### `stop()`
Stop current playback.

```javascript
window.voiceLibraryManager.stop();
```

## Fallback Chain

If a voice file is missing, the system tries the fallback chain:

```json
{
  "fallbackChain": [
    "default",
    "welcome"
  ]
}
```

This ensures that if `cartesia-professional.mp3` doesn't exist, it will try `default`, then `welcome`.

## Configuration Options

### Voice Settings

```json
{
  "voiceSettings": {
    "volume": 1.0,              // 0.0 - 1.0
    "playbackRate": 1.0,        // 0.5 - 2.0
    "fadeInDuration": 200,      // ms (optional)
    "fadeOutDuration": 200,     // ms (optional)
    "maxConcurrentAudio": 1     // Only 1 audio plays at a time
  }
}
```

### Enable/Disable Voices

Mark voices as unavailable without deleting files:

```json
{
  "cartesia-professional": {
    "file": "/assets/audio/cartesia-professional.mp3",
    "enabled": false  // Won't be selected, will use fallback
  }
}
```

## Production Deployment Checklist

- [ ] Generate all Cartesia voice files
- [ ] Place files in `/assets/audio/` directory
- [ ] Update `/assets/config/voice-library.json` with new voices
- [ ] Test voice library loads (check console logs)
- [ ] Verify each response type plays correct voice
- [ ] Test fallback chain (rename a voice file temporarily)
- [ ] Clear browser cache and test in incognito mode
- [ ] Verify all audio files are served with correct CORS headers
- [ ] Test on mobile devices (iOS/Android)

## Testing

### Console Commands

```javascript
// Check if voice manager is loaded
console.log(window.voiceLibraryManager.initialized);

// Get current configuration
console.log(window.voiceLibraryManager.getConfig());

// Test voice playback
await window.voiceLibraryManager.playVoice('luxury', 'Test audio message');

// Get available voices
console.log(window.voiceLibraryManager.getAvailableVoices());
```

### Browser DevTools

1. Open Chrome DevTools (F12)
2. Go to Console tab
3. Run test commands above
4. Check Network tab for audio file requests
5. Check Console for [VOICE-LIBRARY] logs

## Optimization Tips

### File Size
- Use MP3 format (smaller than WAV)
- Compress with bitrate 128kbps for speech
- Target file size: 100KB - 500KB per voice

### Loading
- Voices load on-demand when needed
- First load may have slight delay (file fetch + browser cache)
- Subsequent loads are instant from browser cache

### Cache Strategy
- Browser automatically caches audio files
- Clear cache with Hard Refresh (Ctrl+Shift+R)
- Service Worker caches files for offline use

## Troubleshooting

### Issue: Voice files not playing
**Solution:**
1. Check console for [VOICE-LIBRARY] errors
2. Verify file paths in voice-library.json
3. Check if files exist in `/assets/audio/`
4. Verify CORS headers (if hosted on different domain)

### Issue: Wrong voice playing
**Solution:**
1. Check response type detection keywords in `playFallback()`
2. Verify responseTypeMapping in voice-library.json
3. Update keywords to match Sandra's responses

### Issue: Fallback audio playing instead of Cartesia
**Solution:**
1. Verify Cartesia files generated successfully
2. Check file size (should not be 0 bytes)
3. Test playback in browser directly: `new Audio('/assets/audio/cartesia-professional.mp3').play()`
4. Check for browser autoplay restrictions (may require user interaction)

### Issue: Audio cuts off early
**Solution:**
1. Increase audio file duration
2. Check browser console for errors
3. Verify audio codec compatibility (use MP3)

## Advanced: Pre-Generate Response Library

For best performance, pre-generate Cartesia voices for common Sandra responses:

**Common Responses to Generate:**
- Welcome greeting
- Check-in instructions
- WiFi/facilities information
- Emergency contacts
- Checkout reminder
- Thank you message

```bash
#!/bin/bash
# generate-voices.sh - Generate Cartesia voices for common responses

CARTESIA_API_KEY="YOUR_KEY_HERE"
RESPONSES=(
  "Bienvenido a Guests Valencia|welcome"
  "Instrucciones de check-in|hospitality"
  "La WiFi es...|support"
  "En caso de emergencia|error"
  "Gracias por tu estancia|general"
)

for response in "${RESPONSES[@]}"; do
  IFS='|' read -r text type <<< "$response"
  curl https://api.cartesia.ai/tts/stream \
    -H "X-API-Key: $CARTESIA_API_KEY" \
    -d "{\"model_id\": \"sonic-english\", \"transcript\": \"$text\"}" \
    --output "/assets/audio/cartesia-${type}.mp3"
  echo "Generated cartesia-${type}.mp3"
done
```

## Integration with Existing Systems

### With OpenAI WebRTC
✅ Fully compatible - plays native audio after OpenAI response

### With WebSocket Gateway
⚠️ Can be used for both systems - configure response type detection per system

### With Sandra Widget
✅ Integrated - voice plays through widget chat interface

## Support & Documentation

- **Voice Library Manager**: `/assets/js/voice-library-manager.js`
- **Configuration**: `/assets/config/voice-library.json`
- **Integration Point**: `/index.html` (search for `playFallback`)
- **Generated Files**: `/assets/audio/cartesia-*.mp3`

## License & Attribution

- Native voice files: Your creation
- Cartesia voices: Generated via Cartesia API (requires license)
- Voice Library Manager: GuestsValencia (MIT)
