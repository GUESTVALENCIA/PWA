# SOLUCIÓN DEFINITIVA - Chat No Funciona

## PROBLEMA IDENTIFICADO

El chat no funciona porque el endpoint no se extrae correctamente del rewrite de Vercel.

**Flujo esperado:**
1. Widget hace `fetch('/api/sandra/chat', ...)`
2. Vercel rewrite: `/api/sandra/chat` -> `/api/api-gateway`
3. api-gateway.js necesita extraer que el endpoint original era `sandra/chat`
4. api-gateway.js procesa el request correctamente

**Problema:**
- El parsing del endpoint falla
- El endpoint queda como `api-gateway` en lugar de `sandra/chat`
- El switch no encuentra el case `sandra/chat`
- Devuelve 404

## SOLUCIÓN

### Opción 1: Usar req.originalUrl (MÁS SIMPLE)

En Vercel, cuando hay un rewrite:
- `req.url` = `/api/api-gateway` (después del rewrite)
- `req.originalUrl` = `/api/sandra/chat` (antes del rewrite) ← **USAR ESTO**

### Opción 2: Crear endpoints individuales

Crear archivos separados:
- `api/sandra/chat.js` → handler directo
- `api/sandra/assistant.js` → ya existe
- etc.

### Opción 3: Usar query params en rewrites

```json
{
  "source": "/api/sandra/chat",
  "destination": "/api/api-gateway?endpoint=sandra/chat"
}
```

Luego en api-gateway.js:
```javascript
const endpoint = req.query.endpoint || extractFromUrl(req);
```

## IMPLEMENTACIÓN RECOMENDADA

**Opción 1 es la más simple y robusta.** Ya está implementada.

## VERIFICACIÓN

Después del deploy, los logs mostrarán:
```
🔍 [API Gateway] Request completo: {
  originalUrl: '/api/sandra/chat',
  endpointFinal: 'sandra/chat'
}
✅ [API Gateway] Procesando /api/sandra/chat
```

Si ves `endpointFinal: 'api-gateway'` o vacío, el parsing falló.

