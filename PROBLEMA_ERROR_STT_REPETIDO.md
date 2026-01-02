# ⚠️ PROBLEMA: Error STT Repetido

## Situación

- ✅ Voz femenina (Agustina) funciona perfectamente
- ✅ Saludo funciona correctamente
- ❌ Error STT aparece repetidamente (muchas veces)
- ❌ Sistema no responde después del saludo porque STT está bloqueado

## Análisis

El error "STT streaming error" aparece muchas veces seguidas, lo que indica que:

1. La conexión STT se crea pero falla inmediatamente
2. Cada chunk de audio intenta crear nueva conexión
3. Todas las conexiones fallan inmediatamente
4. El ciclo se repite infinitamente

## Posibles Causas

1. **Problema con API Key de Deepgram**: La clave puede estar inválida o expirada
2. **Problema con formato de audio**: El formato de audio enviado puede no ser compatible
3. **Problema con configuración de Deepgram**: Las opciones de configuración pueden estar causando el error
4. **Problema de red/conexión**: Problemas de conectividad con Deepgram API
5. **Límite de rate limit**: Demasiadas conexiones creadas rápidamente

## Acción Requerida

Revisar logs del servidor en Render para ver el error exacto que está ocurriendo cuando se crea la conexión STT.
