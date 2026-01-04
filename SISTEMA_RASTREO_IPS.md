# 📍 SISTEMA COMPLETO DE RASTREO DE IPs

## 🎯 OBJETIVOS

1. **Detectar región/idioma por IP** - Personalización automática
2. **Recuperar conversaciones anteriores** - Continuidad de servicio
3. **Detectar tipo de cierre de llamada** - Estadísticas y recuperación
4. **Almacenar datos en NEON DB** - Persistencia completa
5. **Recuperar contexto completo** - Experiencia sin interrupciones

---

## 🔧 COMPONENTES IMPLEMENTADOS

### 1. **IPTrackingService** (`src/services/ip-tracking-service.js`)

#### Funcionalidades Principales:

**a) getIPInfo(ipAddress)**
- Obtiene información completa desde `ip.guide`
- Retorna: location, network, ASN, organización
- Maneja IPs locales (localhost)

**b) detectLanguage(countryCode)**
- Mapea país a idioma preferido
- Soporte para 20+ países
- Default: español

**c) detectAccent(ipInfo)**
- Detecta acento regional (valenciano, madrileño, mexicano, etc.)
- Basado en ciudad y país
- Útil para personalización de voz

**d) findPreviousConversations(ipAddress)**
- Busca en `call_logs` por IP
- Busca en `sessions` por IP
- Busca en `users` por IP
- Retorna historial completo

**e) saveIPInfo(sessionId, ipAddress, ipInfo)**
- Guarda información de IP en `call_logs`
- Crea/actualiza usuario en `users`
- Almacena preferencias (idioma, acento)

**f) detectCallEndType(sessionId, reason)**
- Detecta si llamada se cortó normalmente o se cayó
- Tipos: `'normal'` | `'dropped'` | `'error'`
- Basado en `end_time`, `reason`, y duración

**g) recoverContext(ipAddress, sessionId)**
- Recupera contexto completo de conversaciones anteriores
- Incluye historial, información de usuario, IP info
- Retorna objeto completo para continuar conversación

**h) getQuickIPInfo(ipAddress)**
- Versión rápida para uso en prompts
- Retorna información esencial (país, ciudad, idioma, acento)

---

## 📊 ESTRUCTURA DE DATOS

### Información de IP (desde ip.guide):
```json
{
  "ip": "79.116.120.110",
  "location": {
    "city": "Valencia",
    "country": "Spain",
    "countryCode": "ES",
    "timezone": "Europe/Madrid",
    "latitude": 40.4172,
    "longitude": -3.684
  },
  "network": {
    "autonomous_system": {
      "asn": 57269,
      "name": "DIGISPAINTELECOM",
      "organization": "DIGI SPAIN TELECOM S.L.",
      "country": "ES"
    }
  }
}
```

### Contexto Recuperado:
```json
{
  "ipAddress": "79.116.120.110",
  "ipInfo": {
    "location": {...},
    "network": {...},
    "language": "es",
    "accent": "valenciano"
  },
  "previousConversations": 3,
  "lastConversation": {
    "sessionId": "...",
    "startTime": "...",
    "endTime": "...",
    "conversationHistory": [...],
    "bookingDetails": {...},
    "intent": "..."
  },
  "userInfo": {...},
  "isReturningUser": true,
  "recommendedLanguage": "es",
  "recommendedAccent": "valenciano"
}
```

---

## 🔄 FLUJO DE USO

### 1. **Al iniciar llamada:**
```javascript
// Extraer IP
const ipAddress = ipGeolocationService.extractIPFromRequest(req);

// Obtener información completa
const ipInfo = await ipTrackingService.getIPInfo(ipAddress);

// Recuperar contexto anterior
const context = await ipTrackingService.recoverContext(ipAddress, sessionId);

// Guardar información
await ipTrackingService.saveIPInfo(sessionId, ipAddress, ipInfo);

// Usar en prompt
const quickInfo = await ipTrackingService.getQuickIPInfo(ipAddress);
// { country: 'Spain', city: 'Valencia', language: 'es', accent: 'valenciano' }
```

