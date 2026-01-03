# 🔍 INVESTIGACIÓN: Control de Voces Deepgram Aura

## Objetivo
Investigar cómo controlar velocidad, volumen y otros parámetros de las voces Aura de Deepgram desde la documentación oficial, sin hacer cambios experimentales que puedan dañar el sistema.

## Estado Actual
- ✅ Sistema funcionando con `aura-2-carina-es` (voz peninsular, IVR)
- ⚠️ Velocidad y volumen no se pueden ajustar experimentalmente
- ⚠️ Necesitamos documentación oficial antes de implementar cambios

## Preguntas a Investigar

### 1. Control de Velocidad (Speed/Rate)
- ¿Deepgram Aura soporta parámetros de velocidad?
- ¿Se controla vía query parameters en REST API?
- ¿Se requiere SSML?
- ¿Hay límites o valores recomendados?

### 2. Control de Volumen
- ¿Deepgram Aura soporta parámetros de volumen?
- ¿Se controla vía query parameters?
- ¿Se requiere configuración especial?

### 3. Otros Parámetros
- Pitch (tono)
- Pauses (pausas)
- Emphasis (énfasis)
- SSML support

## Recursos a Consultar

1. **Documentación Oficial Deepgram:**
   - https://developers.deepgram.com/docs/text-to-speech
   - https://developers.deepgram.com/docs/tts-api-reference
   - https://developers.deepgram.com/docs/tts-ssml

2. **API Reference:**
   - REST API: `POST /v1/speak`
   - Query parameters disponibles
   - Body format (text/plain vs JSON)

3. **Comunidad y Soporte:**
   - Deepgram Discord
   - GitHub Issues
   - Stack Overflow

## Notas
- NO implementar cambios experimentales
- Esperar documentación oficial antes de modificar
- El sistema actual funciona bien, solo necesita ajustes finos
