# 🚀 PLAN DE EJECUCIÓN - INTEGRACIÓN COMPLETA SANDRA IA

## 📋 ANÁLISIS DE FUNCIONALIDADES EXTRAÍDAS

### 1. **SANDRA OMNI-BRAIN PROPTECH OS v14.8**

#### Capacidades Core:
- ✅ **Visión Multimodal**: Ver pantalla del usuario, describir propiedades, identificar elementos UI
- ✅ **Control Total de UI**: Scroll, clicks, navegación, apertura de modales
- ✅ **Negociación Autónoma**: Descuentos directos hasta 15% fuera de OTAs
- ✅ **Navegación Inteligente**: Mover usuario por secciones (hero, properties, ai-studio, faq)
- ✅ **Booking Orchestrator**: Control paso a paso del flujo de reserva

#### Modelo y Configuración:
- **Modelo**: `gemini-2.5-flash-native-audio-preview-09-2025`
- **Voz**: Zephyr
- **Audio**: 16kHz entrada, 24kHz salida
- **Modo**: Owner Strategy / Guest Mode

---

### 2. **MCP TOOLS (ProptechMCPServer)**

#### Herramientas Identificadas:

**UI Control (Navegación por Voz):**
- `ui_action` - Control de scroll, clicks, toggle modales, highlight
  - Acciones: SCROLL, CLICK, TOGGLE_MODAL, HIGHLIGHT
  - Parámetros: action, target, value (opcional)
- `navigate_ui` - Navegación suave a secciones mediante comandos de voz
  - Secciones: 'hero', 'properties', 'ai-studio', 'faq', 'dashboard', 'marketing'
  - Parámetros: section

**Geolocalización:**
- `get_current_location` - GPS para recomendaciones cercanas
  - ⚠️ REQUIERE REEMPLAZO: Actualmente usa navigator.geolocation, cambiar a APIs públicas

**Pagos (Voz):**
- `initiate_secure_voice_payment` - Terminal PayPal VPOS durante llamada
  - Parámetros: amount, propertyName

**Comunicaciones (Voz Omnicanal):**
- `whatsapp_omni_response` - WhatsApp Business (voice_call, text_chat, conversational_msg)
  - Modalidades: voice_call, text_chat, conversational_msg
  - Parámetros: phone, modality, message
- `trigger_push_notification` - Notificaciones push en pantalla (Toast)
  - Tipos: booking, update, alert, message
  - Parámetros: title, message, type

**Marketing (Voz):**
- `orchestrate_marketing_campaign` - Campañas en Instagram, TikTok, Meta
  - Plataformas: instagram, tiktok, meta
  - Parámetros: platform, budget, targetPropertyId (opcional)

**BridgeData (Voz):**
- `get_live_pricing_bridge` - Precios en tiempo real (GANCHO COMPARATIVO)
  - Parámetros: propertyId
  - Retorna: status, price, currency, provider

**Funciones Adicionales (Mencionadas pero no en MCP Server):**
- `booking_orchestrator` - Control paso a paso de reserva Airbnb-style
  - ⚠️ Mencionado en SYSTEM_INSTRUCTION pero no implementado en MCP Server
  - Acción requerida: Implementar en MCP Server

---

### 3. **BRIDGE DATA API - ESTRATEGIA DE PRECIOS**

#### Uso como Gancho Comparativo:
- ✅ **Precios de OTA** (Booking/Airbnb) como referencia
- ✅ **Comparación directa**: "El precio de mercado es X€, con nosotros es Y€"
- ✅ **Siempre por debajo**: Estrategia de precios atractivos
- ✅ **Tiempo real**: Consulta dinámica de precios

#### Integración:
- `sandraOpsApi.getLivePricing(propertyId)` - Precio en tiempo real
- `sandraOpsApi.checkAvailability(id, start, end)` - Disponibilidad
- `sandraOpsApi.fetchOwnerStats(ownerId)` - Estadísticas propietario

---

