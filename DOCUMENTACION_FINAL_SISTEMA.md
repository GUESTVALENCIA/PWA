# 📚 Documentación Final del Sistema - Sandra Omni-Brain Proptech OS

## 🎯 Visión General

Sistema completo de orquestación de IA conversacional con herramientas avanzadas para gestión de propiedades, reservas, comunicación y marketing.

---

## 🏗️ ARQUITECTURA

### Componentes Principales:

1. **MCP Orchestrator** (`server.js`)
   - Servidor principal Express
   - WebSocket para comunicación en tiempo real
   - Orquestación de todos los servicios

2. **Tool Handler** (`src/websocket/tool-handler.js`)
   - Gestión de 9 tools principales
   - Ejecución de acciones basadas en comandos de voz
   - Integración con servicios externos

3. **Voice Services** (`src/services/voice-services.js`)
   - Integración con OpenAI GPT-4o-mini
   - Function Calling para detección automática de tools
   - Generación de respuestas conversacionales

4. **Socket Server** (`src/websocket/socket-server.js`)
   - Manejo de conexiones WebSocket
   - Streaming de audio (STT/TTS)
   - Gestión de sesiones

---

## 🛠️ TOOLS DISPONIBLES

### 1. UI Control (2 tools)

#### `ui_action`
- **Descripción**: Controla elementos de la interfaz
- **Acciones**: SCROLL, CLICK, TOGGLE_MODAL, HIGHLIGHT
- **Requiere Cliente**: ✅ Sí

#### `navigate_ui`
- **Descripción**: Navega a secciones principales
- **Secciones**: properties, about, contact, booking
- **Requiere Cliente**: ✅ Sí

---

### 2. Geolocalización (1 tool)

#### `get_current_location`
- **Descripción**: Obtiene coordenadas GPS del usuario
- **Uso**: Recomendaciones cercanas
- **Requiere Cliente**: ❌ No

---

### 3. Pagos (1 tool)

#### `initiate_secure_voice_payment`
- **Descripción**: Inicia terminal de pago PayPal
- **Integración**: PayPal API
- **Requiere Cliente**: ✅ Sí

---

### 4. Comunicación (2 tools)

#### `whatsapp_omni_response`
- **Descripción**: Envía mensajes WhatsApp
- **Modalidades**: text_chat, voice_call, conversational_msg
- **Integración**: TwilioService
- **Requiere Cliente**: ❌ No

#### `trigger_push_notification`
- **Descripción**: Muestra notificaciones push
- **Tipos**: booking, update, alert, message, payment
- **Requiere Cliente**: ✅ Sí

---

### 5. Marketing (1 tool)

#### `orchestrate_marketing_campaign`
- **Descripción**: Activa campañas en redes sociales
- **Plataformas**: instagram, tiktok, meta
- **Requiere Cliente**: ❌ No

---

### 6. Precios y Disponibilidad (1 tool)

#### `get_live_pricing_bridge`
- **Descripción**: Consulta precios en tiempo real
- **Integración**: BridgeDataService + PriceCalendarService
- **Características**: Comparación con OTAs, descuentos
- **Requiere Cliente**: ❌ No

---

### 7. Reservas (1 tool)

#### `booking_engine_integration`
- **Descripción**: Crea reservas de alojamiento
- **Validación**: Disponibilidad, precio
- **Almacenamiento**: Neon DB
- **Requiere Cliente**: ❌ No

---

## 🔌 SERVICIOS INTEGRADOS

### NeonService
- **Base de datos**: PostgreSQL (Neon)
- **Tablas**: call_logs, sessions, conversation_history, users, properties, negotiation_logs
- **Funciones**: Persistencia de conversaciones, reservas, negociaciones

### BridgeDataService
- **API**: BridgeData
- **Uso**: Disponibilidad de propiedades (Cabañal, Montanejos)
- **Caché**: Neon DB

### PriceCalendarService
- **Funcionalidad**: Calendario anual de precios
- **Características**: Descuentos OTA, fechas festivas, temporada alta
- **Integración**: Neon DB

