# RECUPERACION COMPLETA - GuestsValencia PWA
## Documento de Sincronizacion y Persistencia para Modelos de IA

> **Fecha de creacion:** 17 de Diciembre 2025
> **Proposito:** Recuperacion del trabajo realizado y guia para nuevos modelos de IA
> **Estado:** OFICIAL - NO MODIFICAR SIN AUTORIZACION

---

## REGLAS DE PERSISTENCIA CRITICAS

### PROHIBICIONES ABSOLUTAS
1. **NO CAMBIAR** los colores corporativos (blanco y azul #2563EB)
2. **NO MODIFICAR** el diseno aprobado del hero section
3. **NO ALTERAR** la imagen de Sandra sin autorizacion explicita
4. **NO CAMBIAR** textos aprobados sin permiso
5. **NO APLICAR** temas oscuros (galaxy dark) al sitio principal
6. **NO ROMPER** el layout de la interfaz de videollamada (9:16 aspect ratio)
7. **NO ELIMINAR** funcionalidades existentes al agregar nuevas

### PRINCIPIOS INMUTABLES
- El sitio usa colores **BLANCOS y AZULES** - NO oscuros
- La imagen de Sandra es el hero central del sitio
- Toda modificacion requiere aprobacion explicita del usuario
- El codigo existente funciona - solo agregar, no reemplazar innecesariamente

---

## CHECKLIST DE IMPLEMENTACIONES COMPLETADAS

### 1. ESTRUCTURA BASE PWA
- [x] HTML5 semantico con lang="es"
- [x] Meta tags PWA (theme-color, manifest, apple-touch-icon)
- [x] Open Graph tags para redes sociales
- [x] Schema.org JSON-LD para SEO
- [x] Fuentes: Outfit (sans) + Playfair Display (serif)
- [x] Tailwind CSS via CDN

### 2. SISTEMA DE DISENO
- [x] Variables CSS root (--primary, --accent, --glass-bg, etc.)
- [x] Glassmorphism: .glass y .glass-dark
- [x] Botones: .btn-primary con gradiente azul
- [x] Cards: .property-card con hover effects
- [x] Animaciones: fade-in, pulse-slow, pulse-glow

### 3. NAVBAR
- [x] Fijo en top con z-index alto
- [x] Glass-dark background (azul con blur)
- [x] Logo: GuestsValencia con "Guests" en azul-400
- [x] Links: Inicio, Alojamientos, Servicios, Propietarios, Quienes Somos, Contacto, App
- [x] Botones: Acceder + Registrarse

### 4. HERO SECTION
- [x] Altura minima 100vh
- [x] Imagen de fondo con transicion a video
- [x] Selector de carga para cambiar hero media
- [x] Buscador con glassmorphism
- [x] Input destino + personas + noches
- [x] Boton "Buscar" (azul) + "Buscar con IA" (gradiente purpura-azul)
- [x] Texto descriptivo con drop-shadow

### 5. SECCIONES DE CONTENIDO
- [x] Nuestros Pilares (3 columnas): Tecnologia, Transparencia, Experiencia
- [x] Estadisticas: +5 anos, +50 propiedades, 98% satisfaccion
- [x] Alojamientos Destacados (grid 3 columnas)
- [x] Sandra IA Section con descripcion y certificacion WhatsApp

### 6. INTERFAZ DE VIDEOLLAMADA SANDRA
- [x] Layout protegido - aspect ratio 9:16, height 580px
- [x] Header con indicador de videollamada 24/7
- [x] Avatar circular con selector de carga
- [x] Ondas de audio animadas (3 circulos con ping)
- [x] Video stream oculto (se muestra en llamada)
- [x] Control bar inferior estilo Gemini:
  - Boton camara
  - Boton microfono (con iconos toggle)
  - Boton llamada (verde, prominente)
- [x] Area de subtitulos

### 7. SANDRA WIDGET (Flotante)
- [x] Clase SandraGateway para comunicacion API
- [x] Clase SandraWidget completa con:
  - Toggle chat window con animacion
  - Envio de mensajes via gateway
  - Indicador de typing
  - Botones de llamada conversacional
  - Sistema de ringtone
  - Transicion hero imagen a video
  - WebSocket para llamada real-time
  - Captura de microfono con echo cancellation
  - Reproduccion de audio con fix de 3s delay en revoke

### 8. WORKFLOW DE LLAMADA
- [x] Click en "Buscar con IA" o boton llamada
- [x] Ringtone de 3 segundos
- [x] Transicion suave imagen -> video
- [x] Conexion WebSocket a servidor
- [x] Captura de audio del usuario
- [x] Envio de chunks cada 250ms
- [x] Recepcion y reproduccion de respuestas

---

## ARQUITECTURA DEL SISTEMA

```
GuestsValencia PWA
├── index.html (Frontend principal)
├── mcp-server/ (Servidor MCP Enterprise)
│   └── src/
│       ├── index.ts (Entry point)
│       ├── services/
│       │   ├── geminiService.ts (Gemini Live API)
│       │   └── cartesiaService.ts (TTS Voice)
│       └── tools/ (Herramientas Sandra)
├── api/ (Endpoints API)
│   ├── api-gateway.js
│   └── sandra/assistant.js
├── assets/
│   ├── images/sandra-avatar.png
│   ├── videos/sandra-call-1.mp4
│   └── audio/welcome.mp3
└── server-websocket.js (WebSocket server)
```

---

## SANDRA IA - PERSONALIDAD Y HERRAMIENTAS

### PROMPT DE PERSONALIDAD OFICIAL

```
Eres Sandra, la recepcionista virtual y COO de GuestsValencia.
Representas a Turismo y Gestion Inmobiliaria Protech.
Tu atencion es de nivel 7 estrellas - premium y personalizada.

UBICACIONES:
- Valencia capital (Ruzafa, Centro, Ciutat Vella)
- Montanejos (turismo rural y termal)
- Altea Hills (Costa Blanca premium)

ROLES:
1. RECEPCIONISTA: Reservas, check-in/out, accesos, dudas
2. CONCIERGE: Transporte, restaurantes, experiencias locales
3. MODO ZEN: Yoga, mindfulness, bienestar para VIPs
4. LOGISTICA: Coordinacion con equipo de limpieza

EQUIPO:
- Susana: Limpieza Valencia
- Paloma: Limpieza Montanejos
- Alejandro: CEO y propietario

TONO:
- Profesional pero calido
- Eficiente y resolutivo
- Nunca improvises inventando datos
- Si no sabes algo, ofrece conectar con Alejandro

IDIOMAS:
- Espanol (principal)
- Ingles (fluido)
- Frances (basico)
```

### HERRAMIENTAS (TOOLS) DE SANDRA

```typescript
// 1. Cambiar estado visual del avatar
setVisualState: {
  state: 'idle' | 'listening' | 'searching' | 'speaking'
  description: 'Cambia la animacion del avatar segun el contexto'
}

// 2. Control de accesos
manageAccessControl: {
  action: 'open_portal' | 'generate_code' | 'revoke_code'
  propertyId: string
  duration?: number // minutos para codigo temporal
  description: 'Gestiona cerraduras inteligentes via Tuya/SmartLife'
}

// 3. Notificar al personal
notifyStaff: {
  recipient: 'susana' | 'paloma' | 'alejandro'
  message: string
  channel: 'whatsapp' | 'sms'
  priority: 'normal' | 'urgent'
  description: 'Envia mensajes al equipo via Twilio/WhatsApp'
}

// 4. Buscar disponibilidad
searchAvailability: {
  location: string
  checkIn: string // YYYY-MM-DD
  checkOut: string
  guests: number
  description: 'Consulta disponibilidad en tiempo real via BridgeData'
}

// 5. Generar video respuesta (Veo 3.1)
generateVideoResponse: {
  prompt: string
  duration: '5s' | '10s'
  style: 'professional' | 'friendly'
  description: 'Genera video de Sandra hablando con Veo 3.1'
}
```

---

## VARIABLES DE ENTORNO REQUERIDAS

```env
# Gemini (IA Principal)
GEMINI_API_KEY=your_gemini_api_key

# Cartesia (Voz de Sandra - OBLIGATORIA)
CARTESIA_API_KEY=your_cartesia_key
CARTESIA_VOICE_ID=your_cloned_voice_id

# Twilio (SMS/WhatsApp)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+34xxxxxxxxx

# Meta WhatsApp Business
META_ACCESS_TOKEN=your_meta_token
META_PHONE_NUMBER_ID=your_phone_number_id

# Base de datos
NEON_DATABASE_URL=postgresql://...
SUPABASE_API_KEY=your_supabase_key
SUPABASE_URL=https://xxx.supabase.co

# LiveKit (Video opcional)
LIVEKIT_API_KEY=your_livekit_key
LIVEKIT_URL=wss://your-livekit-instance

# Tuya Smart (Cerraduras)
TUYA_CLIENT_ID=your_tuya_id
TUYA_CLIENT_SECRET=your_tuya_secret
```

---

## ERRORES CONOCIDOS Y SOLUCIONES

### 1. Pantalla Azul / Cortina
**Problema:** Navbar con bg-[#2563EB] cubre todo el contenido
**Solucion:** Usar glass-dark con backdrop-filter blur, NO colores solidos opacos

### 2. Widget Conflicta con Hero
**Problema:** GalaxyWidget overlay bloquea la transicion de video
**Solucion:** Desactivar widget en modo desktop, usar solo interfaz embebida

### 3. Audio Cortado al Final
**Problema:** URL.revokeObjectURL se ejecuta antes de terminar reproduccion
**Solucion:** Delay de 3 segundos en onended antes de revocar

### 4. Eco en Llamada
**Problema:** El microfono captura el audio de Sandra
**Solucion:** Activar echoCancellation: true en getUserMedia

### 5. Video No Carga
**Problema:** Source vacio o formato incompatible
**Solucion:** Usar MP4 H.264, verificar ruta correcta, llamar load() antes de play()

---

## PROMPT DE EJECUCION PARA NUEVO MODELO

```
# CONTEXTO DEL PROYECTO

Estas trabajando en GuestsValencia PWA - una aplicacion web progresiva para
una empresa de alojamientos turisticos en Valencia, Espana.

## TU ROL

Eres un desarrollador senior que debe mantener y mejorar el proyecto existente.
DEBES respetar el codigo actual y las decisiones de diseno ya tomadas.

## REGLAS INQUEBRANTABLES

1. NUNCA cambies colores sin permiso explicito (azul #2563EB, blanco #FFFFFF)
2. NUNCA modifiques el layout del hero o la interfaz de Sandra
3. NUNCA elimines funcionalidades existentes
4. SIEMPRE pregunta antes de hacer cambios visuales significativos
5. SIEMPRE verifica que el codigo nuevo no rompe el existente
6. SIEMPRE usa las clases CSS existentes (.glass, .glass-dark, .btn-primary)

## ESTADO ACTUAL

- Frontend: index.html completo con Sandra Widget integrado
- Backend: mcp-server con Gemini Live API
- Integraciones: Cartesia (voz), Twilio (WhatsApp), Tuya (accesos)

## PROXIMOS PASOS PENDIENTES

1. Conectar servidor MCP en produccion (Render.com)
2. Integrar voz Cartesia con el flujo de Gemini Live
3. Implementar generacion de video con Veo 3.1
4. Completar las secciones restantes del sitio (Alojamientos, Servicios, etc.)
5. Agregar persistencia de conversaciones en base de datos

## COMO TRABAJAR

1. Lee el archivo index.html antes de proponer cambios
2. Lee RECUPERACION_COMPLETA_GUESTSVALENCIA.md para entender el proyecto
3. Propone cambios especificos y espera aprobacion
4. Implementa de forma incremental, probando cada paso
5. Documenta cualquier cambio significativo

## CONTACTOS

- Alejandro: CEO y propietario del negocio
- Susana: Personal de limpieza Valencia
- Paloma: Personal de limpieza Montanejos
```

---

## CODIGO CRITICO - NO MODIFICAR SIN AUTORIZACION

### Transicion Hero Imagen a Video

```javascript
transitionHeroToVideo() {
  const heroImage = document.getElementById('hero-background-image');
  const heroVideo = document.getElementById('hero-video');

  if (heroImage && heroVideo) {
    heroImage.style.transition = 'opacity 0.8s ease-out';
    heroImage.style.opacity = '0';
    setTimeout(() => {
      heroImage.style.display = 'none';
      heroVideo.style.display = 'block';
      heroVideo.style.opacity = '0';
      heroVideo.style.transition = 'opacity 0.8s ease-in';
      setTimeout(() => {
        heroVideo.style.opacity = '1';
      }, 100);
    }, 800);
  }
}
```

### WebSocket Real-Time Call

```javascript
async startRealTimeCall() {
  const ws = new WebSocket('ws://localhost:4041');
  this.activeCall = ws;

  ws.onopen = async () => {
    ws.send(JSON.stringify({ type: 'ready', message: 'Cliente listo' }));

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });

    this.mediaRecorder = new MediaRecorder(stream);
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result.split(',')[1];
          ws.send(JSON.stringify({ type: 'audio', audio: base64Audio }));
        };
        reader.readAsDataURL(event.data);
      }
    };
    this.mediaRecorder.start(250);
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'audio') {
      this.playAudioResponse(data.audio);
    }
  };
}
```

### Audio Playback con Fix de Delay

```javascript
playAudioResponse(audioBase64) {
  if (this.currentAudio) {
    this.currentAudio.pause();
    if (this.currentAudio._blobUrl) URL.revokeObjectURL(this.currentAudio._blobUrl);
  }

  const byteCharacters = atob(audioBase64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'audio/mp3' });
  const blobUrl = URL.createObjectURL(blob);

  const audio = new Audio(blobUrl);
  audio._blobUrl = blobUrl;
  this.currentAudio = audio;

  audio.onended = () => {
    this.isSpeaking = false;
    // FIX CRITICO: Esperar 3 segundos antes de revocar
    setTimeout(() => {
      if (audio._blobUrl) {
        URL.revokeObjectURL(audio._blobUrl);
        audio._blobUrl = null;
      }
      this.currentAudio = null;
    }, 3000);
  };

  audio.play().catch(e => console.error("Audio play error:", e));
}
```

---

## HISTORIAL DE CAMBIOS APROBADOS

| Fecha | Cambio | Estado |
|-------|--------|--------|
| 2025-12-17 | Diseno Galaxy con glassmorphism | Aprobado |
| 2025-12-17 | Integracion Gemini Live | Aprobado |
| 2025-12-17 | Widget Sandra flotante | Aprobado |
| 2025-12-17 | Interfaz videollamada 9:16 | Aprobado |
| 2025-12-17 | Transicion imagen-video | Aprobado |
| 2025-12-17 | Captura microfono WebSocket | Aprobado |
| 2025-12-17 | Fix audio delay 3s | Aprobado |

---

## NOTAS FINALES

Este documento representa el estado oficial del proyecto GuestsValencia PWA.
Cualquier modelo de IA que trabaje en este proyecto DEBE leer este documento
antes de realizar cualquier modificacion.

**El usuario (Alejandro/GUESTVALENCIA) tiene la ultima palabra en todas las
decisiones de diseno y funcionalidad.**

---

*Documento generado por Claude (Opus 4.5) - Recuperacion de sesion Gemini*