### 4. **BOOKING ENGINE**

#### Componentes:
- `BookingCalendar` - Selección de fechas con sincronización BridgeData
- `BookingSummary` - Resumen de reserva
- `PaymentGateways` - PayPal, Stripe, pago seguro
- Flujo: `SELECT_DATES` → `RESERVATION_SUMMARY` → `PAYMENT` → `CONFIRMATION`

---

### 5. **OWNER DASHBOARD**

#### Tabs y Funcionalidades:
- **Portfolio Analytics**: Yield, revenue, occupancy rate
- **Asset Management**: IoT Hub, Smart Locks, gestión propiedades
- **Reservations**: Gestión de reservas activas
- **Financial Reports**: ROI, payouts, liquidación de fondos
- **Direct Growth**: Campañas de marketing (CGO)
- **Sandra Bridge**: WhatsApp sync, comunicaciones estratégicas

---

### 6. **GUEST ITINERARY**

#### Funcionalidades:
- **Rutas Personalizadas**: Itinerarios por Valencia
- **Acuerdos Locales**: Descuentos con partners (Sandra VIP)
- **Google Maps Integration**: Navegación a ubicaciones
- **Comparación de Precios**: Precio directo vs. con Sandra

---

### 7. **SANDRA HUB (AI Studio)**

#### Herramientas:
- **Generación de Imágenes**: 1K/2K/4K (gemini-3-pro-image-preview)
- **Generación de Videos**: Veo 3.1 (veo-3.1-fast-generate-preview)
- **Análisis de Assets**: Visión Gemini 3 Pro
- **Grounding**: Google Search & Maps Real-Time
- **Deep Reasoning**: Razonamiento complejo (thinkingBudget: 32768)

---

### 8. **SALES CHATBOT**

#### Funcionalidades:
- Chat con `gemini-3-pro-preview`
- Integración BridgeData API
- Tool calls para precios y disponibilidad
- Navegación UI desde chat

---

### 9. **NAVEGACIÓN POR BUS** (Mencionado por usuario)

#### Funcionalidades Requeridas:
- Consulta de rutas de autobús en Valencia
- Integración con APIs de transporte público
- Recomendaciones de transporte desde alojamiento
- Horarios y paradas cercanas

---

## 🎯 PLAN DE IMPLEMENTACIÓN

### FASE 1: INTEGRACIÓN CORE SANDRA OMNI-BRAIN

#### 1.1. Crear Sandra Omni-Brain Service
**Archivo**: `src/services/sandra-omni-brain-service.js`

```javascript
- connectSandraLive() - Conexión Gemini Live API
- Sistema de instrucciones completo
- Tool calls integration
- Visión multimodal
- Control de UI
```

**Dependencias**:
- `@google/genai` (ya en proyecto)
- Integración con MCP Server existente

#### 1.2. Integrar MCP Tools en Socket Server
**Archivo**: `src/websocket/socket-server.js`

```javascript
- Importar ProptechMCPServer
- Registrar tools en Deepgram agent
- Ejecutar tool calls desde conversación
- Respuestas en tiempo real
```

#### 1.3. Actualizar Prompt de Voz
**Archivo**: `src/services/voice-services.js`

```javascript
- Incluir SYSTEM_INSTRUCTION completo
- Instrucciones de control UI
- Negociación autónoma
- Visión multimodal
```

---

### FASE 2: BRIDGE DATA API - GANCHO COMPARATIVO

#### 2.1. Mejorar BridgeData Service
**Archivo**: `src/services/bridge-data-service.js`

```javascript
- getLivePricing(propertyId) - Precio OTA en tiempo real
- comparePrices(propertyId, ourPrice) - Comparación directa
- getMarketPrice(propertyId, dates) - Precio de mercado
- Estrategia de gancho comparativo
```

#### 2.2. Integrar en Prompt de Negociación
**Archivo**: `src/services/voice-services.js`

