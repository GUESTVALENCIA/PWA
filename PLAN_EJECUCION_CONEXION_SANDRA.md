# 🚀 PLAN DE EJECUCIÓN: Conexión Completa de IA-SANDRA

## 📋 RESUMEN EJECUTIVO

Conectar IA-SANDRA completamente al sistema PWA como orquestadora principal, ajustando el código existente según la estructura REAL de IA-SANDRA (no la documentación teórica).

---

## ✅ PASO 1: CONFIGURAR RENDER PARA SUBMODULES (CRÍTICO)

### Acción Inmediata:
1. Ir a Render Dashboard → Tu Servicio → Settings
2. Buscar sección **Build & Deploy**
3. Cambiar **Build Command**:
   ```
   git submodule update --init --recursive && npm install
   ```

### Verificación:
- Después del deploy, verificar logs:
  ```
  ==> Syncing Git submodules
  Submodule 'IA-SANDRA' (https://github.com/GUESTVALENCIA/IA-SANDRA.git) registered
  ```

---

## ✅ PASO 2: AJUSTAR ORQUESTADOR (CRÍTICO)

### Problema Identificado:
El orquestador busca estructuras que NO existen según la documentación teórica.

### Cambios Necesarios en `src/orchestrators/sandra-orchestrator.js`:

#### 2.1. Negotiation Pipeline
**ANTES (incorrecto):**
```javascript
const negotiationPath = path.join(this.sandraRepoPath, 'negotiation');
```

**DESPUÉS (correcto):**
```javascript
// Cargar negotiation-service.js desde services/
const negotiationServicePath = path.join(this.sandraRepoPath, 'services', 'negotiation-service.js');
if (fs.existsSync(negotiationServicePath)) {
  // Cargar servicio (CommonJS)
  const NegotiationService = require(negotiationServicePath);
  this.negotiationPipeline = new NegotiationService();
}
```

#### 2.2. Context Orchestrator
**ANTES (incorrecto):**
```javascript
const contextPath = path.join(this.sandraRepoPath, 'context');
```

**DESPUÉS (correcto):**
```javascript
// El contexto YA está en el PWA, no en IA-SANDRA
// Importar desde lib/contextOrchestrator.js
const { getContext } = await import('../../lib/contextOrchestrator.js');
this.contextOrchestrator = { getContext };
```

#### 2.3. Neon DB Adapter
**ANTES:**
```javascript
const adapterPath = path.join(this.sandraRepoPath, 'neon-db-adapter');
// Busca index.js o main.js
```

**DESPUÉS:**
```javascript
// Cargar neon-db.js directamente (CommonJS)
const neonDbPath = path.join(this.sandraRepoPath, 'neon-db-adapter', 'neon-db.js');
if (fs.existsSync(neonDbPath)) {
  const NeonDB = require(neonDbPath);
  this.neonAdapter = new NeonDB();
  await this.neonAdapter.initializeDatabase();
}
```

#### 2.4. Manejo CommonJS → ES Modules
**Problema:** IA-SANDRA usa CommonJS (`module.exports`), PWA usa ES Modules (`import`/`export`).

**Solución:** Usar `createRequire` o cargar dinámicamente con `require()` cuando sea necesario.

---

## ✅ PASO 3: CONECTAR SERVICIOS REALES

### 3.1. Negotiation Service
- ✅ Cargar `services/negotiation-service.js`
- ✅ Instanciar `new NegotiationService()`
- ✅ Conectar con `negotiation-bridge.js`
- ✅ Probar `computeOffer()` en WebSocket server

### 3.2. Neon DB Adapter
- ✅ Cargar `neon-db-adapter/neon-db.js`
- ✅ Instanciar `new NeonDB()`
- ✅ Inicializar con `initializeDatabase()`
- ✅ Verificar compatibilidad con `neon-service.js` del PWA

### 3.3. Multimodal Conversation Service (Opcional Futuro)
- ⏳ Analizar dependencias
- ⏳ Conectar si es necesario
- ⏳ Integrar con WebSocket

---

## 📊 ORDEN DE EJECUCIÓN

1. **CRÍTICO - Render Build Command** (5 min)
2. **CRÍTICO - Ajustar Orquestador** (30 min)
3. **ALTO - Conectar Negotiation Service** (20 min)
4. **ALTO - Conectar Neon DB Adapter** (20 min)
5. **MEDIO - Probar y Verificar** (15 min)
6. **BAJO - Documentar cambios** (10 min)

**Tiempo Total Estimado:** ~100 minutos

---

## 🎯 RESULTADO ESPERADO

Después de la implementación:

```
✅ IA-SANDRA clonado correctamente en Render
✅ NegotiationService conectado y funcionando
✅ NeonDB Adapter conectado
✅ Context Orchestrator usando lib/contextOrchestrator.js
✅ Logs muestran: "[SANDRA ORCHESTRATOR] ✅ Unificación completada exitosamente"
✅ Servicios disponibles en req.services.sandra
```

---

**ESTADO**: 🚀 LISTO PARA EJECUTAR
