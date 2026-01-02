# 📊 ESTADO ACTUAL: Deepgram Configuration

## Configuración Actual

### STT (Speech-to-Text)
- **Modelo:** `nova-2-phonecall` (optimizado para llamadas)
- **Idioma:** `es` (Español)
- **Endpoint:** WebSocket Streaming API
- **Método:** `createStreamingConnection()` usando Deepgram SDK v3

### TTS (Text-to-Speech)
- **Modelo:** `aura-2-agustina-es` ⭐ (ACTUAL)
- **Idioma:** Español peninsular
- **Endpoint:** REST API (`/v1/speak?model=aura-2-agustina-es&encoding=mp3`)
- **Método:** `_generateDeepgramTTS()` via fetch

### API Key
- **Variable:** `DEEPGRAM_API_KEY`
- **Permisos:** Actualmente solo para STT/TTS básico
- **Necesario:** Crear key con `keys:write` y `project:write` para Management API

## Próximas Mejoras (Management API)

1. **Voice Agent Pipeline:**
   - Configurar Listen/Think/Speak via WebSocket Settings
   - Optimización completa del pipeline

2. **Todas las Voces:**
   - Configurar todas las voces españolas peninsular disponibles
   - Sistema para cambiar voces dinámicamente

3. **Management API:**
   - Gestión programática de proyectos y keys
   - Configuración avanzada via API

## Voces Disponibles (Conocidas)

### Femeninas:
- `aura-2-carina-es` - Profesional, enérgica, segura
- `aura-2-diana-es` - Profesional, confiada, expresiva
- `aura-2-agustina-es` ⭐ (ACTUAL) - Calmada, clara, profesional
- `aura-2-silvia-es` - Carismática, clara, natural

### Masculinas:
- `aura-2-nestor-es` - Calmado, profesional

**Nota:** Necesito obtener lista completa oficial de Deepgram.
