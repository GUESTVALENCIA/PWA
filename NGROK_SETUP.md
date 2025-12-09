# Guía: Exponer Servidor MCP con Ngrok y Conectar a ChatGPT Desktop

## 🎯 Objetivo
Exponer temporalmente el servidor MCP (localhost:4042) a Internet usando ngrok para poder conectarlo con ChatGPT Desktop/Web.

---

## 📋 Paso 1: Instalar ngrok

### Opción A: Descarga directa
1. Ve a: https://ngrok.com/download
2. Descarga la versión para Windows
3. Extrae `ngrok.exe` en una carpeta (ejemplo: `C:\ngrok\`)
4. Opcional: Añade la carpeta al PATH del sistema

### Opción B: Con Chocolatey (si lo tienes instalado)
```powershell
choco install ngrok
```

### Opción C: Con Scoop (si lo tienes instalado)
```powershell
scoop install ngrok
```

---

## 🔑 Paso 2: Configurar ngrok (solo una vez)

**✅ Ngrok ya está instalado** (versión 3.34.0 - actualizado)

1. **Obtén tu Authtoken:**
   - Ve a: https://dashboard.ngrok.com/signup (si no tienes cuenta)
   - Luego ve a: https://dashboard.ngrok.com/get-started/your-authtoken
   - Copia el token (algo como: `2abc123def456ghi789jkl012mno345pqr678stu`)

2. **Configura ngrok en tu máquina:**
   
   **Opción A - Script automatizado:**
   ```powershell
   .\start-ngrok.ps1 -AuthToken TU_TOKEN_AQUI
   ```
   
   **Opción B - Comando manual:**
   ```powershell
   ngrok config add-authtoken TU_TOKEN_AQUI
   ```
   
   Reemplaza `TU_TOKEN_AQUI` con el token que copiaste.

   ✅ Verás: `Authtoken saved to configuration file: C:\Users\TU_USUARIO\AppData\Local\ngrok\ngrok.yml`

---

## 🚀 Paso 3: Iniciar el túnel

### Requisitos previos:
1. ✅ El servidor MCP debe estar corriendo:
   ```powershell
   npm run mcp
   ```
   Debes ver: `🚀 Servidor MCP Bastanteo escuchando en http://localhost:4042/mcp`

### Abrir túnel con ngrok:

**Opción A - Script automatizado (recomendado):**
```powershell
.\start-ngrok.ps1
```

**Opción B - Comando manual:**
En una **nueva ventana de PowerShell** (deja el servidor corriendo):
```powershell
ngrok http 4042
```

### Salida esperada:

```
ngrok                                                                   

Session Status                online
Account                       Tu Email
Version                       3.x.x
Region                        United States (us)
Latency                       45ms
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123xyz.ngrok-free.app -> http://localhost:4042

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**✅ IMPORTANTE:** Anota la URL de `Forwarding`:
- Ejemplo: `https://abc123xyz.ngrok-free.app`
- **Tu endpoint MCP será:** `https://abc123xyz.ngrok-free.app/mcp`

**Alternativa - Obtener URL automáticamente:**
En otra ventana PowerShell (con ngrok corriendo):
```powershell
.\get-ngrok-url.ps1
```
Este script obtendrá la URL directamente de la API de ngrok.

---

## 🧪 Paso 4: Probar el túnel

Antes de conectar con ChatGPT, verifica que el túnel funciona.

En otra ventana de PowerShell, ejecuta:

```powershell
# Reemplaza abc123xyz con tu URL de ngrok
$url = "https://abc123xyz.ngrok-free.app/mcp"

$body = @{
  jsonrpc = "2.0"
  id      = 1
  method  = "tools/call"
  params  = @{
    name      = "bastanteo_start_session"
    arguments = @{
      user_id = "test-ngrok"
    }
  }
} | ConvertTo-Json -Depth 5

$resp = Invoke-RestMethod -Uri $url -Method Post -ContentType "application/json" -Body $body
$resp | ConvertTo-Json -Depth 10
```

✅ Si ves una respuesta con `session_id`, el túnel funciona correctamente.

⚠️ **Nota:** La primera vez puede pedirte verificar en el navegador (página de ngrok). Haz clic en "Visit Site" si aparece.

---

## 🤖 Paso 5: Configurar ChatGPT Desktop/Web

### 5.1. Abrir configuración de Connectors

1. Abre **ChatGPT Desktop** o ve a **chat.openai.com**
2. Ve a: **Settings** → **Apps & Connectors** → **Connectors**
3. Haz clic en **"Create"** o **"Add"**

### 5.2. Configurar el conector MCP

Rellena los siguientes campos:

| Campo | Valor |
|-------|-------|
| **Name** | `Bastanteo Conversacional` |
| **Description** | `Sistema conversacional de Bastanteo/BAPA con Sandra IA. Permite crear sesiones de conversación, enviar mensajes y recibir respuestas del motor conversacional que soporta múltiples backends LLM (GPT-4o, Gemini, Groq).` |
| **URL** | `https://TU_URL_NGROK.ngrok-free.app/mcp` |
| **Auth Type** | `Header` |
| **Header Name** | `X-API-Key` |
| **Header Value** | *(Deja vacío por ahora, o pon el valor de `BASTANTEO_MCP_API_KEY` si lo configuraste)* |

**Ejemplo de URL:**
```
https://abc123xyz.ngrok-free.app/mcp
```

### 5.3. Guardar y activar

1. Haz clic en **"Save"** o **"Create"**
2. El conector debería aparecer como activo
3. En un chat nuevo, verifica que el conector esté seleccionado/enabled

---

## 🎉 Paso 6: Probar desde ChatGPT

Una vez configurado, prueba con ChatGPT:

**Ejemplo de mensaje a ChatGPT:**
```
Usa la herramienta bastanteo_start_session para crear una nueva sesión de conversación con Sandra.
```

O más directo:
```
Crea una sesión en Bastanteo y envía el mensaje "Hola Sandra, preséntate" a Sandra.
```

ChatGPT debería:
1. Usar `bastanteo_start_session` para crear una sesión
2. Usar `bastanteo_send_message` para enviar el mensaje
3. Mostrarte la respuesta de Sandra

---

## ⚠️ Limitaciones de ngrok Free

- **URL temporal:** La URL cambia cada vez que reinicias ngrok (a menos que uses plan de pago)
- **Límite de conexiones:** Plan gratuito tiene límites
- **Advertencia de ngrok:** Primera conexión puede mostrar página de advertencia

---

## 🔧 Solución de Problemas

### Problema: "No es posible conectar con el servidor remoto"
- ✅ Verifica que `npm run mcp` esté corriendo
- ✅ Verifica que ngrok esté corriendo (`ngrok http 4042`)
- ✅ Verifica que uses la URL correcta: `https://TU_URL/mcp` (con `/mcp` al final)

### Problema: Página de advertencia de ngrok
- ✅ Es normal la primera vez, haz clic en "Visit Site"
- ✅ Para producción, usa dominio propio con SSL

### Problema: ChatGPT no encuentra las herramientas
- ✅ Verifica que la URL termine en `/mcp`
- ✅ Verifica que el servidor MCP responda a `initialize` y `tools/list`
- ✅ Revisa la consola de ngrok (http://127.0.0.1:4040) para ver las peticiones

### Problema: Error 401/403
- ✅ Si configuraste `BASTANTEO_MCP_API_KEY`, asegúrate de ponerla en el header `X-API-Key`
- ✅ Si no configuraste API key, déjala vacía en ChatGPT

---

## 📝 Notas Importantes

1. **Mantén ambos servicios corriendo:**
   - Ventana 1: `npm run mcp` (servidor MCP)
   - Ventana 2: `ngrok http 4042` (túnel público)

2. **URL de ngrok cambia:**
   - Cada vez que reinicias ngrok, obtienes una nueva URL
   - Necesitarás actualizar la configuración en ChatGPT
   - Para URL fija, considera el plan de pago de ngrok o usa Cloudflare Tunnel

3. **Para producción:**
   - Usa dominio propio: `https://api-staging.guestsvalencia.es/bastanteo/mcp`
   - Configura SSL con Let's Encrypt
   - Configura `BASTANTEO_MCP_API_KEY` con una clave segura

---

## ✅ Checklist

- [ ] ngrok instalado
- [ ] ngrok configurado con authtoken
- [ ] Servidor MCP corriendo (`npm run mcp`)
- [ ] Túnel ngrok activo (`ngrok http 4042`)
- [ ] URL del túnel anotada
- [ ] Túnel probado con PowerShell/curl
- [ ] Connector configurado en ChatGPT
- [ ] Primera prueba exitosa desde ChatGPT

---

## 🚀 Siguiente Paso: Staging

Una vez verificado que funciona con ngrok, puedes proceder a:
1. Configurar dominio staging: `api-staging.guestsvalencia.es`
2. Configurar SSL (Let's Encrypt)
3. Desplegar servidor MCP en servidor de staging
4. Configurar `BASTANTEO_MCP_API_KEY` en producción
5. Actualizar conector en ChatGPT con URL definitiva

