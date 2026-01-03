# ✅ Prompts Implementados - Sistema Dual

## 📋 Resumen

Se han implementado **dos prompts diferentes** para dos contextos distintos:

1. **Prompt para Chat de Texto** (`lib/systemPrompt.js`) - Prompt completo y detallado
2. **Prompt para Llamadas Conversacionales** (`src/services/voice-services.js`) - Prompt optimizado para voz en streaming

---

## 1. 📝 Prompt para Chat de Texto

**Ubicación:** `lib/systemPrompt.js`

**Uso:** Chat de texto donde el usuario puede leer mensajes largos y recordar información visualmente.

**Características:**
- ✅ Prompt completo y detallado
- ✅ Puede hacer múltiples preguntas en un solo mensaje
- ✅ Respuestas más largas (4-5 frases)
- ✅ Incluye todas las funciones y herramientas MCP
- ✅ Ejemplos de conversación completos
- ✅ Instrucciones detalladas para cada función

**Ventajas:**
- Evita tokens fragmentando la conversación
- El usuario puede leer y recordar toda la información
- Permite respuestas más completas y estructuradas

**Usado en:**
- `/api/sandra/chat-text.js` - Endpoint de chat de texto
- `/api/sandra/assistant.js` - Sistema de asistente con function calling

---

## 2. 🎙️ Prompt para Llamadas Conversacionales

**Ubicación:** `src/services/voice-services.js` (función `processMessage`)

**Uso:** Llamadas de voz en tiempo real (streaming) donde el usuario escucha y no puede ver el texto.

**Características:**
- ✅ Optimizado para voz en streaming
- ✅ Respuestas cortas (1-2 frases máximo)
- ✅ Preguntas secuenciales (una a la vez)
- ✅ Memoria contextual (recuerda lo que ya se ha preguntado)
- ✅ Saludo breve y natural
- ✅ No repite saludos después del inicial
- ✅ Evita ecos y repeticiones

**Ventajas:**
- No abruma al usuario con información
- Divide las preguntas de forma lógica
- Recuerda el contexto de la conversación
- Optimizado para voz (breve y natural)

**Usado en:**
- `src/websocket/socket-server.js` - Sistema de llamadas conversacionales en tiempo real
- Llamadas de voz con Deepgram STT + OpenAI GPT-4o-mini + Deepgram TTS

---

## 🔄 Diferencias Clave

| Aspecto | Chat de Texto | Llamadas Conversacionales |
|---------|---------------|---------------------------|
| **Longitud de respuestas** | 4-5 frases | 1-2 frases máximo |
| **Preguntas** | Múltiples a la vez | Una a la vez, secuencial |
| **Memoria** | El usuario puede leer | La IA debe recordar todo |
| **Saludo** | Completo y detallado | Breve y natural |
| **Funciones** | Todas explicadas | Solo mencionadas brevemente |
| **Ejemplos** | Conversaciones completas | Flujos sugeridos |

---

## 📍 Archivos Modificados

1. **`lib/systemPrompt.js`** - ✅ Ya contiene el prompt completo para chat de texto (sin cambios)
2. **`src/services/voice-services.js`** - ✅ Actualizado con el nuevo prompt conversacional optimizado para voz

---

## 🎯 Próximos Pasos

1. ✅ Ambos prompts están implementados y listos para usar
2. El prompt de chat de texto se usa automáticamente en `/api/sandra/chat-text.js`
3. El prompt conversacional se usa automáticamente en las llamadas de voz
4. El sistema detecta el contexto y usa el prompt apropiado

---

## 📝 Notas

- El prompt de chat de texto es el "antiguo" pero está perfecto para su contexto
- El prompt conversacional es el "nuevo" optimizado para voz
- Ambos mantienen las mismas funciones y capacidades
- La diferencia está en cómo se presentan las respuestas y preguntas
