# 🗑️ Servidores y Procesos a Eliminar

## Estado Actual (INNECESARIOS)

Tu sistema tiene **5 servidores Node.js** cuando solo necesitas **1** (MCP en 4042).

### Servidores Innecesarios:

| Puerto | Archivo | Función | Estado | Acción |
|--------|---------|---------|--------|--------|
| **4040** | `server.js` | Express + WebSocket | ❌ REDUNDANTE | ELIMINAR |
| **4041** | `server-websocket.js` | Gemini/Groq Conversacional | ❌ OBSOLETO | ELIMINAR |
| **4042** | `mcp-server/index.js` | MCP Server ✅ | ✅ MANTENER | - |
| **4777** | `server-pure.js` | QWEN Pure | ❌ OBSOLETO | ELIMINAR |
| **3000** | Posible Render | ❌ POSIBLE | VERIFICAR | - |

---

## 🔧 Cómo Eliminar Servidores

### Opción 1: Eliminar Archivos Innecesarios

```bash
# En la raíz del proyecto
rm server.js
rm server-websocket.js
rm server-pure.js
rm start-localhost-server.js
rm test-localhost-server.js

# Archivo cartesia (ya no lo usamos)
rm mcp-server/services/cartesia.js

echo "✅ Archivos innecesarios eliminados"
```

### Opción 2: Deshabilitarlos sin Borrar

Si prefieres mantenerlos "por si acaso":

```bash
# Crear archivo .disabled para ignorarlos
touch server.js.disabled
touch server-websocket.js.disabled
touch server-pure.js.disabled

# Renombrar cartesia
mv mcp-server/services/cartesia.js mcp-server/services/cartesia.js.UNUSED
```

---

## 🎯 Verificar Puertos en Uso

### Ver qué está corriendo (Windows CMD):
```cmd
netstat -ano | findstr :4040
netstat -ano | findstr :4041
netstat -ano | findstr :4042
netstat -ano | findstr :4777
```

### Ver qué está corriendo (Git Bash):
```bash
# Buscar procesos Node.js
ps aux | grep node
```

### Matar un proceso específico (Windows):
```cmd
# Cambiar PID por el número del proceso
taskkill /PID <PID> /F
```

### Matar un proceso específico (Linux/Mac):
```bash
kill -9 <PID>
```

---

## 📋 Checklist de Limpieza

- [ ] Verificar que solo `mcp-server/index.js` está corriendo (puerto 4042)
- [ ] Eliminar o renombrar archivos innecesarios
- [ ] Verificar que no hay procesos zombie en Visual Studio Code o Cursor
- [ ] Reiniciar máquina si hay procesos que no puedes matar
- [ ] Confirmar que la aplicación sigue funcionando solo con MCP en 4042

---

## 🚀 Lo que Ahora Funciona

Después de la limpieza, tu sistema será:

```
Cliente (Browser)
    ↓
MCP Server (4042) ✅ ÚNICA FUENTE DE VERDAD
    ├─ Deepgram (STT) - Transcripción
    ├─ Voz Estática (Sandra MP3) - Respuesta (CERO LATENCIA)
    └─ LLM (Groq/Gemini/OpenAI) - Procesamiento
```

**Ventajas:**
- ✅ Menos latencia (una menos capa)
- ✅ Menos consumo de RAM
- ✅ Menos puertos abiertos
- ✅ Más seguro
- ✅ Más fácil de mantener
- ✅ Voz estática = latencia predecible

---

## ⚠️ NO Elimines

```
✅ mcp-server/  - Lo necesitamos
✅ index.html  - Lo necesitamos
✅ assets/  - Lo necesitamos
✅ package.json - Lo necesitamos
✅ node_modules/ - Lo necesitamos
```

---

## 📝 Cambios Realizados Hoy

| Componente | Cambio |
|-----------|--------|
| **Cartesia API** | ❌ ELIMINADO - Reemplazado con voz estática |
| **StaticVoiceService** | ✅ CREADO - Sirve tu MP3 sin latencia |
| **Assets** | ✅ AGREGADO - `sandra-voice.mp3` (28KB) |
| **mcp-server/index.js** | ✅ ACTUALIZADO - Usa voz estática |
| **Rutas MCP** | ✅ ACTUALIZADAS - Todas usan `services.voice` |

---

## ✅ Próximo Paso

Una vez limpies los servidores:

1. **Reinicia MCP Server:**
   ```bash
   cd mcp-server
   npm start
   ```

2. **Prueba la llamada conversacional:**
   - DevTools (F12)
   - Click widget
   - Presiona micrófono
   - Habla: "Hola"
   - Verifica logs: `[VOICE] ✅ Voz estática Sandra retornada`

3. **Escucharás tu voz Sandra** con latencia mínima

---

## 🎁 Bonus: Render para Producción

Cuando subas a Render:
- Solo necesitas deployar `mcp-server/`
- No `server.js`, `server-websocket.js`, etc.
- Más rápido, más barato, menos latencia

