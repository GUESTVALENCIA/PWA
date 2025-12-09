# Script de Prueba del Servidor MCP a través de ngrok
# Ejecutar después de tener ngrok corriendo con: ngrok http 4042

param(
    [Parameter(Mandatory=$true)]
    [string]$NgrokUrl
)

Write-Host "PRUEBA DEL SERVIDOR MCP A TRAVES DE NGROK" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "URL de ngrok: $NgrokUrl" -ForegroundColor Yellow
Write-Host ""

# Construir URL completa del endpoint MCP
$mcpUrl = "$NgrokUrl/mcp"
if ($NgrokUrl.EndsWith("/")) {
    $mcpUrl = "${NgrokUrl}mcp"
}

Write-Host "Endpoint MCP: $mcpUrl" -ForegroundColor Gray
Write-Host ""

# PASO 1: Crear sesion
Write-Host "PASO 1: Creando sesion..." -ForegroundColor Yellow

$body = @{
  jsonrpc = "2.0"
  id      = 1
  method  = "tools/call"
  params  = @{
    name      = "bastanteo_start_session"
    arguments = @{
      user_id     = "test-ngrok"
      locale      = "es-ES"
      llm_backend = "auto"
      context     = "luxury"
    }
  }
} | ConvertTo-Json -Depth 5

try {
  Write-Host "Enviando peticion a $mcpUrl..." -ForegroundColor Gray
  $resp = Invoke-RestMethod -Uri $mcpUrl -Method Post -ContentType "application/json" -Body $body
  Write-Host "Respuesta recibida:" -ForegroundColor Green
  $resp | ConvertTo-Json -Depth 10 | Write-Host
} catch {
  Write-Host "Error en la peticion:" -ForegroundColor Red
  Write-Host $_.Exception.Message -ForegroundColor Red
  Write-Host ""
  Write-Host "Posibles causas:" -ForegroundColor Yellow
  Write-Host "  - ngrok no esta corriendo" -ForegroundColor Gray
  Write-Host "  - URL incorrecta (debe terminar sin /mcp si ya la pusiste)" -ForegroundColor Gray
  Write-Host "  - Servidor MCP no esta corriendo (npm run mcp)" -ForegroundColor Gray
  exit 1
}

Write-Host ""

# PASO 2: Extraer session_id
Write-Host "PASO 2: Extrayendo session_id..." -ForegroundColor Yellow

try {
  $payload = $resp.result.content[0].text | ConvertFrom-Json
  $sessionId = $payload.session_id
  Write-Host "Session ID: $sessionId" -ForegroundColor Green
  Write-Host ""
} catch {
  Write-Host "Error extrayendo session_id:" -ForegroundColor Red
  Write-Host $_.Exception.Message -ForegroundColor Red
  exit 1
}

# PASO 3: Enviar mensaje
Write-Host "PASO 3: Enviando mensaje a Sandra..." -ForegroundColor Yellow

$body2 = @{
  jsonrpc = "2.0"
  id      = 2
  method  = "tools/call"
  params  = @{
    name      = "bastanteo_send_message"
    arguments = @{
      session_id = $sessionId
      message    = "Hola Sandra, este es un mensaje de prueba a traves de ngrok. Responde brevemente."
    }
  }
} | ConvertTo-Json -Depth 5

try {
  Write-Host "Enviando mensaje..." -ForegroundColor Gray
  $resp2 = Invoke-RestMethod -Uri $mcpUrl -Method Post -ContentType "application/json" -Body $body2
  Write-Host "Respuesta recibida:" -ForegroundColor Green
  $resp2 | ConvertTo-Json -Depth 10 | Write-Host
  Write-Host ""
  
  $replyObj = $resp2.result.content[0].text | ConvertFrom-Json
  Write-Host "RESPUESTA DE SANDRA:" -ForegroundColor Magenta
  Write-Host "====================" -ForegroundColor Magenta
  Write-Host $replyObj.reply -ForegroundColor White
  Write-Host "====================" -ForegroundColor Magenta
  Write-Host ""
  
  Write-Host "Prueba a traves de ngrok completada exitosamente!" -ForegroundColor Green
} catch {
  Write-Host "Error enviando mensaje:" -ForegroundColor Red
  Write-Host $_.Exception.Message -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "RESUMEN:" -ForegroundColor Cyan
Write-Host "  - Túnel ngrok: $NgrokUrl" -ForegroundColor Gray
Write-Host "  - Endpoint MCP: $mcpUrl" -ForegroundColor Gray
Write-Host "  - Sesion creada: $sessionId" -ForegroundColor Gray
Write-Host "  - Mensaje enviado y respuesta recibida" -ForegroundColor Gray
Write-Host ""
Write-Host "Usa esta URL en ChatGPT Desktop:" -ForegroundColor Yellow
Write-Host "  $mcpUrl" -ForegroundColor White
Write-Host ""

