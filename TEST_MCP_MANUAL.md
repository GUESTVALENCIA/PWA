# Prueba Manual del Servidor MCP - Paso a Paso

Este documento describe cómo probar el servidor MCP manualmente usando PowerShell.

## Prerequisitos

1. **Servidor MCP corriendo:**
   ```powershell
   npm run mcp
   ```

2. **Verificar que está funcionando:**
   Deberías ver en la consola:
   ```
   🚀 Servidor MCP Bastanteo escuchando en http://localhost:4042/mcp
   ⚠️ Autenticación DESHABILITADA (sólo recomendable en local).
   ```

## Opción 1: Usar el Script Automático

Ejecuta el script de prueba:

```powershell
.\TEST_MCP_SERVER.ps1
```

El script ejecutará todos los pasos automáticamente y mostrará los resultados.

## Opción 2: Pasos Manuales (PowerShell)

### Paso 1: Crear una sesión nueva

Abre PowerShell y ejecuta (copiar/pegar tal cual):

```powershell
$body = @{
  jsonrpc = "2.0"
  id      = 1
  method  = "tools/call"
  params  = @{
    name      = "bastanteo_start_session"
    arguments = @{
      user_id     = "test-local-1"
      locale      = "es-ES"
      llm_backend = "auto"
      context     = "luxury"
    }
  }
} | ConvertTo-Json -Depth 5

$resp = Invoke-RestMethod `
  -Uri "http://localhost:4042/mcp" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body

$resp | ConvertTo-Json -Depth 10
```

**Resultado esperado:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"session_id\":\"xxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx\",\"user_id\":\"test-local-1\", ... }"
      }
    ]
  }
}
```

### Paso 2: Extraer el session_id

El JSON de la sesión está como texto dentro de `result.content[0].text`. Ejecuta:

```powershell
$payload = $resp.result.content[0].text | ConvertFrom-Json

$payload       # Para verlo entero
$sessionId = $payload.session_id
$sessionId
```

**Resultado esperado:**
```
xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### Paso 3: Enviar mensaje a Sandra

Con ese `$sessionId`, ahora enviamos un mensaje:

```powershell
$body2 = @{
  jsonrpc = "2.0"
  id      = 2
  method  = "tools/call"
  params  = @{
    name      = "bastanteo_send_message"
    arguments = @{
      session_id = $sessionId
      message    = "Hola Sandra, preséntate en una frase corta y amable."
    }
  }
} | ConvertTo-Json -Depth 5

$resp2 = Invoke-RestMethod `
  -Uri "http://localhost:4042/mcp" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body2

$resp2 | ConvertTo-Json -Depth 10

$replyObj = $resp2.result.content[0].text | ConvertFrom-Json
$replyObj
$replyObj.reply
```

**Resultado esperado:**
Deberías ver la respuesta de Sandra en `$replyObj.reply`, algo como:

```
"Hola, soy Sandra, tu asistente experta en Hospitalidad y Turismo para GuestsValencia. ¿En qué puedo ayudarte?"
```

## Solución de Problemas

### Error: "No se puede conectar al servidor remoto"

**Causa:** El servidor MCP no está corriendo.

**Solución:**
```powershell
npm run mcp
```

### Error: "The remote server returned an error: (401)"

**Causa:** Autenticación requerida pero no se envió API key.

**Solución:**
- Si estás en local, verifica que `BASTANTEO_MCP_API_KEY` esté vacío en `.env`
- Si necesitas autenticación, añade el header:
  ```powershell
  $headers = @{
    "X-API-Key" = "tu-api-key-aqui"
  }
  
  $resp = Invoke-RestMethod `
    -Uri "http://localhost:4042/mcp" `
    -Method Post `
    -Headers $headers `
    -ContentType "application/json" `
    -Body $body
  ```

### Error: "Invalid JSON-RPC request"

**Causa:** El formato del JSON no es correcto.

**Solución:** Verifica que usas `-Depth 5` en `ConvertTo-Json` y que el formato coincide exactamente con el ejemplo.

## Pruebas Adicionales

### Listar todas las sesiones activas

```powershell
$body3 = @{
  jsonrpc = "2.0"
  id      = 3
  method  = "tools/call"
  params  = @{
    name      = "bastanteo_list_sessions"
    arguments = @{
      active_only = $true
      limit       = 10
    }
  }
} | ConvertTo-Json -Depth 5

$resp3 = Invoke-RestMethod `
  -Uri "http://localhost:4042/mcp" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body3

$resp3 | ConvertTo-Json -Depth 10
```

### Obtener estado de una sesión

```powershell
$body4 = @{
  jsonrpc = "2.0"
  id      = 4
  method  = "tools/call"
  params  = @{
    name      = "bastanteo_get_session_state"
    arguments = @{
      session_id = $sessionId  # Usa el session_id del Paso 2
    }
  }
} | ConvertTo-Json -Depth 5

$resp4 = Invoke-RestMethod `
  -Uri "http://localhost:4042/mcp" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body4

$state = $resp4.result.content[0].text | ConvertFrom-Json
$state | ConvertTo-Json -Depth 10
```

### Cerrar una sesión

```powershell
$body5 = @{
  jsonrpc = "2.0"
  id      = 5
  method  = "tools/call"
  params  = @{
    name      = "bastanteo_end_session"
    arguments = @{
      session_id  = $sessionId
      keep_history = $false
    }
  }
} | ConvertTo-Json -Depth 5

$resp5 = Invoke-RestMethod `
  -Uri "http://localhost:4042/mcp" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body5

$resp5 | ConvertTo-Json -Depth 10
```

## Siguiente Paso

Una vez que las pruebas locales funcionen:

1. ✅ Configurar `BASTANTEO_MCP_API_KEY` con una clave segura
2. ✅ Desplegar el servidor en staging
3. ✅ Configurar el conector MCP en ChatGPT Desktop/Web
4. ✅ Probar desde ChatGPT usando las herramientas MCP

