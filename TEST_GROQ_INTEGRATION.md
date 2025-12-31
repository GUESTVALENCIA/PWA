# 🧪 TEST DE INTEGRACIÓN CON GROQ

## Cambios Realizados

### 1. **Prioridad de IA cambiada a Groq**
- ✅ Cambiado `PREFERRED_AI_PROVIDER` default de `'gemini'` a `'groq'`
- ✅ Groq es ahora el primer proveedor intentado
- ✅ Modelo usado: `qwen2.5-72b-instruct`

### 2. **Manejo de errores mejorado en el widget**
- ✅ Errores del servidor ahora se muestran en el chat widget
- ✅ Logs de errores más informativos

## Para Probar la Integración

### Paso 1: Desplegar el código al servidor

Los cambios están listos pero necesitan ser desplegados a Render:

```bash
git add .
git commit -m "feat: Integrar Groq como proveedor de IA prioritario para voz"
git push origin main
```

Render hará auto-deploy automáticamente si está configurado.

### Paso 2: Verificar variables de entorno en Render

Asegurar que estas variables estén configuradas:
- `GROQ_API_KEY` ✅ (requerido)
- `DEEPGRAM_API_KEY` ✅ (requerido para STT)
- `CARTESIA_API_KEY` ✅ (requerido para TTS)
- `CARTESIA_VOICE_ID=sandra` ✅ (opcional, default: sandra)
- `PREFERRED_AI_PROVIDER=groq` ✅ (opcional, ahora default: groq)

### Paso 3: Probar el flujo completo

1. **Conectar el widget** → WebSocket debe conectarse
2. **Enviar mensaje "ready"** → Servidor debe enviar saludo inicial ✅ (ya funciona)
3. **Hablar al micrófono** → Servidor debe:
   - Transcribir con Deepgram
   - Procesar con Groq (Qwen 2.5)
   - Generar TTS con Cartesia
   - Enviar audio de vuelta

### Paso 4: Verificar logs

En la consola del navegador, buscar:
- ✅ `[MCP] ✅ Recibida respuesta de audio TTS` → Audio recibido
- ✅ `[AUDIO] ✅ Audio finalizado` → Audio reproducido
- ❌ `Voice services not configured` → Servidor no tiene código desplegado
- ❌ `Deepgram Error: 400` → Problema con formato de audio

## Problemas Conocidos

### 1. "Voice services not configured"
**Causa:** El código nuevo aún no está desplegado en Render
**Solución:** Hacer commit y push, esperar deploy

### 2. "Deepgram Error: corrupt or unsupported data"
**Causa:** El formato de audio puede estar incorrecto
**Nota:** Esto podría resolverse cuando el código esté desplegado correctamente

## Flujo Esperado (cuando esté desplegado)

```
Usuario habla
  ↓
[MCP] Audio enviado como JSON base64
  ↓
Servidor recibe → handleAudioSTT()
  ↓
Deepgram STT → "Hola Sandra"
  ↓
Groq (Qwen 2.5) → "¡Hola! ¿En qué puedo ayudarte?"
  ↓
Cartesia TTS → base64Audio
  ↓
Servidor envía {route: 'audio', action: 'tts', payload: {...}}
  ↓
Widget recibe → playAudioResponse()
  ↓
Usuario escucha respuesta ✅
```

## Estado Actual

- ✅ Código listo y sin errores de sintaxis
- ✅ Groq configurado como prioritario
- ⏳ Esperando deploy a Render
- ⏳ Esperando prueba completa

## Próximos Pasos

1. Desplegar código a Render (commit + push)
2. Verificar que servicios de voz se inicialicen correctamente
3. Probar flujo completo de voz
4. Verificar que Groq responda correctamente
5. Confirmar que el widget reproduce el audio
