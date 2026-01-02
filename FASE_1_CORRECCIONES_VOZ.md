# 🔧 FASE 1: Correcciones - Voz Femenina + STT

## 🐛 Problemas Identificados

1. **Voz Masculina** - Usando `aura-2-nestor-es` (masculino) en lugar de voz femenina
2. **Error STT Streaming** - Error en conexión STT que bloquea respuestas
3. **No responde** - Probablemente porque STT está fallando

## ✅ Correcciones Aplicadas

### 1. Cambio de Voz a Femenina

**Modelo cambiado:** `aura-2-nestor-es` → `aura-2-carina-es`

**Archivos modificados:**
- ✅ `src/services/voice-services.js` - Default model cambiado
- ✅ `src/websocket/socket-server.js` - Todos los lugares donde se especifica model

**Modelo nuevo:** `aura-2-carina-es` (femenina peninsular española)

### 2. Error STT Streaming

**Problema:** Error "STT streaming error" bloquea las respuestas

**Necesita investigación adicional** - Revisar logs del servidor para entender el error exacto

## 📝 Modelos de Voz Disponibles (Deepgram)

- `aura-2-nestor-es` - Masculino peninsular
- `aura-2-carina-es` - **Femenino peninsular** ✅ (Elegido)
- `aura-2-silvia-es` - Femenino peninsular (alternativa)

## 🎯 Próximos Pasos

1. ✅ Voz cambiada a femenina
2. ⚠️ Investigar error STT streaming
3. ⚠️ Verificar que responda correctamente
