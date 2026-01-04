# 📊 ANÁLISIS EXHAUSTIVO: IA-SANDRA - Funcionalidades y Conexión

## 🎯 OBJETIVO
Análisis completo de todas las funcionalidades disponibles en IA-SANDRA y plan de conexión quirúrgica al sistema PWA.

---

## 📦 ESTRUCTURA REAL DE IA-SANDRA

### ✅ Servicios Disponibles en `services/`:

1. **negotiation-service.js** ✅
   - Clase: `NegotiationService`
   - Métodos: `initiateNegotiation()`, `generateNegotiationStrategy()`, `handleCounterOffer()`, `finalizeNegotiation()`, `computeOffer()`
   - Export: `module.exports = NegotiationService`

2. **multimodal-conversation-service.js** ✅
   - Clase: `MultimodalConversationService`
   - Integración: Deepgram, Cartesia, HeyGen, LipSync, BrightData
   - Métodos: `startConversation()`, `processAudio()`, `generateResponse()`
   - Export: `module.exports = MultimodalConversationService`

3. **neon-db-adapter/neon-db.js** ✅
   - Clase: `NeonDB`
   - Métodos: `initializeDatabase()`, `saveMemory()`, `getMemory()`, `saveConversation()`, `getConversations()`
   - Export: `module.exports = NeonDB`

4. **Otros Servicios Disponibles**:
   - `audio-service.js`
   - `audio-visualizer.js`
   - `bright-data-service.js`
   - `cartesia-service.js`
   - `deepgram-service.js`
   - `heygen-service.js`
   - `lipsync-service.js`
   - `vision-service.js`
   - `voice-bridge-service.js`
   - `voice-cache-service.js`
   - `webrtc-avatar-manager.js`

### ⚠️ DIFERENCIAS CON DOCUMENTACIÓN:

**Documentación dice:**
- `negotiation/` (carpeta) ❌ NO EXISTE
- `context/` (carpeta) ❌ NO EXISTE

**Realidad:**
- `services/negotiation-service.js` ✅ EXISTE
- Contexto está en PWA: `lib/contextOrchestrator.js` ✅

---

## 🔧 FUNCIONALIDADES PRINCIPALES

### 1. NEGOTIATION SERVICE
**Ubicación:** `IA-SANDRA/services/negotiation-service.js`

**Funcionalidades:**
- ✅ Iniciar negociación de precios
- ✅ Generar estrategias de negociación
- ✅ Manejar contraofertas
- ✅ Finalizar negociaciones
- ✅ Calcular ofertas estratégicas (`computeOffer()`)
- ✅ Considera: propertyId, basePrice, channel, date, guests

**Conexión:** Ya implementado en `negotiation-bridge.js` pero busca carpeta incorrecta.

### 2. MULTIMODAL CONVERSATION SERVICE
**Ubicación:** `IA-SANDRA/services/multimodal-conversation-service.js`

**Funcionalidades:**
- ✅ Conversación multimodal (texto, voz, video, avatar)
- ✅ Integración Deepgram STT
- ✅ Integración Cartesia TTS
- ✅ Integración HeyGen Avatar
- ✅ Lip-sync avanzado
- ✅ Barge-in en tiempo real
- ✅ Modo continuo (sin clicks)
- ✅ BrightData para scraping
- ✅ GuestMediaHandler

**Conexión:** NO CONECTADO - Servicio completo disponible.

### 3. NEON DB ADAPTER
**Ubicación:** `IA-SANDRA/neon-db-adapter/neon-db.js`

**Funcionalidades:**
- ✅ Conexión PostgreSQL/Neon
- ✅ Modo online/offline
- ✅ Gestión de memoria persistente
- ✅ Guardar conversaciones
- ✅ Guardar memorias con tags
- ✅ Cache local como fallback

**Conexión:** Parcialmente conectado, pero busca archivo incorrecto.

### 4. CONTEXT ORCHESTRATOR
**Ubicación:** `lib/contextOrchestrator.js` (EN EL PWA, NO EN IA-SANDRA)

**Funcionalidades:**
- ✅ Consulta clima (Open-Meteo)
- ✅ Consulta hora (WorldTimeAPI)
- ✅ Consulta eventos (Nager.Date)
- ✅ Determina estado de escena (look, voice, video)
- ✅ Prioridades: Eventos > Horario > Clima

**Conexión:** Ya está en el PWA, solo necesita ser usado por el bridge.

---

## 🚀 PLAN DE CONEXIÓN QUIRÚRGICA

### FASE 1: Configurar Render para Submodules ✅ PRIORITARIO

**Archivo:** Render Dashboard → Build Command

**Cambio:**
```
ANTES: npm install
AHORA: git submodule update --init --recursive && npm install
```

### FASE 2: Ajustar Orquestador según Estructura Real

**Archivo:** `src/orchestrators/sandra-orchestrator.js`

**Cambios Necesarios:**

1. **Negotiation Pipeline:**
   - ❌ Busca: `negotiation/` (carpeta)
   - ✅ Debe buscar: `services/negotiation-service.js`

2. **Context Orchestrator:**
   - ❌ Busca: `context/` (carpeta en IA-SANDRA)
   - ✅ Ya existe en: `lib/contextOrchestrator.js` (PWA)
   - ✅ Usar el existente, no buscar en IA-SANDRA

3. **Neon Adapter:**
   - ✅ Estructura correcta: `neon-db-adapter/neon-db.js`
   - ⚠️ Verificar formato de export (CommonJS vs ES Modules)

4. **Cargar Servicios:**
   - ✅ Estructura correcta: `services/`
   - ⚠️ Los servicios usan `module.exports` (CommonJS)
   - ⚠️ El orquestador usa `import` (ES Modules)
   - 🔧 NECESITA CONVERSIÓN O ADAPTADOR

### FASE 3: Conectar Servicios Reales

**Servicios a Conectar:**

1. ✅ **NegotiationService** - Prioridad ALTA
2. ⏳ **MultimodalConversationService** - Prioridad MEDIA
3. ✅ **NeonDB Adapter** - Prioridad ALTA
4. ⏳ **Otros servicios** - Prioridad BAJA

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### Paso 1: Configurar Render ✅
- [ ] Modificar Build Command en Render Dashboard
- [ ] Verificar que submodules se clonen correctamente
- [ ] Verificar logs de build

### Paso 2: Ajustar Orquestador
- [ ] Corregir ruta de negotiation-service
- [ ] Ajustar contexto para usar lib/contextOrchestrator.js
- [ ] Manejar CommonJS → ES Modules
- [ ] Probar carga de servicios

### Paso 3: Conectar Negotiation Service
- [ ] Instanciar NegotiationService
- [ ] Conectar con negotiation-bridge.js
- [ ] Probar computeOffer()
- [ ] Integrar con WebSocket server

### Paso 4: Conectar Neon DB Adapter
- [ ] Instanciar NeonDB
- [ ] Verificar compatibilidad con neon-service.js del PWA
- [ ] Probar conexión
- [ ] Migrar datos si es necesario

### Paso 5: Integrar Multimodal Conversation Service (Opcional)
- [ ] Analizar dependencias
- [ ] Conectar si es necesario
- [ ] Probar funcionalidades

---

**ESTADO**: 🔄 ANÁLISIS COMPLETADO - LISTO PARA IMPLEMENTACIÓN
