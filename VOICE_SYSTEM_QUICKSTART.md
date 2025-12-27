# Voice System Quick Start Guide

## What's Been Set Up

Your GuestsValencia PWA now has a complete **native voice library system** that:

✅ Plays native audio files (no API calls at runtime)
✅ Intelligently selects voices based on response context
✅ Supports multiple voice providers (Cartesia, native, etc.)
✅ Has automatic fallback chains for reliability
✅ Fully integrated with OpenAI WebRTC system

## Current System Status

**Voice Files Ready:**
- `/assets/audio/sandra-voice.mp3` - Your default voice (working)
- `/assets/audio/welcome.mp3` - Welcome greeting (ready)

**System Ready For:**
- Cartesia voice integration
- Multiple language support
- Custom voice selection by response type

## Quick Start: Add Cartesia Voices

### Step 1: Generate Cartesia Voice Files

Open browser console (F12) and run:

```javascript
// Initialize the generator with your Cartesia API key
const generator = new CartesiaVoiceGenerator('YOUR_CARTESIA_API_KEY');

// Generate common Sandra responses
const templates = generator.getCommonResponseTemplates();
const voices = await generator.generateMultipleVoices(templates);

// Print instructions
generator.printInstructions();
```

### Step 2: Download Generated Files

The generator will download MP3 files to your Downloads folder:
- `cartesia-welcome.mp3`
- `cartesia-professional.mp3`
- `cartesia-luxury.mp3`
- `cartesia-checkin.mp3`
- And more...

### Step 3: Upload to Server

Move files to `/assets/audio/` using FTP or file manager

### Step 4: Update Voice Configuration

Get the library update configuration:

```javascript
const update = generator.generateLibraryUpdate(voices);
console.log(JSON.stringify(update, null, 2));
```

Copy the output and update `/assets/config/voice-library.json`:

```json
{
  "voiceLibrary": {
    "cartesia-professional": {...},
    "cartesia-friendly": {...},
    "cartesia-luxury": {...}
  },
  "responseTypeMapping": {
    "hospitality": "cartesia-professional",
    "general": "cartesia-friendly",
    "luxury": "cartesia-luxury"
  }
}
```

### Step 5: Test It Works

1. Reload the page (hard refresh: Ctrl+Shift+R)
2. Open browser console (F12)
3. Look for log: `[VOICE-LIBRARY] ✅ Voice library initialized`
4. Make a call and listen for the professional Cartesia voice!

## File Structure

```
/assets/
├── audio/
│   ├── sandra-voice.mp3            ← Your default voice (exists)
│   ├── welcome.mp3                 ← Welcome greeting (exists)
│   ├── cartesia-professional.mp3   ← ADD: Formal/hospitality voice
│   ├── cartesia-friendly.mp3       ← ADD: Casual/general voice
│   └── cartesia-luxury.mp3         ← ADD: Premium/VIP voice
│
├── config/
│   └── voice-library.json          ← Voice configuration (created)
│
└── js/
    ├── voice-library-manager.js    ← Voice player (created)
    └── cartesia-voice-generator.js ← Helper tool (created)
```

## Integration Points

### In `/index.html`

The `playFallback()` function now:
1. Detects response type (welcome, luxury, support, error, general)
2. Selects appropriate voice from library
3. Plays native audio file
4. Falls back to default if voice unavailable

### Response Type Detection

Automatic detection based on response text:

| Response Contains | Type | Voice |
|---|---|---|
| "bienvenid" | welcome | welcome.mp3 |
| "lujo", "premium" | luxury | cartesia-luxury.mp3 |
| "error", "problema" | error | cartesia-professional.mp3 |
| "ayuda", "soporte" | support | cartesia-friendly.mp3 |
| (default) | general | cartesia-friendly.mp3 |

## API Reference

### Play Voice

```javascript
// Automatic detection
await window.voiceLibraryManager.playVoice('general', 'Hola!');

// Specific type
await window.voiceLibraryManager.playVoice('luxury', 'Welcome to our premium suite');
```

### Get Available Voices

```javascript
const voices = window.voiceLibraryManager.getAvailableVoices();
voices.forEach(v => console.log(v.name));
```

### Change Voice Mapping

```javascript
// Use luxury voice for support responses
window.voiceLibraryManager.setVoiceForType('support', 'cartesia-luxury');
```

### Stop Playback

```javascript
window.voiceLibraryManager.stop();
```

## Troubleshooting

### Voice Library Not Loading

**Check Console:** Look for `[VOICE-LIBRARY]` messages

```javascript
// Debug
console.log(window.voiceLibraryManager.initialized);
console.log(window.voiceLibraryManager.getConfig());
```

### Wrong Voice Playing

**Solution:** Check response type detection in `playFallback()`

```javascript
// Add to /index.html if response type not detected
let responseType = 'general';
if (text.toLowerCase().includes('keyword')) responseType = 'custom-type';
```

### Audio File Not Found

**Solution:**
1. Verify file exists in `/assets/audio/`
2. Check filename in `voice-library.json`
3. Clear browser cache (Ctrl+Shift+R)

## Performance

- Voice files cached by browser (instant playback after first load)
- No API calls required after files are cached
- Supports offline playback (via Service Worker)
- Typical file size: 200KB - 400KB per voice

## What's Next

### Short Term (Already Set Up)
✅ Native voice library system
✅ Voice Library Manager
✅ Cartesia voice generator tool
✅ Voice configuration system

### Immediate Action Items
1. Generate Cartesia voice files
2. Upload to `/assets/audio/`
3. Update `voice-library.json`
4. Test in production

### Future Enhancements
- Auto-generate voices for new responses
- Voice cloning with custom speaker
- Multi-language support
- Voice emotions/styles

## Files Created/Modified

**Created:**
- `/assets/config/voice-library.json` - Voice configuration
- `/assets/js/voice-library-manager.js` - Voice management system
- `/assets/js/cartesia-voice-generator.js` - Cartesia integration helper
- `NATIVE_VOICE_INTEGRATION.md` - Detailed documentation
- `VOICE_SYSTEM_QUICKSTART.md` - This file

**Modified:**
- `/index.html` - Added voice library integration and playFallback updates

## Commands for Advanced Usage

### Test Playback from Console

```javascript
// Test welcome voice
await window.voiceLibraryManager.playVoice('general', 'Prueba');

// Get all voices
window.voiceLibraryManager.getAvailableVoices();

// Check config
window.voiceLibraryManager.getConfig();

// Stop playback
window.voiceLibraryManager.stop();
```

### Generate Custom Voice

```javascript
const generator = new CartesiaVoiceGenerator('API_KEY');

const blob = await generator.generateVoice(
  'Tu texto personalizado aquí',
  'professional-hospitality',
  'custom-voice.mp3'
);

generator.downloadBlob(blob, 'custom-voice.mp3');
```

## Support

For detailed information, see:
- **Implementation Guide:** `NATIVE_VOICE_INTEGRATION.md`
- **Voice Manager Source:** `/assets/js/voice-library-manager.js`
- **Generator Tool:** `/assets/js/cartesia-voice-generator.js`
- **Configuration:** `/assets/config/voice-library.json`

---

**System Status:** ✅ Ready for Production
**Next Step:** Generate Cartesia voices
**Estimated Time:** 15-30 minutes
