# Unified Realtime Voice System Architecture

**Arquitectura Maestra - Sistema Universal de Voz en Tiempo Real**

Integración completa de:
- ✅ Sistema Universal Realtime Voice
- ✅ Pipeline Enterprise de Llamadas Conversacionales
- ✅ Soporte PWA (Web + Móvil Web)
- ✅ Soporte Mobile Native (iOS/Android)
- ✅ Soporte Tablet Optimizado

---

## 🏗️ Estructura Unificada del Proyecto

```
realtime-voice-system/
│
├── 🔧 CORE (Compartido en todas las plataformas)
│   │
│   ├── server/                          # Servidor WebSocket universal
│   │   ├── src/
│   │   │   ├── index.js                 # Servidor principal
│   │   │   ├── config/
│   │   │   │   └── config.js            # Config centralizada
│   │   │   ├── services/
│   │   │   │   ├── stt.service.js       # Deepgram STT
│   │   │   │   ├── llm.service.js       # Claude/Gemini LLM
│   │   │   │   ├── tts.service.js       # ElevenLabs/Cartesia TTS
│   │   │   │   └── pipeline.service.js  # Orquestador
│   │   │   ├── middleware/
│   │   │   │   ├── auth.js
│   │   │   │   ├── rate-limiter.js
│   │   │   │   └── validator.js
│   │   │   └── utils/
│   │   │       ├── logger.js
│   │   │       └── audio.utils.js
│   │   ├── package.json
│   │   ├── .env.example
│   │   └── Dockerfile
│   │
│   └── client/                          # Cliente universal (npm package)
│       ├── src/
│       │   ├── realtime-voice-client.js # Cliente base
│       │   ├── call-client.js           # Cliente con llamadas
│       │   ├── audio-processor.js       # Audio Worklet
│       │   └── index.js                 # Exports
│       └── package.json
│
├── 📱 PLATFORMS (Específico de cada plataforma)
│   │
│   ├── pwa/                             # Progressive Web App
│   │   ├── src/
│   │   │   ├── index.html               # HTML principal
│   │   │   ├── manifest.json            # PWA manifest
│   │   │   ├── service-worker.js        # Offline support
│   │   │   ├── js/
│   │   │   │   ├── ui-controller.js
│   │   │   │   └── app.js
│   │   │   └── css/
│   │   │       └── styles.css
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── mobile/                          # React Native (iOS/Android)
│   │   ├── src/
│   │   │   ├── App.js
│   │   │   ├── screens/
│   │   │   │   ├── CallScreen.js
│   │   │   │   └── SettingsScreen.js
│   │   │   ├── components/
│   │   │   │   ├── AudioVisualizer.js
│   │   │   │   └── CallControls.js
│   │   │   ├── services/
│   │   │   │   ├── AudioCaptureRN.js
│   │   │   │   └── AudioPlaybackRN.js
│   │   │   └── utils/
│   │   │       └── permissions.js
│   │   ├── android/
│   │   │   └── app/src/main/AndroidManifest.xml
│   │   ├── ios/
│   │   │   └── Info.plist
│   │   ├── package.json
│   │   └── app.json
│   │
│   └── tablet/                          # Tablet optimizado
│       ├── src/
│       │   ├── index.html
│       │   ├── js/
│       │   │   ├── tablet-controller.js
│       │   │   └── layout.js
│       │   └── css/
│       │       └── tablet-styles.css
│       └── package.json
│
├── 📚 DOCS
│   ├── UNIFIED_ARCHITECTURE.md          # Este archivo
│   ├── PWA_SETUP.md
│   ├── MOBILE_SETUP.md
│   └── TABLET_SETUP.md
│
├── 🐳 DEPLOYMENT
│   ├── docker-compose.yml
│   ├── deploy.sh
│   └── test-system.sh
│
└── 📦 EXAMPLES
    ├── basic-pwa/
    ├── basic-mobile/
    └── basic-tablet/
```

---

## 🔌 Core Server (Universal)

El servidor NO CAMBIA. Funciona igual para todas las plataformas.

