# Recomendación: Nova 2 vs Nova 3

## Situación

- **JSON proporcionado:** `nova-3`
- **ChatGPT 5.2 Thinking:** Recomienda `nova-2` para "llamadas reales"
- **Error actual:** STT streaming error persiste con `nova-3`

## Análisis

### Nova-2
- ✅ Más estable, probado
- ✅ Recomendado por ChatGPT 5.2 para llamadas reales
- ✅ Puede resolver el error actual
- ❌ Modelo más antiguo

### Nova-3
- ✅ Más nuevo, potencialmente mejor calidad
- ✅ En el JSON del usuario
- ❌ Error persiste con este modelo
- ❌ Menos probado para llamadas reales

## Recomendación

**Usar `nova-2` primero** porque:
1. ChatGPT 5.2 lo recomendó específicamente para llamadas reales
2. El error persiste con nova-3
3. Nova-2 es más estable y probado
4. Podemos cambiar a nova-3 después si funciona bien

## Plan

1. Cambiar a `nova-2` en `src/services/voice-services.js`
2. Probar si resuelve el error STT
3. Si funciona, mantener nova-2
4. Si funciona bien, probar nova-3 después para comparar
