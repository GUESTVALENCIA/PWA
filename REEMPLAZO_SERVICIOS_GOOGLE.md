# 🔄 REEMPLAZO DE SERVICIOS DE GOOGLE

## 📋 SERVICIOS DE GOOGLE IDENTIFICADOS

### 1. **Google Maps API**
**Ubicación actual:**
- `C:\Users\clayt\Downloads\guestsvalencia-proptech-os-v14.8 (1)\services\geminiService.ts`
  - Función: `groundedQuery(prompt, tool)` con `googleMaps`

**Reemplazo:**
- ✅ **OpenStreetMap Nominatim** (API pública gratuita)
  - URL: `https://nominatim.openstreetmap.org`
  - Endpoint: `/search`
  - Rate limit: 1 request/second
  - Sin API key requerida

**Implementación:**
```javascript
// En lugar de googleMaps tool, usar OpenStreetMap
async searchLocation(query) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`,
    {
      headers: {
        'User-Agent': 'GuestsValencia-PWA/1.0'
      }
    }
  );
  return await response.json();
}
```

---

### 2. **Google Search API**
**Ubicación actual:**
- `C:\Users\clayt\Downloads\guestsvalencia-proptech-os-v14.8 (1)\services\geminiService.ts`
  - Función: `groundedQuery(prompt, tool)` con `googleSearch`

**Reemplazo:**
- ✅ **DuckDuckGo Instant Answer API** (API pública gratuita)
  - URL: `https://api.duckduckgo.com`
  - Endpoint: `/?q={query}&format=json&no_html=1`
  - Sin API key requerida
  - Sin rate limit estricto

**Alternativas:**
- **SerpAPI** (si se necesita más robustez, pero requiere key)
- **SearxNG** (motor de búsqueda open source)

**Implementación:**
```javascript
async searchWeb(query) {
  const response = await fetch(
    `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`
  );
  return await response.json();
}
```

---

### 3. **Google Geolocation API**
**Estado:** ✅ **YA REEMPLAZADO**
- Actualmente usando `ip.guide` (API pública gratuita)
- Archivo: `src/services/ip-geolocation-service.js`
- No requiere cambios

---

### 4. **Google Directions API** (Para navegación/rutas)
**Ubicación:** Mencionado en plan de implementación

**Reemplazo:**
- ✅ **OpenRouteService** (API pública gratuita)
  - URL: `https://api.openrouteservice.org`
  - Endpoint: `/v2/directions/driving-car`
  - Rate limit: 2,000 requests/day (con key gratuita)
  - Alternativa sin key: **OSRM** (Open Source Routing Machine)

**Implementación:**
```javascript
async getRoute(from, to) {
  const response = await fetch(
    `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${process.env.OPENROUTESERVICE_API_KEY}&start=${from.lon},${from.lat}&end=${to.lon},${to.lat}`
  );
  return await response.json();
}
```

---

## 🎯 PLAN DE REEMPLAZO

### FASE 1: Identificar y Documentar (COMPLETADO)
- ✅ Identificados servicios de Google
- ✅ Identificadas APIs públicas de reemplazo
- ✅ Creado PublicAPIsService

### FASE 2: Crear Servicios de Reemplazo
- ✅ PublicAPIsService creado
- ⏳ Crear OpenStreetMapService
- ⏳ Crear DuckDuckGoSearchService
- ⏳ Crear OpenRouteService (si se necesita)

### FASE 3: Actualizar Código Existente
- ⏳ Reemplazar `groundedQuery` con `googleMaps` → OpenStreetMap
- ⏳ Reemplazar `groundedQuery` con `googleSearch` → DuckDuckGo
- ⏳ Actualizar MCP tools si usan Google

### FASE 4: Testing y Validación
- ⏳ Probar todos los reemplazos
- ⏳ Validar funcionalidad equivalente
- ⏳ Documentar cambios

---

## 📝 SERVICIOS YA SIN GOOGLE

### ✅ Geolocalización
- **Estado:** Ya usando `ip.guide`
- **Archivo:** `src/services/ip-geolocation-service.js`
- **No requiere cambios**

### ✅ IP Tracking
- **Estado:** Nuevo servicio creado usando `ip.guide`
- **Archivo:** `src/services/ip-tracking-service.js`
- **Funcionalidades:**
  - Detectar región/idioma por IP
  - Recuperar conversaciones anteriores
  - Detectar si llamada se cayó o se cortó normalmente
  - Recuperar contexto completo

---

## 🔧 VARIABLES DE ENTORNO

### APIs Públicas (No requieren keys):
```env
# No se requieren variables de entorno para:
# - ip.guide (geolocalización)
# - OpenStreetMap (maps)
# - DuckDuckGo (search)
```

### APIs Opcionales (Con keys gratuitas):
```env
# OpenRouteService (routing opcional)
OPENROUTESERVICE_API_KEY=...

# WeatherAPI (clima opcional)
WEATHERAPI_KEY=...
```

---

## 📦 ARCHIVOS A CREAR/MODIFICAR

### Nuevos Servicios:
1. ✅ `src/services/public-apis-service.js` - Gestión de APIs públicas
2. ✅ `src/services/ip-tracking-service.js` - Sistema completo de rastreo de IPs
3. ⏳ `src/services/openstreetmap-service.js` - Reemplazo Google Maps
4. ⏳ `src/services/duckduckgo-search-service.js` - Reemplazo Google Search

### Modificaciones:
1. ⏳ `src/services/geminiService.ts` (en proyecto descargado) - Reemplazar groundedQuery
2. ⏳ MCP Server - Actualizar tools si usan Google

---

## ✅ CHECKLIST

- [x] Identificar servicios de Google
- [x] Identificar APIs públicas de reemplazo
- [x] Crear PublicAPIsService
- [x] Crear IPTrackingService completo
- [ ] Crear OpenStreetMapService
- [ ] Crear DuckDuckGoSearchService
- [ ] Reemplazar Google Maps en código
- [ ] Reemplazar Google Search en código
- [ ] Testing completo
- [ ] Documentación final

---

**NOTA:** Todos los servicios de Google serán reemplazados por APIs públicas gratuitas del repositorio [public-apis](https://github.com/public-apis/public-apis).