```javascript
- "El precio de mercado es X€, con nosotros es Y€"
- "Siempre encontrarás el precio más atractivo con nosotros"
- Comparación automática con OTAs
```

#### 2.3. Función para Prompt de Voz
**Archivo**: `src/services/voice-functions.js`

```javascript
async compareMarketPrice(propertyId, checkIn, checkOut) {
  // Obtener precio OTA
  // Obtener nuestro precio con descuento
  // Retornar comparación
}
```

---

### FASE 3: BOOKING ENGINE COMPLETO

#### 3.1. Crear BookingCalendar Component
**Archivo**: `src/components/BookingCalendar.jsx` (o integrar en index.html)

```javascript
- Selección de fechas
- Sincronización BridgeData
- Estado de disponibilidad
- Integración con Price Calendar
```

#### 3.2. Crear BookingSummary Component
**Archivo**: `src/components/BookingSummary.jsx`

```javascript
- Resumen de reserva
- Desglose de precios
- Comparación con OTA
- Confirmación
```

#### 3.3. Integrar PaymentGateways
**Archivo**: `src/components/PaymentGateways.jsx`

```javascript
- PayPal integration
- Stripe integration
- Pago seguro por voz
- Confirmación de pago
```

---

### FASE 4: OWNER DASHBOARD

#### 4.1. Crear Owner Dashboard
**Archivo**: `src/components/OwnerDashboard.jsx`

```javascript
- Portfolio Analytics
- Asset Management
- Reservations Management
- Financial Reports
- Marketing Dashboard
- Sandra Bridge Communications
```

#### 4.2. Integrar con Neon DB
**Archivo**: `src/services/neon-service.js`

```javascript
- fetchOwnerStats(ownerId)
- getOwnerProperties(ownerId)
- getOwnerBookings(ownerId)
- calculateROI(ownerId)
```

---

### FASE 5: GUEST ITINERARY

#### 5.1. Crear Guest Itinerary Service
**Archivo**: `src/services/itinerary-service.js`

```javascript
- generateItinerary(location, preferences)
- getLocalOffers(location)
- integrateGoogleMaps()
- comparePricesWithPartners()
```

#### 5.2. Crear Guest Itinerary Component
**Archivo**: `src/components/GuestItinerary.jsx`

```javascript
- Visualización de ruta
- Acuerdos locales
- Descuentos Sandra VIP
- Navegación Google Maps
```

---

### FASE 6: SANDRA HUB (AI Studio)

#### 6.1. Crear Sandra Hub Service
**Archivo**: `src/services/sandra-hub-service.js`

```javascript
- generateProImage(prompt, config)
- generateVeoVideo(prompt, image, aspectRatio)
- analyzeAsset(prompt, asset)
- groundedQuery(prompt, tool)
- deepReasoning(prompt)
```

#### 6.2. Crear Sandra Hub Component
**Archivo**: `src/components/SandraHub.jsx`

```javascript
- Interfaz para generación
- Configuración de calidad
- Visualización de resultados
- Gestión de tokens/usage
```

---

### FASE 7: NAVEGACIÓN POR BUS

#### 7.1. Crear Bus Navigation Service
**Archivo**: `src/services/bus-navigation-service.js`

```javascript
- getBusRoutes(from, to)
- getNearbyStops(location)
- getBusSchedule(stopId)
- getRouteRecommendations(propertyLocation, destination)
```

#### 7.2. Integrar API de Transporte Público
- **EMT Valencia API** o similar
- **Google Maps Transit API**
- **OpenStreetMap Overpass API**

#### 7.3. Función para Prompt de Voz
**Archivo**: `src/services/voice-functions.js`

```javascript
async getBusRoute(from, to) {
  // Consultar rutas de bus
  // Retornar horarios y paradas
}
```

---

### FASE 8: SALES CHATBOT

#### 8.1. Crear Sales Chatbot Component
**Archivo**: `src/components/SalesChatbot.jsx`

```javascript
- Chat interface
- Integración Gemini 3 Pro
- Tool calls BridgeData
- Navegación UI
```

