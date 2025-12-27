# FASE 2 - IMPLEMENTACIÓN COMPLETA
## Chat por Texto: OpenAI + Deepgram + Sandra Voice

**Status:** ✅ IMPLEMENTACIÓN LISTA PARA ACTIVAR
**Fecha:** Diciembre 27, 2025

---

## 📋 RESUMEN

**Arquitectura FASE 2:**
```
Usuario habla
    ↓
MediaRecorder captura audio (webm)
    ↓
Envía a /api/sandra/chat-text
    ↓
Deepgram transcribe audio → texto
    ↓
gpt-4o-mini procesa texto
    ↓
Respuesta texto a playFallback()
    ↓
Voz de Sandra reproduce respuesta
```

**Ventajas:**
- ✅ NO hay Realtime API (sin audio generation obligatoria)
- ✅ Solo voz de Sandra (sin tío de OpenAI)
- ✅ Más barato: ~$0.30 por llamada vs $2-5 actual
- ✅ Conversación natural por texto
- ✅ Soporte para historial conversacional

---

## 📁 ARCHIVOS CREADOS

### 1. **Backend API: `/api/sandra/chat-text.js`**
- Procesa audio con Deepgram STT
- Envía texto a gpt-4o-mini
- Retorna respuesta
- **Requiere:** OPENAI_API_KEY + DEEPGRAM_API_KEY

### 2. **Frontend JS: `/assets/js/speech-to-text-chat.js`**
- Captura audio con MediaRecorder
- Envía a chat-text.js
- Reproduces con voz de Sandra
- **Métodos públicos:**
  - `window.speechToChatSystem.startListening()`
  - `window.speechToChatSystem.stopListening()`
  - `window.speechToChatSystem.setLanguage('es'|'en'|'fr')`
  - `window.speechToChatSystem.clearHistory()`

---

## ⚙️ CONFIGURACIÓN REQUERIDA

### Variables de Entorno (.env)

Asegúrate que tengas en tu `.env`:

```bash
# OpenAI - Agregar tu API key aquí (no commitear)
OPENAI_API_KEY=your_openai_api_key_here

# Deepgram - Agregar tu API key aquí (no commitear)
DEEPGRAM_API_KEY=your_deepgram_api_key_here
```

**IMPORTANTE:** Nunca commits archivos `.env` o archivos con API keys reales.
Las claves deben estar solo en tu máquina local o en variables de entorno del servidor.

---

## 🔌 INTEGRACIÓN EN index.html

Agregar en la sección `<head>`:

```html
<!-- FASE 2: Speech-to-Text Chat System -->
<script src="/assets/js/speech-to-text-chat.js" defer></script>
```

---

## 🎙️ IMPLEMENTACIÓN EN HTML

### Opción A: Botones Simples

```html
<!-- Botones para start/stop listening -->
<button onclick="window.speechToChatSystem.startListening()">
  🎤 Hablar
</button>

<button onclick="window.speechToChatSystem.stopListening()">
  ⏹️ Detener
</button>

<!-- Indicador de estado -->
<div id="status">Listo para escuchar</div>

<script>
  // Monitorear estado
  setInterval(() => {
    const status = window.speechToChatSystem.getStatus();
    document.getElementById('status').textContent =
      status.isListening ? '🔴 Escuchando...' : '✅ Listo';
  }, 100);
</script>
```

### Opción B: Con Selector de Idioma

```html
<div class="voice-controls">
  <!-- Selector de idioma -->
  <select onchange="window.speechToChatSystem.setLanguage(this.value)">
    <option value="es">Español</option>
    <option value="en">English</option>
    <option value="fr">Français</option>
  </select>

  <!-- Control de voz -->
  <button id="voiceBtn" onclick="toggleVoiceInput()">
    🎤 Escuchar
  </button>
</div>

<script>
  let isListening = false;

  function toggleVoiceInput() {
    if (!isListening) {
      window.speechToChatSystem.startListening();
      document.getElementById('voiceBtn').textContent = '⏹️ Detener';
      isListening = true;
    } else {
      window.speechToChatSystem.stopListening();
      document.getElementById('voiceBtn').textContent = '🎤 Escuchar';
      isListening = false;
    }
  }
</script>
```

---

## 📝 FLUJO DE CONVERSACIÓN

### Ejemplo: Usuario dice "Hola"