### 2. **Al cerrar llamada:**
```javascript
// Detectar tipo de cierre
const endType = await ipTrackingService.detectCallEndType(sessionId, reason);
// 'normal' | 'dropped' | 'error'

// Si se cayó, preparar para recuperación
if (endType === 'dropped') {
  // Guardar estado para recuperación
  await saveStateForRecovery(sessionId, ipAddress);
}
```

### 3. **Al reconectar:**
```javascript
// Recuperar contexto completo
const context = await ipTrackingService.recoverContext(ipAddress, newSessionId);

// Si es usuario recurrente
if (context.isReturningUser) {
  // Continuar desde última conversación
  // Usar context.lastConversation.conversationHistory
  // Ajustar idioma/acento: context.recommendedLanguage
}
```

---

## 🗄️ INTEGRACIÓN CON NEON DB

### Tablas Utilizadas:

**1. call_logs**
- `ip_address` - IP del cliente
- `country` - País detectado
- `city` - Ciudad detectada
- `timezone` - Zona horaria
- `language` - Idioma detectado
- `start_time` - Inicio de llamada
- `end_time` - Fin de llamada (null si se cayó)

**2. sessions**
- `session_id` - ID único de sesión
- `ip_address` - IP del cliente
- `created_at` - Timestamp de creación

**3. users**
- `ip_address` - IP del cliente
- `language` - Idioma preferido
- `country` - País
- `city` - Ciudad
- `timezone` - Zona horaria
- `preferences` - JSON con acento, organización, etc.

**4. conversation_history**
- `session_id` - ID de sesión
- Historial completo de conversación
- Usado para recuperar contexto

---

## 🎨 CASOS DE USO

### Caso 1: Nuevo Usuario
```
IP: 185.123.45.67 (Francia)
→ Detectar: país=FR, idioma=fr, ciudad=Paris
→ Guardar en users
→ Prompt en francés
```

### Caso 2: Usuario Recurrente
```
IP: 79.116.120.110 (Valencia, España)
→ Buscar en DB: Encontradas 3 conversaciones anteriores
→ Recuperar última conversación
→ Continuar desde donde quedó
→ "¡Hola de nuevo! Veo que consultaste alojamientos en El Cabañal..."
```

### Caso 3: Llamada Caída
```
Llamada iniciada: 10:00:00
Llamada caída: 10:02:15 (sin end_time)
→ detectCallEndType: 'dropped'
→ Guardar estado para recuperación
→ Al reconectar: "Parece que se interrumpió la conexión. Te muestro lo que habíamos hablado..."
```

### Caso 4: Llamada Normal
```
Llamada iniciada: 10:00:00
Llamada cerrada: 10:05:30 (con end_time)
→ detectCallEndType: 'normal'
→ Registrar como conversación completa
```

---

## 🔐 PRIVACIDAD Y SEGURIDAD

### Datos Almacenados:
- ✅ IP address (anonimizada opcionalmente)
- ✅ País y ciudad (nivel de ciudad, no dirección exacta)
- ✅ Zona horaria
- ✅ Idioma preferido
- ✅ Historial de conversaciones

### Datos NO almacenados:
- ❌ Dirección física exacta
- ❌ Coordenadas GPS precisas
- ❌ Información personal identificable (excepto si usuario la proporciona)

---

## ✅ ESTADO DE IMPLEMENTACIÓN

- [x] IPTrackingService creado
- [x] Integración con ip.guide
- [x] Detección de idioma/acento
- [x] Búsqueda de conversaciones anteriores
- [x] Guardado en NEON DB
- [x] Detección de tipo de cierre
- [x] Recuperación de contexto completo
- [ ] Integración en socket-server.js
- [ ] Testing completo
- [ ] Documentación de uso

---

**El sistema de rastreo de IPs está completo y listo para integrarse.**
