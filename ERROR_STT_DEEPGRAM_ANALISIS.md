# 🔍 ANÁLISIS: Error STT Deepgram

## Problema Identificado

El error STT ocurre **inmediatamente después de establecer la conexión** (~200-250ms), lo que indica un problema de **autenticación o conectividad** con Deepgram.

## Patrón del Error

```
1. Se crea la conexión Deepgram
2. Ready state: 0 (CONNECTING)
3. ✅ Streaming connection established
4. ~200-250ms después → ErrorEvent sin mensaje/código/stack
5. Connection closed
```

## Posibles Causas

1. **API Key inválida o expirada**
   - El cliente se inicializa correctamente (no falla en createClient)
   - Pero la conexión WebSocket falla al autenticarse

2. **Problema de red desde Render a Deepgram**
   - Timeout de conexión
   - Firewall bloqueando conexiones WebSocket

3. **Problema con la URL o endpoint de Deepgram**
   - La URL del WebSocket podría estar incorrecta

4. **Problema con el formato de autenticación en el SDK**
   - El SDK podría no estar enviando la API key correctamente

## ErrorEvent sin Detalles

El `ErrorEvent` no tiene `message`, `code` o `stack`, lo cual es típico de errores de WebSocket de bajo nivel. Esto dificulta el diagnóstico.

## Soluciones a Intentar

1. **Verificar API Key**: Confirmar que `DEEPGRAM_API_KEY` es válida y no está expirada
2. **Verificar logs de Deepgram**: Revisar si hay errores de autenticación en el dashboard
3. **Probar con una API key diferente**: Para descartar problemas de la key actual
4. **Mejorar logging**: Capturar más información del ErrorEvent (target, currentTarget, etc.)
5. **Verificar conectividad**: Probar conexión a Deepgram desde Render
