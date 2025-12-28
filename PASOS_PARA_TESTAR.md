# 🚀 PASOS PARA TESTAR LA LLAMADA CONVERSACIONAL

## Estado Actual
- ✅ Deepgram STT: Validación HTTP mejorada
- ✅ Cartesia TTS: Validación HTTP + timeout + logging
- ✅ Cliente: Logging agresivo para debugging
- ✅ MIME type audio: Corregido a audio/mpeg
- ✅ Assets (manifest, icons): Creados

## Pasos para Activar

### Paso 1: DETÉN el servidor MCP actual
```bash
# Si está corriendo, presiona Ctrl+C
```

### Paso 2: REINICIA el servidor MCP CON los cambios nuevos
```bash
cd mcp-server
npm start
```

Espera a ver:
```
✅ Escuchando en puerto 4042
```

### Paso 3: LIMPIA caché del navegador
```
Ctrl+Shift+Del
→ Selecciona "Cached images and files"
→ "Clear data"
```

### Paso 4: RECARGA la página
```
http://localhost:4042
Ctrl+F5
```

Verifica que aparezca en Console:
```
✅ WebSocket conectado
```

## Pasos para Probar Llamada

### 1. Abre DevTools (F12)
   - Ve a Consola (Console)
   - Busca los logs [AUDIO], [MCP], [DEEPGRAM], [CARTESIA]

### 2. Haz clic en el widget (abajo derecha)

### 3. Presiona el botón de micrófono

### 4. Habla CLARAMENTE (mínimo 2 segundos)
   - "Hola, ¿cómo estás?"
   - "¿Qué hora es?"
   - etc.

### 5. VERIFICA estos logs EN ORDEN:

```
✅ [DEEPGRAM] HTTP 200 response
✅ [DEEPGRAM] Sending XXX bytes to Deepgram API
✅ [DEEPGRAM] Audio buffer recibido: XXXX bytes
✅ [MCP] Audio transcrito: "tu texto aquí"

✅ [CARTESIA] HTTP 200 response
✅ [CARTESIA] Audio buffer recibido: XXXX bytes
✅ [MCP] ✅ Recibida respuesta de audio TTS

✅ [AUDIO] playAudioResponse called with isWelcome: false, audioBase64 length: XXXX
✅ [AUDIO] atob decodificado: XXXX caracteres
✅ [AUDIO] Blob creado: {size: XXXX, type: 'audio/mpeg'}
✅ [AUDIO] ▶️  Reproduciendo audio normal...
✅ [AUDIO] ✅ Audio reproduciéndose
✅ Audio reproduce
```

## Si Algo Falla

### "Respuesta inválida de Deepgram"
Busca en logs:
```
[DEEPGRAM] HTTP 400/401/500 (no 200)
```
**Causa:** API key inválido o problema de audio
**Solución:** Verifica `DEEPGRAM_API_KEY` en mcp-server/.env

### "Audio play error: NotSupportedError"
Busca en logs:
```
[AUDIO] Audio base64 muy pequeño
[AUDIO] Error decodificando base64
[AUDIO] ❌ play(): XXXXX
[AUDIO] ❌ Error evento de audio:
```
**Si ves:** "Audio base64 muy pequeño"
→ Deepgram no retorna audio, verifica API key

**Si ves:** "Error decodificando base64"
→ Cartesia retorna algo que no es válido

**Si ves:** "NotSupportedError"
→ Audio file format problema (ya debería estar arreglado)

### "Cartesia API error (HTTP 401)"
**Causa:** API key inválido
**Solución:** Verifica `CARTESIA_API_KEY` en mcp-server/.env

### "No se detectó habla"
**Causa:** Audio capturado pero Deepgram dice que está vacío
**Solución:** Habla más fuerte y claro

## ¿Qué Esperar?

Si TODO funciona:

1. **Widget muestra "Listening..."**
2. **Console muestra logs [DEEPGRAM]** - "Audio buffer recibido: XXXX bytes"
3. **Console muestra logs [MCP]** - "Audio transcrito: tu texto"
4. **Console muestra logs [CARTESIA]** - "Audio buffer recibido: XXXX bytes"
5. **Widget muestra respuesta de Sandra**
6. **Audio se reproduce** sin "NotSupportedError"

## Reset Completo si Algo Está Muy Mal

```bash
# 1. Detén servidor
Ctrl+C

# 2. Limpia node_modules si hay problema
rm -rf mcp-server/node_modules
rm -rf node_modules

# 3. Reinstala
cd mcp-server
npm install
cd ..
npm install

# 4. Reinicia
cd mcp-server
npm start
```

## Contacto si Falla

Si después de seguir estos pasos sigue sin funcionar:
1. Comparte los EXACTOS logs de console (todo lo que diga [AUDIO], [DEEPGRAM], [CARTESIA])
2. Verifica que APIs keys están en mcp-server/.env
3. Verifica que puerto 4042 está libre
4. Verifica que puedes acceder a http://localhost:4042 en navegador

---

**IMPORTANTE:** El sistema ahora tiene logging tan detallado que podemos ver EXACTAMENTE dónde falla. Si algo no funciona, los logs dirán qué es.

