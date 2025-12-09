# Configuración del Conector MCP en ChatGPT Desktop/Web

## ✅ Estado Actual

- ✅ Servidor MCP corriendo en `localhost:4042`
- ✅ Ngrok túnel activo
- ✅ URL pública: `https://officious-kam-unimpressible.ngrok-free.dev/mcp`

---

## 📋 Paso 1: Abrir Configuración de ChatGPT

### ChatGPT Desktop:
1. Abre ChatGPT Desktop
2. Haz clic en tu **perfil/avatar** (esquina inferior izquierda)
3. Selecciona **"Settings"** o **"Configuración"**
4. Ve a **"Apps & Connectors"** o **"Apps y Conectores"**
5. Haz clic en **"Connectors"** o **"Conectores"**
6. Haz clic en **"Create"** o **"Crear"**

### ChatGPT Web (chat.openai.com):
1. Ve a: https://chat.openai.com
2. Haz clic en tu **perfil** (esquina inferior izquierda)
3. Selecciona **"Settings"**
4. Ve a **"Apps & Connectors"** → **"Connectors"**
5. Haz clic en **"Create"**

---

## 🔧 Paso 2: Configurar el Conector

Rellena los siguientes campos en el formulario:

| Campo | Valor a usar |
|-------|--------------|
| **Name** | `Bastanteo Conversacional` |
| **Description** | `Sistema conversacional de Bastanteo/BAPA con Sandra IA. Permite crear sesiones de conversación, enviar mensajes y recibir respuestas del motor conversacional que soporta múltiples backends LLM (GPT-4o, Gemini, Groq).` |
| **URL** | `https://officious-kam-unimpressible.ngrok-free.dev/mcp` |
| **Auth Type** | Selecciona: `Header` |
| **Header Name** | `X-API-Key` |
| **Header Value** | *(Deja vacío por ahora - no tienes API key configurada en local)* |

**Nota importante:** Si más adelante configuras `BASTANTEO_MCP_API_KEY` en producción, deberás poner ese valor en **Header Value**.

---

## 💾 Paso 3: Guardar y Activar

1. Haz clic en **"Save"** o **"Guardar"**
2. El conector debería aparecer como **activo/enabled**
3. Verifica que el conector esté marcado/activado en la lista

---

## 🧪 Paso 4: Probar el Conector

### Opción A: Prueba Simple
En un chat nuevo, escribe:
```
Crea una sesión en Bastanteo y envía el mensaje "Hola Sandra, preséntate" a Sandra.
```

### Opción B: Prueba Detallada
```
Usa la herramienta bastanteo_start_session para crear una nueva sesión de conversación con Sandra. Luego usa bastanteo_send_message para enviarle el mensaje "Hola, ¿cómo estás?" y muéstrame la respuesta.
```

---

## ✅ Verificación

ChatGPT debería:
1. ✅ Usar `bastanteo_start_session` para crear una sesión
2. ✅ Extraer el `session_id` de la respuesta
3. ✅ Usar `bastanteo_send_message` para enviar el mensaje
4. ✅ Mostrarte la respuesta de Sandra

**Ejemplo de respuesta esperada:**
```
He creado una sesión en Bastanteo y enviado tu mensaje a Sandra. 

Sandra responde:
"Hola, soy Sandra, su asistente experta en Hospitalidad y Turismo de lujo para Guests Valencia. ¿En qué puedo ayudarte hoy?"
```

---

## ⚠️ Notas Importantes

### URL de ngrok cambia:
- Cada vez que reinicias ngrok, obtienes una nueva URL
- Si reinicias ngrok, ejecuta: `.\get-ngrok-url.ps1`
- Actualiza la URL en la configuración del conector en ChatGPT

### Mantener servicios activos:
1. **Servidor MCP:** Debe estar corriendo (`npm run mcp`)
2. **Ngrok:** Debe estar corriendo (`ngrok http 4042`)
3. **ChatGPT:** Debe tener el conector activo

### Si el conector no funciona:
1. Verifica que el servidor MCP esté corriendo: `netstat -ano | findstr :4042`
2. Verifica que ngrok esté activo: `.\get-ngrok-url.ps1`
3. Prueba el endpoint directamente: `.\TEST_NGROK.ps1 -NgrokUrl "TU_URL_NGROK"`
4. Revisa la consola del servidor MCP para ver errores
5. Revisa la interfaz web de ngrok: http://127.0.0.1:4040

---

## 🚀 Para Producción

Cuando migres a staging/producción:

1. **URL cambiará a:**
   ```
   https://api-staging.guestsvalencia.es/bastanteo/mcp
   ```

2. **Configurar API Key:**
   - Configura `BASTANTEO_MCP_API_KEY` en el servidor
   - Actualiza el **Header Value** en ChatGPT con esa API key

3. **Actualizar conector:**
   - Edita el conector en ChatGPT
   - Cambia la URL a la nueva
   - Añade el Header Value con la API key

---

## 📊 Resumen de URLs

| Ambiente | URL del Endpoint |
|----------|------------------|
| **Local (ngrok)** | `https://officious-kam-unimpressible.ngrok-free.dev/mcp` |
| **Staging** | `https://api-staging.guestsvalencia.es/bastanteo/mcp` |
| **Producción** | `https://api.guestsvalencia.es/bastanteo/mcp` |

**URL actual activa:** `https://officious-kam-unimpressible.ngrok-free.dev/mcp`

---

## ✅ Checklist Final

- [ ] Servidor MCP corriendo (`npm run mcp`)
- [ ] Ngrok túnel activo
- [ ] Conector creado en ChatGPT
- [ ] URL configurada correctamente
- [ ] Primer mensaje de prueba enviado
- [ ] Respuesta de Sandra recibida

**¡Todo listo para usar Bastanteo desde ChatGPT!** 🎉