### API Endpoints
```
HTTP Endpoints:
├── GET  /health                  # Health check
├── GET  /api/config              # Configuración
├── POST /api/token               # Generar token
├── GET  /api/status              # Estado de servicios
└── GET  /api/metrics             # Métricas en vivo

WebSocket:
└── WS   /ws/stream?token=...     # Streaming bidireccional
```

### Message Protocol (Igual en todas las plataformas)

**Client → Server:**
```javascript
// Audio (binary)
ws.send(audioBuffer);

// Control (JSON)
ws.send(JSON.stringify({
  type: 'setLanguage',  // 'setLanguage' | 'setProvider' | 'reset' | 'ping'
  language: 'es'
}));
```

**Server → Client:**
```javascript
// Connected
{ type: 'connected', clientId: '...', timestamp: 123 }

// Transcription
{ type: 'text', content: 'Lo que el usuario dijo' }

// AI Response
{ type: 'text', content: 'Respuesta de la IA' }

// Audio (binary)
ws.send(audioBuffer);

// Metrics
{ type: 'metrics', latency: 450, text: 'Respuesta completa' }

// Errors
{ type: 'error', message: 'Descripción del error' }
```

---

## 🌐 Platform: PWA (Web + Móvil Web)

### Características
- Funciona en navegadores modernos
- Instalable como app desde iOS Safari
- Instalable como app desde Android Chrome
- Offline support con Service Worker
- Sin cambios en el servidor

### Estructura PWA

```
pwa/
├── src/
│   ├── index.html                    # UI principal
│   ├── manifest.json                 # PWA manifest
│   ├── service-worker.js             # Offline
│   ├── js/
│   │   ├── app.js                    # Inicialización
│   │   ├── ui-controller.js          # Controlador UI
│   │   └── call-manager.js           # Gestión de llamadas
│   └── css/
│       ├── styles.css                # Estilos web
│       └── mobile-responsive.css     # Mobile optimizado
│
├── package.json
└── public/
    └── icons/                        # Iconos PWA
        ├── icon-192.png
        └── icon-512.png
```

### Instalación PWA

**iOS (Safari):**
```
1. Abre la PWA en Safari
2. Tap "Compartir" > "Agregar a pantalla de inicio"
3. Nombre: "Llamadas" (personalizable)
4. Tap "Agregar"
```

**Android (Chrome):**
```
1. Abre la PWA en Chrome
2. Tap menú ⋮ > "Instalar aplicación"
3. O espera a que aparezca el banner automático
4. Tap "Instalar"
```

### Características PWA
- Funciona offline (caché de assets)
- Push notifications (limitadas en iOS)
- Acceso al micrófono sin instalación
- Updates instantáneos

---

## 📱 Platform: Mobile Native (React Native)

### Características
- Aplicaciones nativas iOS/Android
- Mejor performance que PWA
- Push notifications nativas
- Acceso profundo a hardware
- Llamadas en segundo plano (Android)

### Estructura React Native

```
mobile/
├── src/
│   ├── App.js                        # App root
│   ├── screens/
│   │   ├── CallScreen.js             # Pantalla de llamada
│   │   ├── SettingsScreen.js         # Configuración
│   │   └── LoginScreen.js            # Autenticación
│   ├── components/
│   │   ├── CallButton.js
│   │   ├── AudioVisualizer.js
│   │   └── TranscriptionDisplay.js
│   ├── services/
│   │   ├── AudioCaptureRN.js         # Audio con react-native-audio
│   │   ├── AudioPlaybackRN.js        # Reproducción con react-native-sound
│   │   └── WebSocketManager.js
│   └── utils/
│       ├── permissions.js            # Manejo de permisos
│       └── storage.js                # AsyncStorage
│
├── android/
│   └── app/src/main/AndroidManifest.xml
├── ios/
│   └── Info.plist
│
├── app.json                          # Configuración React Native
├── package.json
└── README.md
```

### Stack React Native Recomendado

```json
{
  "dependencies": {
    "react-native": "^0.73.0",
    "react-navigation": "^6.1.0",
    "react-native-audio": "^4.3.0",
    "react-native-sound": "^0.11.0",
    "@react-native-community/hooks": "^3.0.0",
    "websocket": "^1.0.34"
  }
}
```

### Instalación