```
1. Usuario hace click en "Hablar"
   → startListening() inicia MediaRecorder

2. Usuario dice: "Hola, buenos días"
   → Audio capturado en WAV

3. Usuario hace click en "Detener"
   → stopListening() envía audio a /api/sandra/chat-text

4. Backend:
   → Deepgram transcribe: "Hola, buenos días"
   → gpt-4o-mini responde: "Buenos días, bienvenido a GuestsValencia..."

5. Frontend recibe respuesta
   → playResponse() toca voz de Sandra
   → Usuario escucha SOLO voz de Sandra

6. Sistema listo para siguiente pregunta
   → Historial mantiene contexto conversacional
```

---

## 🔍 DEBUGGING

### Consola del Navegador (F12)

```javascript
// Ver estado del sistema
window.speechToChatSystem.getStatus()

// Ver historial conversacional
window.speechToChatSystem.getHistory()

// Limpiar historial
window.speechToChatSystem.clearHistory()

// Logs automáticos
[SPEECH-CHAT] ℹ️  Sistema inicializado
[SPEECH-CHAT] ✅ Audio capturado
[CHAT-TEXT] Usuario: "tu texto aquí"
```

### Backend Logs

```bash
[CHAT-TEXT] Usuario texto: "tu texto aquí"
[CHAT-TEXT] Procesando audio con Deepgram...
[CHAT-TEXT] Deepgram transcripción: "tu texto aquí"
[CHAT-TEXT] Enviando a gpt-4o-mini...
[CHAT-TEXT] Respuesta Sandra: "respuesta aquí"
```

---

## 💰 COSTOS FASE 2

### Por Llamada de 1 Minuto:

| Servicio | Costo |
|----------|-------|
| Deepgram STT | $0.0043 |
| gpt-4o-mini | $0.15-0.30 |
| Total | **~$0.30** |

### Comparativa:
- **ANTES (Realtime):** $2-5 por llamada
- **DESPUÉS (FASE 2):** $0.30 por llamada
- **AHORRO:** 85-94%

---

## ✅ LISTA DE VERIFICACIÓN IMPLEMENTACIÓN

- [x] Archivo chat-text.js creado
- [x] Archivo speech-to-text-chat.js creado
- [x] Soporte para Deepgram integrado
- [x] Soporte para gpt-4o-mini integrado
- [x] Sistema de historial conversacional
- [x] Detección de tipo de respuesta
- [x] Integración con playFallback()
- [ ] Script agregado a index.html
- [ ] Botones implementados en UI
- [ ] Variables de entorno configuradas
- [ ] Pruebas funcionales completadas

---

## 🚀 PRÓXIMOS PASOS

### 1. Agregar script a index.html
```html
<script src="/assets/js/speech-to-text-chat.js" defer></script>
```

### 2. Crear botones en la interfaz
Use Opción A o B arriba

### 3. Probar en navegador:
- F12 → Console
- Verificar logs [SPEECH-CHAT]
- Hacer prueba de conversación

### 4. Monitorear costos:
- OpenAI usage dashboard
- Deepgram usage dashboard

---

## 🔧 TROUBLESHOOTING

**Error: "Deepgram API key not configured"**
→ Agregar DEEPGRAM_API_KEY a .env

**Error: "OpenAI API key not configured"**
→ Agregar OPENAI_API_KEY a .env

**No se escucha audio del navegador**
→ Verificar permisos de micrófono
→ Check navegador soporta MediaRecorder

**Respuesta lenta**
→ Normal: Deepgram (~1s) + OpenAI (~2s) = ~3s total
→ Más rápido que Realtime en muchos casos

**Accento mal interpretado**
→ Deepgram soporta muchos acentos
→ Si falla, Español USA está optimizado (es-US)

---

## 📞 SOPORTE

**Documentación:**
- OpenAI API: https://platform.openai.com/docs
- Deepgram: https://developers.deepgram.com
- gpt-4o-mini: Modelo de texto puro, no de audio

**Logs para debuggear:**
- Backend: `/api/sandra/chat-text.js` (líneas 49-78)
- Frontend: `/assets/js/speech-to-text-chat.js` (líneas 22-26)

---

**¿Listo para activar FASE 2?**

Solo falta:
1. Agregar script a index.html
2. Crear botones en UI
3. Probar en navegador

¡Vamos!
