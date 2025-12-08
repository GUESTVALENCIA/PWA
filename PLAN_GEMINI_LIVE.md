# PLAN DE IMPLEMENTACIÓN: Gemini Live API

## ANÁLISIS DEL PROBLEMA ACTUAL

### Sistema Actual (Problemático):
```
Usuario → Audio → Deepgram STT → Texto → Gemini LLM → Texto → Cartesia TTS → Audio → Usuario
```

**Problemas:**
- 3 llamadas API separadas (latencia alta)
- Posibles conflictos entre sistemas
- Errores 429 de rate limiting
- Complejidad innecesaria

### Sistema Recomendado (Gemini Live):
```
Usuario → Audio → Gemini Live API → Audio → Usuario
         (STT + LLM + TTS integrados)
```

**Ventajas:**
- 1 sola llamada API (latencia ~1 segundo)
- Sistema nativo de Google
- Sin conflictos entre servicios
- Diseñado específicamente para llamadas conversacionales

## GEMINI LIVE API - INFORMACIÓN

### Características:
- **STT integrado**: Reconocimiento de voz en tiempo real
- **TTS integrado**: Síntesis de voz en tiempo real  
- **LLM integrado**: Generación de respuestas
- **Latencia baja**: ~1 segundo
- **Audio bidireccional**: Streaming WebSocket
- **Barge-in**: Soporte para interrupciones
- **VAD integrado**: Detección de actividad de voz

### Modelos disponibles:
- `gemini-2.0-flash-exp` (recomendado)
- `gemini-2.5-flash-native-audio-preview-09-2025` (más reciente)

### Documentación oficial:
- https://ai.google.dev/gemini-api/docs/live

## OPCIONES DE IMPLEMENTACIÓN

### OPCIÓN 1: Gemini Live API Directo (WebSocket)
**Ventajas:**
- Integración directa sin dependencias adicionales
- Control total del flujo
- Mantiene nuestra arquitectura actual

**Desventajas:**
- Requiere implementar el protocolo WebSocket de Gemini Live
- Más trabajo de integración

### OPCIÓN 2: LiveKit Agents + Gemini Live
**Ventajas:**
- Integración ya hecha y probada
- Framework completo para agentes de voz
- Documentación completa

**Desventajas:**
- Requiere migrar a LiveKit Agents
- Dependencia adicional

### OPCIÓN 3: Mantener Deepgram + Optimizar
**Ventajas:**
- No requiere cambios mayores
- Ya está funcionando parcialmente

**Desventajas:**
- Latencia alta
- Errores 429 continuos
- No es la solución óptima

## RECOMENDACIÓN

**OPCIÓN 1: Implementar Gemini Live API Directo**

Razones:
1. Sistema nativo de Google para Gemini
2. Latencia mínima (~1 segundo)
3. Integración completa (STT + LLM + TTS)
4. Menos errores de rate limiting
5. Diseñado específicamente para llamadas conversacionales
6. Mantiene nuestra arquitectura actual

## PLAN DE IMPLEMENTACIÓN

### FASE 1: Investigación
1. Revisar documentación oficial de Gemini Live API
2. Entender el protocolo WebSocket de Gemini Live
3. Verificar compatibilidad con nuestro sistema actual

### FASE 2: Implementación
1. Crear función para conectar con Gemini Live API
2. Implementar streaming de audio bidireccional
3. Reemplazar Deepgram STT + Cartesia TTS con Gemini Live
4. Mantener Gemini LLM integrado en el mismo flujo

### FASE 3: Testing
1. Probar latencia
2. Verificar calidad de audio
3. Validar barge-in
4. Asegurar estabilidad

## PRÓXIMOS PASOS INMEDIATOS

1. **Revisar documentación oficial de Gemini Live API**
2. **Implementar conexión WebSocket con Gemini Live**
3. **Reemplazar flujo actual (Deepgram + Cartesia) con Gemini Live**
4. **Mantener ringtone profesional ya implementado**

