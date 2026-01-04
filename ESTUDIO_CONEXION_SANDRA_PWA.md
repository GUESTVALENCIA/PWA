# 🔗 ESTUDIO DE CONEXIÓN - SANDRA IA + PWA + MCP SERVER

## 📊 ANÁLISIS DE ARQUITECTURA ACTUAL

### Componentes Existentes:

1. **PWA Frontend** (`index.html`)
   - Widget de llamadas conversacionales
   - Sistema WebSocket para comunicación en tiempo real
   - Integración con Deepgram STT/TTS

2. **Backend Server** (`server.js`)
   - Servidor Express
   - WebSocket Server (puerto 3001)
   - MCP Orchestrator
   - Sandra Orchestrator (IA-SANDRA)

3. **Socket Server** (`src/websocket/socket-server.js`)
   - Manejo de conexiones WebSocket
   - Integración con Deepgram Voice Agent
   - Procesamiento de audio STT/TTS
   - Gestión de sesiones

4. **Servicios Existentes:**
   - `VoiceServices` - Procesamiento de IA y TTS
   - `NeonService` - Base de datos persistente
   - `IPGeolocationService` - Geolocalización por IP
   - `BridgeDataService` - Disponibilidad de propiedades
   - `PriceCalendarService` - Calendario de precios

---

## 🎯 OBJETIVO: INTEGRACIÓN COMPLETA

Conectar todas las funcionalidades de Sandra Omni-Brain Proptech OS v14.8 con:
- ✅ PWA Frontend
- ✅ Servidor MCP existente
- ✅ Sistema de voz actual (Deepgram)
- ✅ Base de datos Neon
- ✅ Servicios existentes

---

## 🏗️ ARQUITECTURA PROPUESTA

```
┌─────────────────────────────────────────────────────────────┐
│                    PWA FRONTEND (index.html)                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Sandra Widget (Llamadas Conversacionales)           │  │
│  │  - WebSocket Client                                   │  │
│  │  - Audio Capture/Playback                             │  │
│  │  - UI Controls (scroll, click, navigate)              │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Componentes React/HTML                               │  │
│  │  - BookingCalendar                                    │  │
│  │  - PropertyCards                                      │  │
│  │  - OwnerDashboard                                     │  │
│  │  - SalesChatbot                                       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────┬───────────────────────────────┘
                              │ WebSocket (ws://)
                              │
┌─────────────────────────────▼───────────────────────────────┐
│              SOCKET SERVER (socket-server.js)               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  WebSocket Handler                                    │  │
│  │  - Session Management                                 │  │
│  │  - Audio Streaming (STT/TTS)                          │  │
│  │  - Tool Calls Execution                               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────┬───────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼────────┐  ┌─────────▼─────────┐  ┌───────▼──────────┐
│  SANDRA MCP    │  │  VOICE SERVICES   │  │  TOOL EXECUTOR   │
│  SERVER        │  │  (voice-services) │  │  (tool-handler)  │
│                │  │                   │  │                  │
│  - Tools Reg.  │  │  - GPT-4o-mini    │  │  - ui_action     │
│  - Tool Exec   │  │  - Prompt Engine  │  │  - navigate_ui   │
│  - Tool Defs   │  │  - Context Mgmt   │  │  - get_location  │
└────────────────┘  └───────────────────┘  │  - payments      │
                                           │  - whatsapp      │
                                           │  - notifications │
                                           │  - marketing     │
                                           │  - bridge_data   │
                                           └──────────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────┐
│                  SERVICIOS DE APOYO                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  NeonService │  │  BridgeData  │  │  PriceCal.   │     │
│  │              │  │  Service     │  │  Service     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  IP Tracking │  │  Gmail       │  │  Negotiation │     │
│  │  Service     │  │  Service     │  │  Bridge      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────┐
│                    NEON DATABASE                            │
│  - call_logs                                                │
│  - sessions                                                 │
│  - users                                                    │
│  - conversation_history                                     │
│  - properties                                               │
│  - negotiation_logs                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔌 PUNTOS DE CONEXIÓN

### 1. **CONEXIÓN FRONTEND ↔ BACKEND**

#### WebSocket Connection:
```javascript
// Frontend: index.html
const ws = new WebSocket('wss://pwa-imbf.onrender.com/');

// Backend: socket-server.js
wss.on('connection', (ws, req) => {
  // Handler de conexión
});
```

#### Mensajes WebSocket:
```javascript
// Cliente → Servidor
{
  type: 'audio',      // Audio chunks (STT)
  type: 'ready',      // Inicio de llamada
  type: 'resume_session', // Reconexión
  type: 'tool_call',  // Ejecutar tool (nuevo)
  type: 'ui_action'   // Acción UI (nuevo)
}

