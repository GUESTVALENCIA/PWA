# ✅ CORRECCIÓN: Spam de Errores STT

## Problema

El error STT se estaba repitiendo infinitamente porque:
1. Cada chunk de audio intentaba crear una nueva conexión STT
2. La conexión fallaba inmediatamente
3. Se limpiaba el error state muy rápido (1 segundo)
4. El siguiente chunk intentaba crear conexión de nuevo
5. Ciclo infinito de errores

## Solución Implementada

1. **Prevenir creación de conexión si estamos en error state:**
   - Si el agente está en `sttErrorAgents` y no hay conexión, se salta el procesamiento del chunk
   - Esto evita intentar crear conexiones que sabemos que van a fallar

2. **Aumentar timeout de recuperación:**
   - Cambiado de 1 segundo → 5 segundos
   - Esto da más tiempo antes de intentar crear una nueva conexión
   - Previene spam de intentos fallidos

## Resultado

- ✅ Se evita spam de errores repetidos
- ✅ Se espera 5 segundos antes de intentar recuperación
- ✅ Los logs del servidor mostrarán el error real (sin spam)

## Próximo Paso

Revisar logs del servidor en Render para ver el error exacto que está causando que falle la conexión STT.
