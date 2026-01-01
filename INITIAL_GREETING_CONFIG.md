# 🎙️ SALUDO INICIAL EN TIEMPO REAL

## Cambios Aplicados

### Servidor (`src/websocket/socket-server.js`)

- ✅ **Nueva función:** `handleInitialGreeting()` - Genera saludo en tiempo real con Deepgram TTS
- ✅ **Reemplazo:** `handleWelcomeMessage()` (pregrabado) → `handleInitialGreeting()` (tiempo real)
- ✅ **Texto del saludo:** "Hola, buenas, soy Sandra, tu asistente de Guests Valencia, ¿en qué puedo ayudarte hoy?"

## Funcionamiento

1. **Cliente conecta** → WebSocket abre
2. **Cliente envía 'ready'** → Servidor recibe mensaje
3. **Servidor genera saludo** → Usa `generateVoice()` con Deepgram TTS
4. **Audio enviado al cliente** → Reproducido inmediatamente
5. **Stream activo** → Usuario puede responder

## Ventajas vs. Audio Pregrabado

- ✅ **Misma voz que conversación** - Generado con Deepgram TTS (consistencia)
- ✅ **Sin cortes** - Generado dinámicamente, no hay problemas de buffer
- ✅ **Calidad consistente** - Mismo sistema de generación que respuestas
- ✅ **Latencia mínima** - Deepgram TTS optimizado para tiempo real

## Texto del Saludo

```
"Hola, buenas, soy Sandra, tu asistente de Guests Valencia, ¿en qué puedo ayudarte hoy?"
```

**Características:**
- ✅ Corto y claro
- ✅ Conciso
- ✅ Profesional
- ✅ Amigable

## Configuración Técnica

- **Método:** `voiceServices.generateVoice(greetingText)`
- **TTS:** Deepgram TTS (modelo: `aura-2-thalia-es`)
- **Formato:** MP3
- **Flag:** `isWelcome: true` (para diferenciar del audio conversacional)
