# Web/Widget Integration - Cloud Tools Only

**Versión:** 1.0.0  
**Fecha:** 11 Diciembre 2025

---

## Principio Fundamental

El **widget/web** solo puede usar herramientas **cloud** porque no tiene acceso al sistema local del usuario.

---

## Herramientas Disponibles para Web/Widget

### ✅ Disponibles (cloud.*)

- `cloud.github.readFile` - Leer archivos de GitHub
- `cloud.web.fetch` - Peticiones HTTP
- `cloud.pwa.query` - Consultar endpoints del PWA
- `cloud.render.logs` - Logs de Render (si está implementado)

### ❌ NO Disponibles (local.*)

- `local.fs.*` - Acceso al sistema de archivos
- `local.os.exec` - Ejecución de comandos
- `local.audio.*` - Control de hardware
- `local.apps.*` - Aplicaciones instaladas

---

## Endpoints para Web/Widget

### MCP Protocol (Recomendado)

**Endpoint:** `POST /api/mcp`

**Request:**
```json
{
  "method": "tools/call",
  "params": {
    "name": "cloud.github.readFile",
    "arguments": {
      "owner": "GUESTVALENCIA",
      "repo": "PWA",
      "path": "README.md"
    }
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\"content\":\"# README\\n\\n...\",\"path\":\"README.md\"}"
    }
  ]
}
```

### Endpoints Directos (Compatibilidad)

**Endpoint:** `POST /mcp/status`  
**Endpoint:** `POST /mcp/execute_command` (solo para cloud, con allowlist)

---

## Manejo de Peticiones Locales

Si el usuario en web/widget pide algo que requiere acceso local:

**Respuesta del backend:**
```json
{
  "ok": false,
  "error": "Esta acción requiere el Desktop Agent de Sandra. Por favor, usa la aplicación de escritorio.",
  "requiresDesktop": true,
  "suggestion": "Descarga Sandra Studio Ultimate para acceso completo"
}
```

**NO inventar resultados locales desde el servidor cloud.**

---

## Ejemplo de Flujo Web/Widget

1. Usuario en widget: "Lee el README del repo"
2. Widget → `POST /api/mcp` con `cloud.github.readFile`
3. Backend ejecuta tool cloud
4. Backend retorna resultado real
5. Widget muestra contenido real al usuario

---

## Seguridad

- **No ejecutar comandos locales** desde web/widget
- **Allowlist de comandos** si se implementa `execute_command` para cloud
- **Validación de argumentos** en todos los endpoints
- **Rate limiting** para prevenir abuso

---

## Integración con Widget Conversacional

El widget de llamadas conversacionales debe:
1. Detectar intenciones que requieren tools
2. Llamar a `/api/mcp` con tool calls
3. Usar resultados reales en la respuesta de voz
4. Informar al usuario si requiere Desktop Agent

