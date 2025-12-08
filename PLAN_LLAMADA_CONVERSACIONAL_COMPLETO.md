# PLAN DE IMPLEMENTACIÓN: LLAMADA CONVERSACIONAL EN TIEMPO REAL
## Estudio Completo del Sistema Galaxy y Arquitectura de Integración

---

## 1. ANÁLISIS DEL SISTEMA ACTUAL

### 1.1 Arquitectura Existente

#### **Servidor HTTP (server.js)**
- **Puerto:** 4040
- **Funcionalidad:**
  - Sirve archivos estáticos (HTML, CSS, JS)
  - API REST: `/api/sandra/chat` (texto)
  - API REST: `/api/sandra/voice` (TTS)
  - API REST: `/api/sandra/transcribe` (STT para dictado)
- **Orquestador:** `AIOrchestrator` (Gemini como primario, GPT-4o como fallback)
- **TTS:** Cartesia API integrada
- **STT:** Deepgram (solo para dictado del chat)

#### **Servidor WebSocket (server-websocket.js)**
- **Puerto:** 4041
- **Funcionalidad:**
  - Maneja llamadas conversacionales en tiempo real
  - Recibe audio del cliente (base64)
  - Intenta transcribir con Deepgram
  - Genera respuesta con Gemini/GPT-4o/Groq
  - Genera TTS con Cartesia
  - Envía audio de vuelta al cliente
- **Problema Actual:** El audio no se transcribe correctamente

#### **Cliente (index.html)**
- **Widget de Sandra:** Chat + botón de llamada
- **Captura de audio:** MediaRecorder (WebM/Opus)
- **Envío:** WebSocket con audio en base64
- **Reproducción:** Audio element con base64

### 1.2 Sistema Galaxy Original (api-gateway.js)

#### **Estructura:**
```javascript
class AIOrchestrator {
  - generateResponse(prompt, context)
  - callGemini(prompt, systemPrompt)
  - callOpenAI(prompt, systemPrompt)
  - generateVoice(text, voiceId) // Cartesia
  - transcribeAudio(audioBase64) // Deepgram (referenciado pero no implementado)
}
```

#### **Endpoints Originales:**
- `/api/sandra/chat` - Chat de texto
- `/api/sandra/voice` - Generación de voz (TTS)

#### **Observaciones:**
- El sistema original NO tenía implementación de llamada conversacional
- Solo tenía TTS (Cartesia) para respuestas de voz
- STT (Deepgram) estaba referenciado pero no implementado completamente

---

## 2. DIAGNÓSTICO DEL PROBLEMA ACTUAL

### 2.1 Error: "No se pudo transcribir el audio"

#### **Posibles Causas:**

1. **Formato de Audio:**
   - Cliente envía: `audio/webm;codecs=opus` (base64)
   - Deepgram espera: `audio/webm` raw
   - **Problema:** El base64 puede tener prefijo `data:audio/webm;base64,` que hay que remover

2. **Tamaño del Audio:**
   - MediaRecorder envía chunks cada 2 segundos
   - Puede que el audio esté vacío o muy corto
   - Deepgram requiere mínimo ~100ms de audio

3. **API Key de Deepgram:**
   - Verificar que esté cargada correctamente desde `.env`
   - Verificar formato: `Token {KEY}` (no `Bearer`)

4. **Headers HTTP:**
   - Deepgram requiere `Content-Type: audio/webm`
   - Verificar que el buffer se envíe correctamente

### 2.2 Flujo Actual (Problemático):

```
Cliente → MediaRecorder → Blob → FileReader → base64 → WebSocket → 
Servidor → Buffer.from(base64) → Deepgram API → Error
```

---

## 3. PLAN DE IMPLEMENTACIÓN

### FASE 1: CORRECCIÓN DEL STT (Deepgram)

#### **3.1 Validación del Audio en Cliente**
```javascript
// En index.html, antes de enviar:
- Verificar que audioBlob.size > 0
- Verificar que base64Audio no esté vacío
- Agregar logs para debugging
```

#### **3.2 Corrección del Servidor WebSocket**
```javascript
// En server-websocket.js:
- Validar que audioBase64 no esté vacío
- Remover prefijo "data:audio/webm;base64," si existe
- Verificar tamaño mínimo del buffer (100 bytes mínimo)
- Agregar logs detallados en cada paso
- Manejar errores de Deepgram con mensajes claros
```

#### **3.3 Testing del STT**
- Probar con audio de 2 segundos mínimo
- Verificar respuesta de Deepgram
- Validar que la transcripción sea correcta

---

### FASE 2: INTEGRACIÓN COMPLETA TTS + STT

#### **3.4 Flujo Correcto de Llamada Conversacional**

