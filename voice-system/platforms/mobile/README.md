# Mobile (React Native) - Realtime Voice System

React Native version for iOS and Android native apps using the universal Realtime Voice System backend.

## Status

⚠️ **Architecture defined, implementation pending** - This directory is prepared for React Native implementation.

## Overview

The Mobile platform uses React Native to provide native iOS and Android apps with:

- **Native performance** - Direct access to device hardware
- **App Store distribution** - Publish to Apple App Store and Google Play
- **Offline capabilities** - Works with intermittent connectivity
- **Hardware integration** - Camera, GPS, notifications
- **Platform-specific features** - iOS widgets, Android shortcuts

### Supported Platforms

- **iOS** 14+ (iPhone, iPad)
- **Android** 11+ (phones, tablets)

## Architecture

### Tech Stack

- **Framework**: React Native (with Expo for easier setup)
- **State Management**: Context API + AsyncStorage
- **Navigation**: React Navigation
- **Audio**: expo-audio + react-native-audio-recorder-player
- **Networking**: WebSocket (same as PWA)
- **Styling**: StyleSheet + react-native-svg

### Directory Structure

```
platforms/mobile/
├── src/
│   ├── screens/
│   │   ├── CallScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   └── HistoryScreen.tsx
│   ├── components/
│   │   ├── AudioVisualizer.tsx
│   │   ├── ConversationPanel.tsx
│   │   ├── CallControls.tsx
│   │   └── StatusIndicator.tsx
│   ├── services/
│   │   ├── audioService.ts
│   │   ├── permissionService.ts
│   │   └── storageService.ts
│   ├── navigation/
│   │   └── RootNavigator.tsx
│   ├── context/
│   │   ├── VoiceContext.tsx
│   │   └── AppStateContext.tsx
│   ├── hooks/
│   │   ├── useAudio.ts
│   │   ├── useVoiceCall.ts
│   │   └── usePreferences.ts
│   ├── utils/
│   │   ├── logger.ts
│   │   ├── errorHandler.ts
│   │   └── helpers.ts
│   ├── types/
│   │   ├── index.ts
│   │   └── api.ts
│   ├── App.tsx
│   └── index.js
├── android/
│   ├── app/
│   ├── gradle/
│   └── build.gradle
├── ios/
│   ├── RealtimeVoice/
│   ├── RealtimeVoice.xcodeproj/
│   └── Podfile
├── metro.config.js
├── tsconfig.json
├── app.json
├── babel.config.js
├── package.json
└── README.md
```

## Setup (When Ready)

### Prerequisites

```bash
# Install Node.js 18+
node --version

# Install Expo CLI
npm install -g expo-cli

# For iOS development:
# - Xcode 14+
# - CocoaPods

# For Android development:
# - Android Studio
# - JDK 11+
```

### Development Setup

```bash
# 1. Navigate to mobile directory
cd platforms/mobile

# 2. Install dependencies
npm install

# 3. Install native dependencies
npx expo prebuild --clean

# 4. Start development server
npm start

# 5. Run on device
# iOS: Press 'i'
# Android: Press 'a'
# Web: Press 'w'
```

### Building for Release

#### iOS

```bash
# Using Expo
npx eas build --platform ios

# Or with Xcode
npm run build:ios
```

#### Android

```bash
# Using Expo
npx eas build --platform android

# Or with Gradle
npm run build:android
```

## Implementation Plan

### Phase 1: Core Setup
- [ ] React Native project initialization
- [ ] Navigation structure
- [ ] Audio service wrapper
- [ ] Permission handling

### Phase 2: UI Components
- [ ] Call screen with buttons
- [ ] Conversation display
- [ ] Audio visualizer (native)
- [ ] Settings interface
- [ ] Status indicators

### Phase 3: Integration
- [ ] RealtimeVoiceClient integration
- [ ] WebSocket audio streaming
- [ ] Real-time transcription display
- [ ] Response streaming

### Phase 4: Polish
- [ ] Error handling & recovery
- [ ] Offline mode support
- [ ] Local storage for history
- [ ] Performance optimization

### Phase 5: Distribution
- [ ] App Store configuration
- [ ] Play Store configuration
- [ ] Testing on real devices
- [ ] Beta testing

## Key Features (Planned)

✅ **Native Performance**
- Direct hardware access
- Optimized for mobile CPU/memory
- Native UI components

✅ **Offline Support**
- Message queue for offline
- Auto-reconnect on connection
- Cached conversation history

✅ **Audio Processing**
- Native audio capture
- Real-time visualization
- Hardware acceleration

✅ **Platform Integration**
- iOS: Siri shortcuts, widgets
- Android: Quick settings tile, shortcuts
- Push notifications
- Background mode

✅ **Distribution**
- App Store (iOS)
- Google Play (Android)
- Over-the-air updates (Expo)

## Deployment

### Development (Expo)

```bash
# Publish to Expo
npx eas update

# Share with team
npx eas build --platform ios --auto-submit
```

### Production

#### iOS App Store

```bash
# Configure App Store Connect
# 1. Create app bundle ID
# 2. Configure signing certificates
# 3. Build and submit

npx eas build --platform ios --auto-submit
```

#### Google Play

```bash
# Configure Google Play Console
# 1. Create app
# 2. Configure signing certificate
# 3. Build and upload

npx eas build --platform android
# Then upload to Google Play Console
```

## Testing

### Unit Tests

```bash
npm test
```

### Integration Tests

```bash
# Device testing
npm start
# On device: manual testing
```

### Device Testing

Supported devices for testing:
- iPhone SE or newer
- iPad (6th generation or newer)
- Android 11+ phones
- Android tablets

## Performance Targets

| Metric | Target |
|--------|--------|
| App startup time | < 2s |
| First call latency | < 500ms |
| Voice response latency | < 300ms |
| Battery consumption | < 15% per hour |
| Memory usage | < 150MB |

## Security

- Secure storage with Keychain (iOS) / Keystore (Android)
- Token-based authentication
- HTTPS/WSS for all communications
- No sensitive data in app cache
- Rate limiting on API calls

## Troubleshooting

### Build Errors

```bash
# Clear cache and rebuild
npm run clean
npm install
npx expo prebuild --clean
npm start
```

### Audio Issues

- Check microphone permissions
- Verify audio session configuration
- Test on physical device (simulator may have issues)

### Network Issues

- Use proxy debugging: `npx expo-debug-proxy`
- Monitor network with Charles/Fiddler
- Test on various network conditions (4G, 3G, WiFi)

## Contributing

When implementing this platform:

1. Follow React Native best practices
2. Use TypeScript for type safety
3. Test on iOS and Android
4. Follow the established patterns from PWA
5. Keep sync with core client library

## Resources

- [React Native Documentation](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [App Store Connect](https://appstoreconnect.apple.com/)
- [Google Play Console](https://play.google.com/console/)

## Related Platforms

- **PWA** (Web + Mobile Web): [../pwa/README.md](../pwa/README.md)
- **Tablet**: [../tablet/README.md](../tablet/README.md)
- **Core Server**: [../../core/server/](../../core/server/)
- **Client Library**: [../../core/client/](../../core/client/)

## License

MIT - See [../../LICENSE](../../LICENSE)

---

**Status**: Architecture ready, implementation pending
**Target Launch**: Q2 2025
**Platforms**: iOS 14+, Android 11+

For updates and implementation progress, see [../../UNIFIED_ARCHITECTURE.md](../../UNIFIED_ARCHITECTURE.md)