```bash
# Crear proyecto
npx react-native init RealtimeVoiceApp

# Copiar código
cp -r realtime-voice-system/core/client/src ./src/services/
cp -r realtime-voice-system/platforms/mobile/src/* ./src/

# Instalar dependencias
npm install

# iOS
cd ios && pod install && cd ..
npm run ios

# Android
npm run android
```

---

## 📱 Platform: Tablet Optimized

### Características
- Layout optimizado para pantallas grandes
- Gestos táctiles mejorados
- Dos paneles (conversación + controls)
- Aprovecha pantalla grande

### Estructura Tablet

```
tablet/
├── src/
│   ├── index.html                    # Layout tablet
│   ├── js/
│   │   ├── app.js
│   │   ├── tablet-layout.js          # Layout dual
│   │   └── gesture-handler.js        # Gestos mejorados
│   └── css/
│       ├── styles.css
│       └── tablet-layout.css         # Grid 2 columnas
│
└── package.json
```

---

## 🔄 Flujo de Datos (Mismo en todas las plataformas)

```
┌─────────────────────────────────────────────────────────┐
│  PLATAFORMA (PWA, Mobile, Tablet)                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │ UI Layer (HTML/React/React Native)              │   │
│  │ ├─ Botones, entrada de usuario                  │   │
│  │ └─ Visualización de transcripciones             │   │
│  └────────────┬────────────────────────────────────┘   │
│               │                                         │
│  ┌────────────▼────────────────────────────────────┐   │
│  │ Client Layer (realtime-voice-client.js)         │   │
│  │ ├─ Captura de audio                             │   │
│  │ ├─ WebSocket connection                         │   │
│  │ ├─ Reproducción de audio                        │   │
│  │ └─ Event emitter                                │   │
│  └────────────┬────────────────────────────────────┘   │
│               │                                         │
│               │ WebSocket Binary/JSON                  │
│               ▼                                         │
└─────────────────────────────────────────────────────────┘
                    ↕️ ws://server:4042
┌─────────────────────────────────────────────────────────┐
│  SERVER (Igual para todas las plataformas)              │
│  ┌─────────────────────────────────────────────────┐   │
│  │ WebSocket Handler                               │   │
│  │ ├─ Token validation                             │   │
│  │ ├─ Message routing                              │   │
│  │ └─ Client state management                      │   │
│  └────────────┬────────────────────────────────────┘   │
│               │                                         │
│  ┌────────────▼────────────────────────────────────┐   │
│  │ Pipeline Service (Orquestador)                  │   │
│  │ ├─ Transcripción buffering                      │   │
│  │ ├─ Sentence ending detection                    │   │
│  │ └─ Streaming coordination                       │   │
│  └────────────┬────────────────────────────────────┘   │
│               │                                         │
│  ┌────────┬───┴───┬──────────────┐                     │
│  ▼        ▼       ▼              ▼                     │
│ STT     LLM     TTS           Metrics                   │
│ Deepgram Claude ElevenLabs   Logging                    │
│          Gemini  Cartesia                               │
│          OpenAI  ElevenLabs                             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Deployment

### Opción 1: Docker (Recomendado)

```bash
# Build y levanta todo
docker-compose up --build

# Acceso
- Servidor WebSocket: ws://localhost:8080
- PWA Web: http://localhost:80
- Health: http://localhost:8080/health
```

### Opción 2: Desarrollo Local

```bash
# Terminal 1 - Servidor
cd server
npm install && npm run dev

# Terminal 2 - PWA
cd platforms/pwa
npm install && npm run dev

# Terminal 3 - Mobile
cd platforms/mobile
npm install
npm run android  # o npm run ios
```

### Opción 3: Producción en la Nube

```bash
# AWS/GCP/Azure
docker-compose -f docker-compose.prod.yml up

