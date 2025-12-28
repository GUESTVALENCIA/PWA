# Tablet-Optimized - Realtime Voice System

Tablet-optimized version of the Realtime Voice System for iPad and Android tablets with extended features for larger screens.

## Status

⚠️ **Architecture defined, implementation pending** - This directory is prepared for tablet implementation.

## Overview

The Tablet platform extends the PWA version with optimizations for larger screens (7"+ devices):

- **Dual-panel layout** - Conversation + settings side-by-side
- **Landscape support** - Optimized for landscape orientation
- **Larger touch targets** - Adapted for tablet usage patterns
- **Split-screen multitasking** - Works in split view with other apps
- **DeX support** (Android) - Desktop mode support
- **Stage Manager** (iPad OS 16+) - Multi-window support

### Supported Devices

- **iPad** - All models (7th gen and newer recommended)
- **iPad Pro** - All sizes (10.9", 11", 12.9")
- **iPad Air** - All models
- **iPad Mini** - All models
- **Android Tablets** - 7" and larger, Android 11+

## Architecture

### Tech Stack

- **Codebase**: Same as PWA (vanilla JavaScript, CSS, HTML)
- **Responsive Design**: CSS media queries for tablet breakpoints
- **Layout**: Multi-column, dual-panel design
- **Styling**: CSS Grid for complex layouts
- **Same Backend**: Universal RealtimeVoiceClient

### File Structure

```
platforms/tablet/
├── src/
│   ├── index.html              # Tablet-optimized layout
│   ├── manifest.json           # PWA config for tablets
│   ├── service-worker.js       # Offline support
│   ├── css/
│   │   ├── styles.css          # Base styles
│   │   ├── tablet.css          # Tablet-specific (7"-10")
│   │   └── large-tablet.css    # Large tablet (11"+)
│   ├── js/
│   │   ├── app.js              # Main controller
│   │   └── tablet-gestures.ts  # Tablet-specific gestures
│   └── public/
│       ├── icon-*.png          # Icons optimized for tablets
│       ├── screenshot-*.png    # Tablet screenshots
│       └── widgets/            # iPad widgets
├── dist/                       # Production build
├── package.json
├── vite.config.js             # Build configuration
└── README.md
```

## Responsive Breakpoints

```css
/* Small tablets (7-8 inch) */
@media (min-width: 600px) and (max-width: 768px) {
  /* Single column, larger buttons */
}

/* Medium tablets (9-10 inch) */
@media (min-width: 769px) and (max-width: 1024px) {
  /* Dual column: conversation + settings side-by-side */
}

/* Large tablets (11-13 inch) */
@media (min-width: 1025px) {
  /* Triple column or enhanced dual column */
  /* Additional panels for metadata, history, etc. */
}

/* Landscape orientation */
@media (orientation: landscape) {
  /* Optimize for wider viewport */
}
```

## Features (Planned)

### Layout Enhancements

✅ **Dual-panel layout** (medium/large tablets)
- Conversation on left (70%)
- Settings/history on right (30%)
- Draggable divider to adjust

✅ **Landscape optimization**
- Auto-switch to wider layout
- Optimized for landscape typing
- Media controls positioned accordingly

✅ **Multi-column design** (large tablets)
- Left: Conversation
- Center: Current call info
- Right: Settings + history

### Gesture Support

✅ **Touch gestures**
- Swipe to dismiss modals
- Pinch-to-zoom for text
- Long-press for context menu
- Double-tap to expand

✅ **Keyboard + trackpad**
- Full keyboard navigation
- Trackpad support (iPad)
- Keyboard shortcuts
- Text selection and editing

### Platform-Specific Features

#### iPad (iOS 16+)

- Stage Manager support (multi-window)
- iPad Slide Over and Split View
- Custom keyboard shortcuts
- Handoff to other Apple devices
- AirDrop integration

#### Android Tablets (DeX)

- Samsung DeX support
- Multi-window multitasking
- Bluetooth keyboard/mouse support
- External display support

## Setup (When Ready)

### Development

```bash
cd platforms/tablet
npm install
npm run dev
```

### Testing

```bash
# Run on iPad simulator
npx ios-deploy -b dist/

# Run on Android tablet emulator
adb install dist/app.apk

# Test responsive layout
npm run lighthouse -- --form-factor=tablet
```

### Building

```bash
npm run build
# Deploy dist/ folder
```

## Implementation Plan

### Phase 1: Layout Adaptation
- [ ] Dual-panel CSS layout
- [ ] Responsive breakpoints (7", 10", 12")
- [ ] Landscape orientation support
- [ ] Touch-friendly spacing

### Phase 2: Enhanced UI
- [ ] Larger buttons and targets
- [ ] Keyboard navigation
- [ ] Right-click context menus
- [ ] Gesture support

### Phase 3: Features
- [ ] Call history sidebar
- [ ] Meeting notes panel
- [ ] Advanced analytics
- [ ] Quick settings access

### Phase 4: Optimization
- [ ] Performance for large screens
- [ ] Memory optimization
- [ ] Battery efficiency
- [ ] Network handling

### Phase 5: Platform Features
- [ ] iPad widgets (iOS 17+)
- [ ] DeX optimization (Android)
- [ ] Multi-window support
- [ ] External keyboard support

## Key Differences from PWA

| Feature | PWA | Tablet |
|---------|-----|--------|
| Layout | Single column (mobile-first) | Multi-column |
| Sidebar | Bottom settings panel | Sticky right panel |
| Conversation | Full width | Left-aligned container |
| Settings | Overlay/drawer | Always visible |
| Keyboard | On-screen | Hardware keyboard support |
| Gestures | Swipes only | Pinch, long-press, drag |
| History | Popup | Persistent sidebar |
| Landscape | Responsive | Fully optimized |

## Screen Layouts

### Small Tablets (7-8")
```
┌─────────────────────┐
│ Header              │
├─────────────────────┤
│                     │
│  Conversation       │
│  (full width)       │
│                     │
├─────────────────────┤
│ Settings (overlay)  │
└─────────────────────┘
```

### Medium Tablets (9-10")
```
┌────────────────────────────────┐
│ Header                         │
├──────────────────┬─────────────┤
│                  │             │
│ Conversation     │ Settings    │
│ (70%)            │ History     │
│                  │ (30%)       │
│                  │             │
└──────────────────┴─────────────┘
```

### Large Tablets (11-13")
```
┌──────────────────────────────────────────┐
│ Header                                   │
├──────────────────┬──────────────┬────────┤
│                  │              │        │
│ Conversation     │ Call Info    │Manage- │
│ (50%)            │ (35%)        │ment    │
│                  │              │(15%)   │
│                  │              │        │
└──────────────────┴──────────────┴────────┘
```

## Deployment

### iPad

```bash
# As Progressive Web App
# 1. Serve from HTTPS
# 2. Users: Share → "Add to Home Screen"

# OR as native app
# 1. Build with native tooling
# 2. Submit to App Store
```

### Android Tablets

```bash
# As Progressive Web App
# 1. Serve from HTTPS
# 2. Users: Menu → "Install app"

# OR as native app
# 1. Build APK
# 2. Submit to Google Play
```

## Performance Targets

| Metric | Target |
|--------|--------|
| Startup time | < 1.5s |
| Interaction latency | < 100ms |
| Voice response latency | < 300ms |
| Touch responsiveness | 60 FPS |
| Memory usage | < 200MB |

## Accessibility

- Full keyboard navigation
- Screen reader support
- High contrast mode
- Text scaling
- Focus indicators
- Touch target sizing (48px+)

## Security

- HTTPS only
- Token-based authentication
- Secure local storage (Keychain/Keystore)
- Rate limiting
- Content Security Policy

## Testing

### Manual Testing Devices

- iPad Pro 12.9" (latest)
- iPad Pro 11" (latest)
- iPad Air (latest)
- iPad Mini (latest)
- Samsung Galaxy Tab S (latest)
- Lenovo Tab (latest)

### Automated Testing

```bash
# Lighthouse audit for tablets
npm run lighthouse -- --form-factor=tablet

# Responsive layout testing
npx responsive-checker src/index.html
```

## Browser Support

| Browser | iPad | Android |
|---------|------|---------|
| Safari | ✅ | - |
| Chrome | - | ✅ |
| Firefox | ✅ | ✅ |
| Edge | ✅ | ✅ |
| Samsung Internet | - | ✅ |

## Related Platforms

- **PWA** (Web + Mobile): [../pwa/README.md](../pwa/README.md)
- **Mobile** (Native): [../mobile/README.md](../mobile/README.md)
- **Core Server**: [../../core/server/](../../core/server/)
- **Client Library**: [../../core/client/](../../core/client/)

## Known Limitations

- iPad: Limited by WebAudio API in Safari
- Android: Some devices have audio permission quirks
- DeX: Limited window management API
- Multi-window: Some features may behave differently

## Contributing

When implementing this platform:

1. Test on actual tablets (not just desktop)
2. Consider landscape and portrait
3. Use touch-friendly sizes (48px minimum)
4. Test with keyboard and trackpad
5. Follow accessibility guidelines

## Resources

- [iPad App Design](https://developer.apple.com/design/tips/ipad-app-design)
- [Responsive Web Design](https://web.dev/responsive-web-design-basics/)
- [Touch Targets](https://www.smashingmagazine.com/2012/02/finger-friendly-design-ideal-mobile-touchscreen-target-sizes/)
- [Samsung DeX](https://www.samsung.com/global/galaxy/what-is-samsung-dex/)

## License

MIT - See [../../LICENSE](../../LICENSE)

---

**Status**: Architecture ready, implementation pending
**Target Launch**: Q2 2025
**Devices**: iPad (7th+), Android 11+ tablets

For updates and implementation progress, see [../../UNIFIED_ARCHITECTURE.md](../../UNIFIED_ARCHITECTURE.md)