// Servidor → Cliente
{
  type: 'tts',        // Audio TTS
  type: 'transcription', // Transcripción STT
  type: 'tool_result', // Resultado de tool (nuevo)
  type: 'ui_update'   // Actualización UI (nuevo)
}
```

---

### 2. **CONEXIÓN SOCKET SERVER ↔ MCP TOOLS**

#### Crear Tool Handler:
```javascript
// src/websocket/tool-handler.js
class ToolHandler {
  constructor(services) {
    this.services = services;
    this.tools = new Map();
    this.registerTools();
  }

  registerTools() {
    // UI Control
    this.tools.set('ui_action', this.handleUIAction.bind(this));
    this.tools.set('navigate_ui', this.handleNavigateUI.bind(this));
    
    // Geolocalización
    this.tools.set('get_current_location', this.handleGetLocation.bind(this));
    
    // Pagos
    this.tools.set('initiate_secure_voice_payment', this.handlePayment.bind(this));
    
    // Comunicaciones
    this.tools.set('whatsapp_omni_response', this.handleWhatsApp.bind(this));
    this.tools.set('trigger_push_notification', this.handleNotification.bind(this));
    
    // Marketing
    this.tools.set('orchestrate_marketing_campaign', this.handleMarketing.bind(this));
    
    // BridgeData
    this.tools.set('get_live_pricing_bridge', this.handlePricing.bind(this));
  }

  async executeTool(name, args, sessionId, ws) {
    const handler = this.tools.get(name);
    if (!handler) {
      throw new Error(`Tool ${name} not found`);
    }
    return await handler(args, sessionId, ws);
  }
}
```

---

### 3. **CONEXIÓN VOICE SERVICES ↔ TOOLS**

#### Integrar Tools en Prompt:
```javascript
// src/services/voice-services.js
async processMessage(userMessage, context = {}) {
  const systemPrompt = `
    ...prompt existente...
    
    ## HERRAMIENTAS DISPONIBLES:
    
    Puedes usar estas herramientas mediante function calling:
    
    1. ui_action(action, target, value)
       - Controla la interfaz: scroll, click, modales
       - action: SCROLL, CLICK, TOGGLE_MODAL, HIGHLIGHT
       - target: ID del elemento o sección
     
    2. navigate_ui(section)
       - Navega a secciones: hero, properties, ai-studio, faq
       - section: Nombre de la sección
     
    3. get_current_location()
       - Obtiene ubicación GPS del usuario
     
    4. initiate_secure_voice_payment(amount, propertyName)
       - Inicia pago seguro por voz
     
    5. whatsapp_omni_response(phone, modality, message)
       - Envía mensaje WhatsApp
     
    6. trigger_push_notification(title, message, type)
       - Muestra notificación en pantalla
     
    7. orchestrate_marketing_campaign(platform, budget)
       - Lanza campaña de marketing
     
    8. get_live_pricing_bridge(propertyId)
       - Consulta precios en tiempo real
  `;
  
  // Llamar a OpenAI con function calling
  return await this._callOpenAIWithFunctions(userMessage, systemPrompt, context.tools);
}
```

---

## 📦 COMPONENTES A CREAR

### 1. **Tool Handler Service** (`src/websocket/tool-handler.js`)

**Responsabilidades:**
- Registrar todas las tools de Sandra
- Ejecutar tools cuando son llamadas
- Enviar resultados al cliente
- Gestionar estado de UI

**Estructura:**
```javascript
class ToolHandler {
  constructor(services) {
    this.services = services;
    this.tools = new Map();
    this.registerAllTools();
  }

  registerAllTools() {
    // 8 tools principales
  }

  async executeTool(name, args, sessionId, ws) {
    // Ejecutar tool y retornar resultado
  }

  // Handlers individuales para cada tool
  async handleUIAction(args, sessionId, ws) { }
  async handleNavigateUI(args, sessionId, ws) { }
  // ... etc
}
```

---

### 2. **UI Control Service** (`src/services/ui-control-service.js`)

**Responsabilidades:**
- Gestionar acciones de UI en el frontend
- Comunicación bidireccional con cliente
- Estado de navegación
- Sincronización de scroll/clicks

**Funciones:**
```javascript
class UIControlService {
  async scrollTo(target, ws) {
    // Enviar comando de scroll al cliente
  }