#### 8.2. Integrar en PWA
**Archivo**: `index.html`

```javascript
- Widget flotante
- Integración con Sandra Live
- Sincronización con llamadas
```

---

### FASE 9: INTEGRACIÓN COMPLETA

#### 9.1. Actualizar Server.js
**Archivo**: `server.js`

```javascript
- Inicializar Sandra Omni-Brain Service
- Inicializar MCP Server
- Inicializar todos los servicios
- Exponer en req.services
```

#### 9.2. Actualizar Socket Server
**Archivo**: `src/websocket/socket-server.js`

```javascript
- Integrar tool calls
- Ejecutar MCP tools
- Control de UI desde voz
- Negociación con BridgeData
```

#### 9.3. Actualizar Frontend
**Archivo**: `index.html`

```javascript
- Integrar todos los componentes
- Sandra Hub
- Owner Dashboard
- Guest Itinerary
- Sales Chatbot
- Booking Engine
```

---

## 📦 ARCHIVOS A CREAR/MODIFICAR

### Nuevos Servicios:
1. `src/services/sandra-omni-brain-service.js`
2. `src/services/bus-navigation-service.js`
3. `src/services/itinerary-service.js`
4. `src/services/sandra-hub-service.js`

### Nuevos Componentes (si usamos React):
1. `src/components/BookingCalendar.jsx`
2. `src/components/BookingSummary.jsx`
3. `src/components/PaymentGateways.jsx`
4. `src/components/OwnerDashboard.jsx`
5. `src/components/GuestItinerary.jsx`
6. `src/components/SandraHub.jsx`
7. `src/components/SalesChatbot.jsx`

### Modificaciones:
1. `src/services/bridge-data-service.js` - Gancho comparativo
2. `src/services/voice-services.js` - Prompt completo Sandra
3. `src/services/voice-functions.js` - Nuevas funciones
4. `src/websocket/socket-server.js` - Tool calls integration
5. `server.js` - Inicialización servicios
6. `index.html` - Integración componentes

---

## 🔧 CONFIGURACIÓN NECESARIA

### Variables de Entorno:
```env
# Gemini API
GEMINI_API_KEY=...

# BridgeData API
BRIDGEDATA_API_KEY=...
BRIDGEDATA_API_URL=...

# Transporte Público
EMT_VALENCIA_API_KEY=...
GOOGLE_MAPS_API_KEY=...

# PayPal
PAYPAL_CLIENT_ID=...
PAYPAL_SECRET=...

# Twilio (WhatsApp)
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_NUMBER=...
```

---

## 🎯 PRIORIDADES DE IMPLEMENTACIÓN

### ALTA PRIORIDAD:
1. ✅ BridgeData como gancho comparativo (FASE 2)
2. ✅ Sandra Omni-Brain core (FASE 1)
3. ✅ Booking Engine básico (FASE 3)
4. ✅ MCP Tools integration (FASE 1)

### MEDIA PRIORIDAD:
5. Owner Dashboard (FASE 4)
6. Sales Chatbot (FASE 8)
7. Guest Itinerary (FASE 5)

### BAJA PRIORIDAD:
8. Sandra Hub (FASE 6)
9. Navegación por Bus (FASE 7)

---

## 📝 NOTAS IMPORTANTES

### Estrategia de Precios:
- **BridgeData siempre como gancho comparativo**
- "El precio de mercado es X€, con nosotros es Y€"
- "Siempre encontrarás el precio más atractivo"
- Comparación automática en cada consulta

### Negociación:
- Descuentos directos hasta 15% fuera de OTAs
- Autonomía de Sandra para cerrar ventas
- Técnicas de venta cuando no se puede negociar más

### Control UI:
- Sandra puede controlar toda la interfaz
- Navegación por voz
- Apertura de modales
- Scroll y clicks

---

**Este plan integra TODAS las funcionalidades de Sandra en el ecosistema actual.**
