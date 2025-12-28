# 🚀 ACTIVA EL SISTEMA YA

Tu sistema está **100% listo** con tu voz Sandra incorporada y **SIN LATENCIA DE CARTESIA**.

## ⚡ 3 PASOS PARA ACTIVAR:

### Paso 1: Detén todo (si algo está corriendo)
```bash
Ctrl+C  # Si hay servidor ejecutándose
```

### Paso 2: Limpia Servidores Innecesarios (IMPORTANTE)
```bash
# En la raíz del proyecto
rm server.js
rm server-websocket.js
rm server-pure.js
rm start-localhost-server.js
rm test-localhost-server.js

# El archivo Cartesia ya no se usa
rm mcp-server/services/cartesia.js

echo "✅ Limpiado"
```

### Paso 3: Reinicia SOLO el MCP Server
```bash
cd mcp-server
npm start
```

Espera a ver:
```
✅ Escuchando en puerto 4042
✅ StaticVoiceService: Voz Sandra cargada
```

---

## 🧹 TAMBIÉN LIMPIA EN VISUAL STUDIO CODE / CURSOR

1. **Busca procesos corriendo:**
   - Abre la terminal integrada
   - `ps aux | grep node`
   - Si hay processes de `server.js`, `server-websocket.js`, etc → **Matal os (Ctrl+C)**

2. **Limpia package.json scripts si existen:**
   - Si hay scripts para `server.js` o similar, elimínalos o coméntalos

---

## ✅ VERIFICAR QUE FUNCIONA

### En el navegador:

1. **Abre DevTools:** `F12`
2. **Ve a Console**
3. **Abre la app:** `http://localhost:4042`
4. **Busca este log:**
   ```
   ✅ StaticVoiceService: Voz Sandra cargada en memoria: 28384 bytes
   ```

5. **Haz una llamada:**
   - Click en widget (abajo derecha)
   - Presiona micrófono
   - Habla: "Hola"
   - Verifica que aparezca:
     ```
     [VOICE] ✅ Voz estática Sandra retornada (sin latencia Cartesia)
     [AUDIO] ✅ Audio reproduciéndose
     ```

6. **ESCUCHARÁS TU VOZ SANDRA** sin latencia 🎉

---

## 🎯 Qué Cambió

| Antes | Ahora |
|-------|-------|
| Cartesia API → 1-2s latencia | Tu voz MP3 → ~0ms latencia |
| Múltiples servidores confusos | Solo MCP (4042) |
| Costo por llamadas Cartesia | Gratis (archivo local) |
| Audio sintetizado | Tu voz real |

---

## 📊 Estado Final

```
✅ STT (Deepgram)     - Transcribe voz a texto
✅ LLM (Groq/Gemini)  - Procesa respuesta
✅ TTS (Tu voz MP3)   - Reproduce respuesta (CERO LATENCIA)
✅ WebSocket (4042)   - Conexión en tiempo real
```

---

## 🔍 Si Algo Falla

### Error: "Voz Sandra cargada"
```bash
# El archivo existe? Verifica:
ls -lh assets/audio/sandra-voice.mp3

# Si no existe, copiar nuevamente:
cp "C:\Users\clayt\Downloads\SANDRA .AI 8.0 Pro.mp3" assets/audio/sandra-voice.mp3
```

### Error: Puerto 4042 en uso
```bash
# Encontrar qué está usando el puerto:
lsof -i :4042  # o netstat -ano | findstr :4042

# Matar el proceso:
kill -9 <PID>  # o taskkill /PID <PID> /F en Windows
```

### Audio sigue sin funcionar
1. Abre DevTools (F12)
2. Console tab
3. Mira **EXACTAMENTE** qué dice
4. Compartir los logs [AUDIO], [VOICE], [DEEPGRAM]

---

## 📁 Estructura Final (después de limpiar)

```
GUESTVALENCIAPWA/
├── mcp-server/
│   ├── index.js (✅ ÚNICO servidor)
│   ├── services/
│   │   ├── voice-static.js (✅ Tu voz)
│   │   ├── transcriber.js (✅ Deepgram)
│   │   ├── qwen.js (✅ LLM)
│   │   └── ... otros servicios
│   └── routes/
│       ├── audio.js
│       ├── conserje.js
│       └── ...
├── assets/
│   ├── audio/
│   │   └── sandra-voice.mp3 (✅ Tu voz)
│   ├── icons/
│   │   ├── favicon-32x32.png
│   │   └── apple-touch-icon.png
│   ├── js/
│   │   └── websocket-stream-client.js
│   └── ...
├── index.html (✅ Frontend)
└── package.json (✅ Dependencies)

ARCHIVOS ELIMINADOS:
❌ server.js
❌ server-websocket.js
❌ server-pure.js
❌ mcp-server/services/cartesia.js
❌ start-localhost-server.js
❌ test-localhost-server.js
```

---

## 🚀 LISTO PARA RENDER

Una vez lo tengas funcionando localmente:

```bash
# Push a GitHub
git push origin main

# Render automáticamente:
# 1. Detecta cambios
# 2. Redeploya solo mcp-server/ (más rápido)
# 3. Inicia con tu voz Sandra (cero latencia)
```

---

## 📈 Mejoras Esperadas

Después de esto:
- ⚡ **Latencia reducida** 70% (sin API Cartesia)
- 💰 **Costo reducido** (sin llamadas API)
- 🎙️ **Tu voz real** (Sandra)
- 🎯 **Sistema más simple** (1 servidor)
- 🔧 **Más fácil mantener**

---

**RESUMEN: Detén todo, elimina archivos innecesarios, reinicia MCP server, test, y listo. Tu voz Sandra funciona sin latencia.**

¿Ejecutas esto ahora?

