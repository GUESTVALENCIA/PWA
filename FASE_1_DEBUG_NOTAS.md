# 🔍 FASE 1: Debug - Objeto WebSocket siendo enviado

## 🐛 Problema

El servidor está enviando el objeto WebSocket completo al cliente en lugar de manejar los chunks PCM.

**Síntoma:**
```
payload: {
  "audio": {
    "type": "streaming",
    "ws": { ... objeto WebSocket completo ... }
  }
}
```

## 🔍 Análisis

El código de `handleInitialGreeting` **debería**:
1. Detectar `type === 'streaming'`
2. Manejar el WebSocket en el servidor
3. Enviar chunks PCM individuales (`tts_chunk`)
4. Hacer `return` temprano

**Pero el objeto WebSocket se está enviando de todas formas.**

## 🤔 Posibles Causas

1. **Código no desplegado**: El servidor en Render puede tener código antiguo
2. **Error en ejecución**: Algún error hace que se ejecute otra ruta
3. **Serialización automática**: Algo está serializando el objeto antes de tiempo
4. **Otro código interceptando**: Hay otro lugar que envía el objeto

## ✅ Solución Aplicada

1. ✅ Movido `handleGreetingFallback` fuera de la función
2. ✅ Agregadas validaciones adicionales
3. ✅ Agregados comentarios críticos sobre no enviar objetos WebSocket
4. ✅ Validación en cliente para rechazar objetos WebSocket

## 🎯 Próximos Pasos

1. **Verificar deploy**: Asegurarse de que el código actualizado esté en Render
2. **Revisar logs del servidor**: Ver qué está pasando en el servidor
3. **Verificar que no haya otro código**: Buscar otros lugares donde se envíe greeting

## 📝 Nota Importante

El código del cliente YA tiene validación para rechazar objetos WebSocket:
```javascript
if (audioBase64 && typeof audioBase64 === 'object' && audioBase64.type === 'streaming') {
  console.error('[AUDIO] ❌ ERROR: Received WebSocket object instead of audio data');
  return;
}
```

Esto está bien - el cliente rechaza el objeto. Pero necesitamos que el servidor NO lo envíe en primer lugar.
