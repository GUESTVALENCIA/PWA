# 🎚️ Sistema de Atención Dinámica de Volúmenes

## Problema Resuelto
El usuario reportó que el barge-in con cortes radicales es "horrible" y "de chat barato". Quiere un sistema como **WebRTC Realtime OpenAI** donde:
- **NO hay cortes** - solo ajuste suave de volúmenes
- **Atención dinámica**: quien habla tiene el volumen un poco más alto, el otro se baja
- **Conversación fluida**: ambos pueden hablar a la vez, se escuchan mutuamente

## Solución Implementada

### 1. Eliminación de `stop_audio` (Cortes Radicales)
**ANTES:**
- Servidor enviaba `stop_audio` cuando detectaba voz del usuario
- Cliente pausaba el audio de la IA abruptamente
- Resultado: Cortes desagradables, como "poner pausa a un botón"

**DESPUÉS:**
- Servidor envía `user_speaking` cuando detecta voz del usuario
- Cliente **NO pausa** el audio, solo ajusta volúmenes dinámicamente
- Resultado: Conversación fluida, sin cortes

### 2. Sistema de Atención Dinámica

#### Cuando el Usuario Habla:
- **Volumen de la IA**: Baja a **30%** (atención al usuario)
- **Volumen del usuario**: Normal (viene del micrófono)
- **Resultado**: El usuario tiene la atención, se escucha claramente

#### Cuando la IA Habla:
- **Volumen de la IA**: Normal (100%)
- **Si el usuario está hablando**: Volumen de la IA baja a **30%** (atención al usuario)
- **Resultado**: La IA habla, pero si el usuario interrumpe, se le da atención

#### Cuando Ambos Hablan a la Vez:
- **Volumen de la IA**: **30%** (atención al usuario)
- **Volumen del usuario**: Normal
- **Resultado**: Ambos se escuchan, pero el usuario tiene más atención

#### Cuando el Usuario Calla:
- **Volumen de la IA**: Restaurado a **100%** (atención a la IA)
- **Resultado**: La IA retoma el hilo de la conversación con volumen normal

### 3. Detección de Usuario Hablando/Parado

**Servidor (`socket-server.js`):**
- `onTranscriptionUpdated`: Detecta cuando hay interim (usuario hablando)
  - Envía `user_speaking` cuando el usuario empieza a hablar
  - Resetea timeout de 1 segundo cada vez que hay interim
- **Timeout de 1 segundo**: Si no hay interim por 1 segundo, envía `user_stopped`
  - Esto detecta cuando el usuario deja de hablar

**Cliente (`index.html`):**
- Recibe `user_speaking`: Baja volumen de la IA a 30%
- Recibe `user_stopped`: Restaura volumen de la IA a 100%
- **Sistema de barge-in local**: También detecta voz del usuario localmente y ajusta volúmenes

### 4. Comportamiento Esperado

#### Conversación Natural:
1. **Usuario habla** → Volumen IA: 30% → Usuario tiene atención
2. **Usuario calla** → Volumen IA: 100% → IA retoma con volumen normal
3. **IA habla** → Volumen IA: 100% (o 30% si usuario está hablando)
4. **Usuario interrumpe** → Volumen IA: 30% → Usuario tiene atención
5. **Ambos hablan** → Volumen IA: 30% → Ambos se escuchan, usuario tiene más atención

#### Sin Cortes:
- **NO se pausa** el audio de la IA
- **NO se corta** la conversación
- **Solo se ajustan volúmenes** dinámicamente
- **Resultado**: Conversación fluida, natural, como WebRTC Realtime OpenAI

## Archivos Modificados

### `src/websocket/socket-server.js`
- **Línea 1030-1042**: Reemplazado `stop_audio` por `user_speaking`
- **Línea 711-728**: Agregado `userSpeakingTimeout` y `isUserSpeaking` a `deepgramData`
- **Línea 1030-1075**: Implementado timeout de 1 segundo para detectar cuando el usuario calla

### `index.html`
- **Línea 1836-1870**: Reemplazado manejo de `stop_audio` por `user_speaking` y `user_stopped`
- **Línea 2319-2363**: Mejorado sistema de barge-in para atención dinámica
- **Línea 2425-2430**: Ajuste de volumen cuando la IA empieza a hablar si el usuario está hablando

## Notas Importantes

1. **NO hay pausas**: El audio de la IA nunca se pausa, solo se ajusta el volumen
2. **Atención dinámica**: Quien habla tiene más volumen (30% vs 100%)
3. **Detección automática**: El servidor detecta cuando el usuario habla/para automáticamente
4. **Doble detección**: Cliente también detecta localmente para respuesta más rápida
5. **Sin cortes**: Conversación fluida, natural, como una llamada real

## Resultado Final

- ✅ **Sin cortes radicales** - solo ajuste suave de volúmenes
- ✅ **Atención dinámica** - quien habla tiene más volumen
- ✅ **Conversación fluida** - ambos pueden hablar a la vez
- ✅ **Nivel WebRTC Realtime OpenAI** - calidad profesional