  async clickElement(target, ws) {
    // Enviar comando de click
  }

  async toggleModal(target, action, ws) {
    // Abrir/cerrar modales
  }

  async navigateToSection(section, ws) {
    // Navegar a sección específica
  }
}
```

---

### 3. **Client Tools Bridge** (`src/websocket/client-tools-bridge.js`)

**Responsabilidades:**
- Bridge entre servidor y cliente para tools
- Gestionar comunicación WebSocket para tools
- Queue de comandos de UI
- Sincronización de estado

---

### 4. **Sandra MCP Integration** (`src/orchestrators/sandra-mcp-integration.js`)

**Responsabilidades:**
- Integrar MCP Server de Sandra con sistema actual
- Unificar tools de Sandra con tools existentes
- Gestionar tool definitions para OpenAI function calling
- Coordinar ejecución de tools

---

## 🔄 FLUJOS DE INTEGRACIÓN

### Flujo 1: Navegación por Voz

```
Usuario: "Muéstrame las propiedades"
    ↓
STT (Deepgram) → Transcripción
    ↓
VoiceServices.processMessage()
    ↓
OpenAI con function calling
    ↓
Tool call: navigate_ui({section: 'properties'})
    ↓
ToolHandler.executeTool('navigate_ui', {...})
    ↓
UIControlService.navigateToSection('properties', ws)
    ↓
WebSocket → Cliente: {type: 'ui_update', action: 'navigate', section: 'properties'}
    ↓
Cliente: document.getElementById('properties').scrollIntoView()
    ↓
TTS: "Te muestro nuestras propiedades disponibles"
```

---

### Flujo 2: Consulta de Precios con BridgeData

```
Usuario: "¿Cuánto cuesta el loft del Cabañal?"
    ↓
STT → Transcripción
    ↓
VoiceServices.processMessage()
    ↓
OpenAI con function calling
    ↓
Tool call: get_live_pricing_bridge({propertyId: 'cabanal'})
    ↓
ToolHandler.executeTool('get_live_pricing_bridge', {...})
    ↓
BridgeDataService.getLivePricing('cabanal')
    ↓
PriceCalendarService.getPriceWithDiscount('cabanal', date)
    ↓
Resultado: {price: 85, currency: 'EUR', discount: 10%}
    ↓
TTS: "El precio de mercado es 95€, con nosotros es 85€ (10% de descuento)"
```

---

### Flujo 3: Pago por Voz

```
Usuario: "Quiero reservar"
    ↓
Tool call: initiate_secure_voice_payment({amount: 350, propertyName: 'Loft Cabañal'})
    ↓
ToolHandler.executeTool('initiate_secure_voice_payment', {...})
    ↓
WebSocket → Cliente: {type: 'payment_init', amount: 350, propertyName: 'Loft Cabañal'}
    ↓
Cliente: Abre modal de pago PayPal
    ↓
Usuario completa pago
    ↓
Cliente → Servidor: {type: 'payment_complete', transactionId: '...'}
    ↓
NeonService: Guardar reserva
    ↓