```
1. Cliente inicia llamada
   ↓
2. Cliente solicita micrófono
   ↓
3. MediaRecorder captura audio (chunks de 2 segundos)
   ↓
4. Cliente envía audio a WebSocket (base64)
   ↓
5. Servidor recibe audio
   ↓
6. Servidor transcribe con Deepgram (STT)
   ↓
7. Servidor genera respuesta con Gemini (IA)
   ↓
8. Servidor genera audio con Cartesia (TTS)
   ↓
9. Servidor envía texto + audio al cliente
   ↓
10. Cliente muestra texto y reproduce audio
   ↓
11. Loop: volver al paso 3
```

#### **3.5 Implementación de Barge-in**
- Detectar cuando usuario habla durante respuesta de IA
- Detener audio de IA inmediatamente
- Procesar audio del usuario
- Continuar conversación

---

### FASE 3: OPTIMIZACIÓN Y MEJORAS

#### **3.6 Streaming de Audio**
- Enviar chunks más pequeños (500ms) para menor latencia
- Procesar transcripciones parciales (si Deepgram lo soporta)
- Streaming de TTS (si Cartesia lo soporta)

#### **3.7 Manejo de Errores**
- Reintentos automáticos en fallos de API
- Fallback a Whisper si Deepgram falla
- Mensajes de error claros al usuario

#### **3.8 Timeout y Gestión de Recursos**
- Timeout de inactividad (60 segundos) ✅ Ya implementado
- Cierre correcto de streams de audio
- Limpieza de recursos al colgar

---

## 4. ARCHIVOS A MODIFICAR

### 4.1 `server-websocket.js`
**Cambios necesarios:**
1. Mejorar función `transcribeAudio()`:
   - Validar formato de base64
   - Remover prefijo si existe
   - Verificar tamaño mínimo
   - Logs detallados
   - Manejo de errores mejorado

2. Validar audio antes de procesar:
   - Verificar que no esté vacío
   - Verificar tamaño mínimo (100 bytes)

3. Integrar con sistema Galaxy:
   - Usar `AIOrchestrator` del sistema original
   - Mantener consistencia con `server.js`

### 4.2 `index.html`
**Cambios necesarios:**
1. Validación de audio antes de enviar:
   - Verificar que `audioBlob.size > 0`
   - Verificar que `base64Audio` no esté vacío
   - Logs para debugging

2. Mejorar manejo de errores:
   - Mostrar mensajes claros al usuario
   - Reintentar en caso de error de red

### 4.3 `.env`
**Verificar:**
- `DEEPGRAM_API_KEY` está configurada
- `CARTESIA_API_KEY` está configurada
- `CARTESIA_VOICE_ID` está configurada
- `GEMINI_API_KEY` está configurada

---

## 5. ORDEN DE IMPLEMENTACIÓN

### **PASO 1: Corregir STT (Deepgram)**
1. Validar formato de audio en cliente
2. Corregir decodificación de base64 en servidor
3. Agregar logs detallados
4. Probar transcripción

### **PASO 2: Verificar TTS (Cartesia)**
1. Verificar que Cartesia funcione correctamente
2. Probar generación de audio
3. Verificar formato de respuesta

### **PASO 3: Integrar Flujo Completo**
1. STT → IA → TTS en un solo flujo
2. Probar llamada completa
3. Verificar latencia

### **PASO 4: Implementar Barge-in**
1. Detección de voz del usuario
2. Interrupción de audio de IA
3. Procesamiento inmediato

### **PASO 5: Optimizaciones**
1. Reducir latencia
2. Mejorar calidad de audio
3. Optimizar recursos

---

## 6. TESTING Y VALIDACIÓN

### **Tests a Realizar:**
1. ✅ Audio se captura correctamente
2. ✅ Audio se envía al servidor
3. ⚠️ Audio se transcribe correctamente (PENDIENTE)
4. ✅ Respuesta de IA se genera
5. ✅ Audio TTS se genera
6. ✅ Audio se reproduce en cliente
7. ⚠️ Barge-in funciona (PENDIENTE)
8. ✅ Timeout de inactividad funciona

---

## 7. DEPENDENCIAS Y CONFIGURACIÓN

### **APIs Requeridas:**
- ✅ Deepgram (STT) - API Key configurada
- ✅ Cartesia (TTS) - API Key y Voice ID configurados
- ✅ Gemini (IA) - API Key configurada
- ⚠️ Fallback: OpenAI Whisper (si Deepgram falla)

### **Librerías Node.js:**
- ✅ `ws` - WebSocket server
- ✅ `dotenv` - Variables de entorno
- ✅ `https` - HTTP requests nativo

---

## 8. PRÓXIMOS PASOS INMEDIATOS

1. **Corregir función `transcribeAudio()` en `server-websocket.js`**
2. **Agregar validaciones de audio en cliente**
3. **Probar transcripción con audio real**
4. **Verificar logs del servidor para identificar el error exacto**
5. **Implementar mejoras según resultados de testing**

---

## CONCLUSIÓN

El sistema tiene la arquitectura correcta, pero necesita:
- **Corrección del formato de audio** para Deepgram
- **Validaciones más estrictas** en cliente y servidor
- **Logs detallados** para debugging
- **Manejo de errores mejorado**

Una vez corregido el STT, el flujo completo debería funcionar correctamente.

