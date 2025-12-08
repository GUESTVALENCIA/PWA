# IMPLEMENTACIÓN DIRECTA: Gemini Live API + Cartesia TTS

## PROTOCOLO GEMINI LIVE API (WebSocket)

### Endpoint WebSocket:
```
wss://generativelanguage.googleapis.com/v1beta/models/{MODEL}:streamGenerateContent?key={API_KEY}
```

### Modelos disponibles:
- `gemini-2.0-flash-exp`
- `gemini-2.5-flash-native-audio-preview-09-2025`

### Flujo de Mensajes:

1. **Conexión WebSocket**
2. **Mensaje de Setup** (primer mensaje):
```json
{
  "setup": {
    "model": "gemini-2.0-flash-exp",
    "generationConfig": {
      "responseModalities": ["TEXT"]  // Solo texto, no audio
    },
    "systemInstruction": {
      "parts": [{"text": "Instrucciones del sistema"}]
    }
  }
}
```

3. **Enviar Audio del Usuario**:
```json
{
  "clientContent": {
    "parts": [
      {
        "inlineData": {
          "mimeType": "audio/webm",
          "data": "base64_audio_data"
        }
      }
    ]
  }
}
```

4. **Recibir Respuesta de Texto**:
```json
{
  "serverContent": {
    "parts": [
      {
        "text": "Respuesta del modelo"
      }
    ]
  }
}
```

## IMPLEMENTACIÓN EN NODE.JS

### Función para conectar con Gemini Live API:

```javascript
const WebSocket = require('ws');

async function callGeminiLiveSTT(audioBase64, conversationHistory) {
  return new Promise((resolve, reject) => {
    const model = 'gemini-2.0-flash-exp';
    const wsUrl = `wss://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${GEMINI_API_KEY}`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.on('open', () => {
      // Enviar setup
      ws.send(JSON.stringify({
        setup: {
          model: model,
          generationConfig: {
            responseModalities: ["TEXT"]
          },
          systemInstruction: {
            parts: [{ text: GLOBAL_CONVERSATION_RULES }]
          }
        }
      }));
      
      // Enviar audio
      ws.send(JSON.stringify({
        clientContent: {
          parts: [{
            inlineData: {
              mimeType: "audio/webm",
              data: audioBase64
            }
          }]
        }
      }));
    });
    
    ws.on('message', (data) => {
      const response = JSON.parse(data);
      if (response.serverContent?.parts?.[0]?.text) {
        const text = response.serverContent.parts[0].text;
        ws.close();
        resolve(text);
      }
    });
    
    ws.on('error', reject);
  });
}
```

## INTEGRACIÓN CON CARTESIA TTS

Mantener la función `generateTTS()` existente que usa Cartesia con la voz de Sandra.

## FLUJO COMPLETO

1. Cliente envía audio → WebSocket servidor
2. Servidor → `callGeminiLiveSTT()` → Texto
3. Servidor → `generateTTS()` (Cartesia) → Audio
4. Servidor → WebSocket → Cliente