# Verifica
curl https://tudominio.com/health
```

---

## 🔐 Configuration

Todas las plataformas usan el **MISMO servidor**, la diferencia está en:

1. **Cliente (UI/UX):** Diferente por plataforma
2. **Audio Capture:** Diferente por plataforma (WebAudio vs React Native)
3. **Configuración:** **IDÉNTICA** en .env

```bash
# .env (Igual para todas)
DEEPGRAM_API_KEY=...
ANTHROPIC_API_KEY=...
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=...
LLM_PROVIDER=claude
TTS_PROVIDER=elevenlabs
PORT=8080
```

---

## 📊 Performance Comparación

| Métrica | PWA | Mobile | Tablet |
|---------|-----|--------|--------|
| Latencia STT-LLM-TTS | 400-800ms | 350-700ms | 400-800ms |
| Tamaño app | - | ~150MB | - |
| Instalación | Fácil (1-tap) | App Store | Fácil (1-tap) |
| Offline support | Parcial | No | Parcial |
| Background calls | Limitado | Sí (Android) | Limitado |
| Push notifications | Limitadas | Nativas | Limitadas |

---

## 🎯 Use Cases por Plataforma

### PWA
- ✅ Alquileres turísticos (clientes desde navegador)
- ✅ Soporte al cliente (acceso rápido sin app store)
- ✅ Demostración rápida
- ✅ Multi-plataforma con un código

### Mobile Native
- ✅ App oficial en App Store/Play Store
- ✅ Llamadas en segundo plano
- ✅ Integración con contactos
- ✅ Mejor performance en dispositivos antiguos

### Tablet
- ✅ Salas de espera (centros médicos)
- ✅ Recepción en hoteles
- ✅ Salas de atención
- ✅ Aprovechar pantalla grande

---

## 🔄 Next Steps

1. **Hoy:** Completar estructura PWA (ya lista)
2. **Mañana:** Implementar versión React Native
3. **Próxima semana:** Tablet optimizado
4. **Después:** Docker + deployment guide

---

## 📋 Checklist de Desarrollo

### Core Server
- [x] WebSocket server
- [x] STT/LLM/TTS services
- [x] Pipeline orchestration
- [x] Health checks
- [ ] Authentication JWT
- [ ] Rate limiting advanced
- [ ] Metrics dashboard

### PWA
- [x] HTML UI
- [x] JavaScript client
- [ ] Service Worker
- [ ] Manifest.json
- [ ] Icons
- [ ] Offline support
- [ ] Push notifications

### Mobile
- [ ] React Native project setup
- [ ] Audio capture (react-native-audio)
- [ ] Audio playback (react-native-sound)
- [ ] UI screens
- [ ] Navigation
- [ ] Permissions handling
- [ ] Build iOS/Android

### Tablet
- [ ] Layout dual-panel
- [ ] Responsive CSS
- [ ] Touch optimizations
- [ ] Gesture handlers

### Deployment
- [ ] Docker Compose
- [ ] Nginx config
- [ ] SSL/TLS setup
- [ ] CI/CD pipeline
- [ ] Load balancer
- [ ] Database backup
- [ ] Monitoring setup

---

## 🎓 Learning Path

1. **Entiende la arquitectura** (este documento)
2. **Prueba el servidor** (`npm run dev` en server/)
3. **Prueba PWA** (abrir HTML en navegador)
4. **Instala PWA en móvil** (Safari → Share → Add to Home)
5. **Clona para React Native** (setup proyecto)
6. **Deploy con Docker** (producción)

---

## 🤝 Integration Points

### Con GuestsValencia Widget

```javascript
// En tu widget, importa:
import { RealtimeVoiceClient } from './realtime-voice-system/core/client';

// Crea instancia:
const voiceClient = new RealtimeVoiceClient({
  serverUrl: 'wss://api.tudominio.com:8080',
  language: 'es'
});

// Usa como quieras:
await voiceClient.connect();
voiceClient.on('text', (text) => {
  // Actualiza tu widget
});
```

---

## 📞 Support

Todas las plataformas usan el **MISMO servidor**, así que:
- El desarrollo es **paralelo**, no secuencial
- Los cambios en el servidor benefician a **todas**
- El cliente es **modular** y reutilizable

---

**Status:** 🔴 En construcción
- Core Server: ✅ Completo
- PWA: 🟡 En progreso
- Mobile: 🔴 Pendiente
- Tablet: 🔴 Pendiente
- Docker: 🔴 Pendiente

Ahora empezamos a construir cada plataforma... 🚀