TTS: "¡Reserva confirmada! Te enviaremos los detalles por email"
```

---

## 📋 PLAN DE IMPLEMENTACIÓN

### FASE 1: Infraestructura Base (Prioridad Alta)

#### 1.1. Crear Tool Handler Service
- [ ] `src/websocket/tool-handler.js`
- [ ] Registrar 8 tools principales
- [ ] Handlers básicos para cada tool

#### 1.2. Crear UI Control Service
- [ ] `src/services/ui-control-service.js`
- [ ] Funciones de scroll, click, navigate
- [ ] Comunicación WebSocket

#### 1.3. Integrar Tool Handler en Socket Server
- [ ] Importar ToolHandler en socket-server.js
- [ ] Inicializar en initWebSocketServer()
- [ ] Conectar con sesiones WebSocket

#### 1.4. Actualizar Voice Services para Function Calling
- [ ] Añadir function definitions a OpenAI
- [ ] Manejar tool calls en processMessage()
- [ ] Ejecutar tools y retornar resultados

**Tiempo estimado:** 2-3 días

---

### FASE 2: Tools de Navegación (Prioridad Alta)

#### 2.1. Implementar `ui_action`
- [ ] Handler completo
- [ ] Comunicación con cliente
- [ ] Testing de scroll, click, modal

#### 2.2. Implementar `navigate_ui`
- [ ] Handler completo
- [ ] Mapeo de secciones
- [ ] Smooth scroll en cliente

#### 2.3. Actualizar Cliente (index.html)
- [ ] Handler de mensajes 'ui_update'
- [ ] Funciones de scroll/navigate
- [ ] Integración con componentes

**Tiempo estimado:** 1-2 días

---

### FASE 3: Tools de Negociación y Precios (Prioridad Alta)

#### 3.1. Implementar `get_live_pricing_bridge`
- [ ] Integrar BridgeDataService
- [ ] Integrar PriceCalendarService
- [ ] Comparación con OTA (gancho comparativo)

#### 3.2. Implementar `initiate_secure_voice_payment`
- [ ] Handler de pago
- [ ] Comunicación con cliente
- [ ] Integración con PaymentGateways

**Tiempo estimado:** 1-2 días

---

### FASE 4: Tools de Comunicación (Prioridad Media)

#### 4.1. Implementar `whatsapp_omni_response`
- [ ] Integrar Twilio Service
- [ ] Soporte para voice_call, text_chat, conversational_msg
- [ ] Testing

#### 4.2. Implementar `trigger_push_notification`
- [ ] Handler de notificaciones
- [ ] Comunicación con cliente
- [ ] Integración con sistema de notificaciones existente

**Tiempo estimado:** 1 día

---

### FASE 5: Tools Adicionales (Prioridad Media)

#### 5.1. Implementar `get_current_location`
- [ ] Reemplazar navigator.geolocation
- [ ] Usar APIs públicas (ip.guide ya implementado)
- [ ] Fallback apropiado

#### 5.2. Implementar `orchestrate_marketing_campaign`
- [ ] Handler básico
- [ ] Integración futura con APIs de marketing
- [ ] Logging en Neon DB

**Tiempo estimado:** 1 día

---

### FASE 6: Integración Completa (Prioridad Alta)

#### 6.1. Actualizar Prompt de Voz
- [ ] Añadir instrucciones de tools
- [ ] Ejemplos de uso
- [ ] Integración con contexto

#### 6.2. Testing Completo
- [ ] Testing de cada tool
- [ ] Testing de flujos completos
- [ ] Testing de integración

#### 6.3. Documentación
- [ ] Documentar todas las tools
- [ ] Ejemplos de uso
- [ ] Troubleshooting

**Tiempo estimado:** 2 días

---

## 🔧 CONFIGURACIÓN NECESARIA

### Variables de Entorno:
```env
# Ya existentes
OPENAI_API_KEY=...
DEEPGRAM_API_KEY=...
NEON_DATABASE_URL=...

# Nuevas (si se necesitan)
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_NUMBER=...
PAYPAL_CLIENT_ID=...
PAYPAL_SECRET=...
```

---

## 📊 DEPENDENCIAS

### Servicios a Integrar:
- ✅ VoiceServices (ya existe)
- ✅ NeonService (ya existe)
- ✅ BridgeDataService (ya existe)
- ✅ PriceCalendarService (ya existe)
- ✅ IPTrackingService (ya existe)
- ⏳ UIControlService (crear)
- ⏳ ToolHandler (crear)
- ⏳ ClientToolsBridge (crear)

---

## ✅ CHECKLIST DE INTEGRACIÓN

### Infraestructura:
- [ ] Tool Handler Service creado
- [ ] UI Control Service creado
- [ ] Client Tools Bridge creado
- [ ] Integración en Socket Server

### Tools Implementadas:
- [ ] ui_action
- [ ] navigate_ui
- [ ] get_current_location
- [ ] initiate_secure_voice_payment
- [ ] whatsapp_omni_response
- [ ] trigger_push_notification
- [ ] orchestrate_marketing_campaign
- [ ] get_live_pricing_bridge

### Integración:
- [ ] Function calling en VoiceServices
- [ ] Comunicación WebSocket para tools
- [ ] Handlers en cliente (index.html)
- [ ] Testing completo

---

## 🎯 RESULTADO ESPERADO

Al finalizar la integración:

1. ✅ Sandra puede controlar la UI por voz
2. ✅ Navegación fluida entre secciones
3. ✅ Consulta de precios con comparación OTA
4. ✅ Pagos seguros por voz
5. ✅ Comunicación omnicanal (WhatsApp)
6. ✅ Notificaciones push desde voz
7. ✅ Marketing automatizado
8. ✅ Todo orquestado desde servidor MCP

---

**ESTE ESTUDIO PROPORCIONA LA ARQUITECTURA COMPLETA PARA INTEGRAR TODAS LAS FUNCIONALIDADES DE SANDRA EN LA PWA ACTUAL.**