### TwilioService
- **API**: Twilio
- **Funcionalidades**: WhatsApp, llamadas de voz
- **Configuración**: Variables de entorno

### SandraOrchestrator
- **Origen**: IA-SANDRA repository
- **Servicios**: NegotiationService, ContextOrchestrator, NeonAdapter
- **Modo**: Online (con DB) / Offline (fallback)

---

## 🔄 FLUJO DE CONVERSACIÓN

```
1. Usuario inicia llamada
   ↓
2. WebSocket conecta → STT (Deepgram) activo
   ↓
3. Usuario habla → Audio → STT → Transcripción
   ↓
4. Transcripción → OpenAI GPT-4o-mini
   ↓
5. AI analiza → Detecta necesidad de tool
   ↓
6. ToolHandler.executeTool() → Handler específico
   ↓
7. Handler ejecuta acción → Resultado
   ↓
8. Resultado → AI genera respuesta
   ↓
9. Respuesta → TTS → Audio → Usuario
```

---

## 📊 VERIFICACIÓN DEL SISTEMA

### ToolVerifier
- **Ubicación**: `src/utils/tool-verifier.js`
- **Funciones**:
  - `verifyAllTools()` - Verifica todas las tools
  - `verifyServices()` - Verifica servicios
  - `verifyComplete()` - Verificación completa

### Ejecución Automática:
- Se ejecuta al iniciar el servidor
- Logs detallados de estado
- Identifica problemas automáticamente

---

## 🔐 CONFIGURACIÓN

### Variables de Entorno Requeridas:

```env
# OpenAI
OPENAI_API_KEY=sk-proj-...

# Deepgram
DEEPGRAM_API_KEY=...

# Neon DB
NEON_DATABASE_URL=postgresql://...

# Twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_NUMBER=+34...

# Render
API_KEY_RENDER=rnd_...
```

---

## 📈 MÉTRICAS Y MONITOREO

### Logs Disponibles:
- `[TOOL HANDLER]` - Ejecución de tools
- `[TOOL VERIFIER]` - Verificación del sistema
- `[VOICE-SERVICES]` - Procesamiento de IA
- `[TWILIO SERVICE]` - Comunicación WhatsApp
- `[NEON SERVICE]` - Operaciones DB

### Niveles de Log:
- `INFO` - Operaciones normales
- `WARN` - Advertencias
- `ERROR` - Errores críticos
- `DEBUG` - Información detallada

---

## 🚀 DEPLOYMENT

### Render:
- **URL**: https://pwa-imbf.onrender.com
- **Puerto**: 3001
- **Build Command**: `git submodule update --init --recursive && npm install`
- **Start Command**: `node server.js`

### Variables de Entorno:
- Configurar todas las variables en Render Dashboard
- Reiniciar servicio después de cambios

---

## ✅ CHECKLIST DE PRODUCCIÓN

### Pre-Deployment:
- ✅ Todas las tools implementadas
- ✅ Todos los servicios configurados
- ✅ Variables de entorno configuradas
- ✅ Verificación del sistema OK
- ✅ Logs funcionando

### Post-Deployment:
- ✅ Servidor iniciado correctamente
- ✅ WebSocket conectando
- ✅ Tools verificadas
- ✅ Servicios disponibles
- ✅ Base de datos conectada

---

## 📝 NOTAS IMPORTANTES

1. **Function Calling**: OpenAI detecta automáticamente cuándo usar tools
2. **Fallbacks**: Sistema tiene fallbacks para servicios no disponibles
3. **Validación**: Todos los handlers validan parámetros
4. **Logging**: Sistema completo de logging para debugging
5. **Seguridad**: Validación de tokens y autenticación

---

## 🎉 CONCLUSIÓN

Sistema completo y funcional con:
- ✅ 9 tools implementadas
- ✅ 5 servicios integrados
- ✅ Verificación automática
- ✅ Documentación completa
- ✅ Listo para producción

---

**Sistema Sandra Omni-Brain Proptech OS v14.8 - COMPLETO** ✅
