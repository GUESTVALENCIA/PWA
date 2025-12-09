# Script de Prueba del Servidor MCP Bastanteo
# Ejecutar en PowerShell después de iniciar el servidor con: npm run mcp

Write-Host "PRUEBA DEL SERVIDOR MCP BASTANTEO" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# PASO 1: Crear una sesion nueva
Write-Host "PASO 1: Creando sesion..." -ForegroundColor Yellow

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

Write-Host "Enviando peticion a http://localhost:4042/mcp..." -ForegroundColor Gray

try {
  $resp = Invoke-RestMethod -Uri "http://localhost:4042/mcp" -Method Post -ContentType "application/json" -Body $body
  Write-Host "Respuesta recibida:" -ForegroundColor Green
  $resp | ConvertTo-Json -Depth 10 | Write-Host
} catch {
  Write-Host "Error en la peticion:" -ForegroundColor Red
  Write-Host $_.Exception.Message -ForegroundColor Red
  exit 1
}

Write-Host ""

# PASO 2: Extraer session_id
Write-Host "PASO 2: Extrayendo session_id..." -ForegroundColor Yellow

try {
  $payload = $resp.result.content[0].text | ConvertFrom-Json
  Write-Host "Payload completo:" -ForegroundColor Gray
  $payload | ConvertTo-Json -Depth 5 | Write-Host
  $sessionId = $payload.session_id
  Write-Host ""
  Write-Host "Session ID: $sessionId" -ForegroundColor Green
  Write-Host ""
} catch {
  Write-Host "Error extrayendo session_id:" -ForegroundColor Red
  Write-Host $_.Exception.Message -ForegroundColor Red
  exit 1
}

# PASO 3: Enviar mensaje a Sandra
Write-Host "PASO 3: Enviando mensaje a Sandra..." -ForegroundColor Yellow

$body2 = @{
  jsonrpc = "2.0"
  id      = 2
  method  = "tools/call"
  params  = @{
    name      = "bastanteo_send_message"
    arguments = @{
      session_id = $sessionId
      message    = "Hola Sandra, presentate en una frase corta y amable."
    }
  }
} | ConvertTo-Json -Depth 5

Write-Host "Mensaje: 'Hola Sandra, presentate en una frase corta y amable.'" -ForegroundColor Gray
Write-Host "Enviando peticion..." -ForegroundColor Gray

try {
  $resp2 = Invoke-RestMethod -Uri "http://localhost:4042/mcp" -Method Post -ContentType "application/json" -Body $body2
  Write-Host "Respuesta recibida:" -ForegroundColor Green
  $resp2 | ConvertTo-Json -Depth 10 | Write-Host
  Write-Host ""
  $replyObj = $resp2.result.content[0].text | ConvertFrom-Json
  Write-Host "Objeto completo de respuesta:" -ForegroundColor Cyan
  $replyObj | ConvertTo-Json -Depth 5 | Write-Host
  Write-Host ""
  Write-Host "RESPUESTA DE SANDRA:" -ForegroundColor Magenta
  Write-Host "====================" -ForegroundColor Magenta
  Write-Host $replyObj.reply -ForegroundColor White
  Write-Host "====================" -ForegroundColor Magenta
  Write-Host ""
  Write-Host "Prueba completada exitosamente!" -ForegroundColor Green
} catch {
  Write-Host "Error enviando mensaje:" -ForegroundColor Red
  Write-Host $_.Exception.Message -ForegroundColor Red
  if ($_.Exception.Response) {
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
  }
  exit 1
}

Write-Host ""
Write-Host "RESUMEN:" -ForegroundColor Cyan
Write-Host "  - Sesion creada: $sessionId" -ForegroundColor Gray
Write-Host "  - Mensaje enviado y respuesta recibida" -ForegroundColor Gray
Write-Host ""
