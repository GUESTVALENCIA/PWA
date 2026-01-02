# 🔧 SOLUCIÓN: Error STT Deepgram

## Diagnóstico

El error STT ocurre **inmediatamente después de crear la conexión** (~200-250ms), indicando un problema de **autenticación o conectividad**.

## Error Pattern

```
1. createStreamingConnection() → ✅ Success
2. Connection ready state: 0 (CONNECTING)
3. ✅ Streaming connection established
4. ~200-250ms después → ErrorEvent (sin mensaje/código/stack)
5. Connection closed
```

## Posibles Causas y Soluciones

### 1. API Key Inválida o Expirada

**Síntoma:** ErrorEvent inmediato después de conectar

**Solución:**
- Verificar que `DEEPGRAM_API_KEY` en Render sea válida
- Verificar en el dashboard de Deepgram que la key no esté expirada
- Verificar que la key tenga permisos para STT streaming

**Cómo verificar:**
1. Ir a Deepgram Dashboard → API Keys
2. Verificar que la key existe y está activa
3. Probar con una nueva API key si es necesario

### 2. Problema de Conectividad desde Render

**Síntoma:** Timeout de conexión WebSocket

**Solución:**
- Verificar que Render no esté bloqueando conexiones WebSocket salientes
- Verificar conectividad de red desde Render

### 3. Problema con el SDK de Deepgram

**Síntoma:** El SDK no está enviando la API key correctamente

**Solución:**
- Verificar que el SDK está usando la API key correctamente
- Actualizar el SDK a la última versión si es necesario

## Cambios Implementados

1. ✅ Logging mejorado para capturar más detalles del ErrorEvent
2. ✅ Verificación de API key en el log de error
3. ✅ Captura de información adicional del ErrorEvent (target, currentTarget, etc.)

## Próximos Pasos

1. Revisar los logs mejorados para ver más detalles del error
2. Verificar la API key en el dashboard de Deepgram
3. Si el problema persiste, probar con una nueva API key
