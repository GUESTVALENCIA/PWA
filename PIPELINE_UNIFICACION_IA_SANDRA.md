# 🚀 PIPELINE DE UNIFICACIÓN: IA-SANDRA + PWA

## 📋 Resumen Ejecutivo

Este documento detalla el plan completo para unificar el repositorio **IA-SANDRA** (https://github.com/GUESTVALENCIA/IA-SANDRA) con el repositorio **GUESTVALENCIAPWA** sin modificar ninguno de los dos, creando una capa de orquestación que conecte ambos sistemas.

---

## 🎯 Objetivos

1. **Conectar IA-SANDRA con PWA** sin modificar código existente
2. **Integrar servicios de IA** del repo IA-SANDRA
3. **Unificar persistencia** en Neon DB
4. **Activar pipeline de negociación** y modelos de regateo
5. **Conectar orquestador de contexto** de IA-SANDRA
6. **Mantener compatibilidad** con sistemas existentes

---

## 🏗️ Arquitectura de Unificación

```
┌─────────────────────────────────────────────────────────────┐
│                    REPO PWA (Actual)                       │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  src/websocket/socket-server.js                      │  │
│  │  src/services/voice-services.js                      │  │
│  │  src/services/neon-service.js                         │  │
│  └─────────────────────────────────────────────────────┘  │
└───────────────────────┬───────────────────────────────────┘
                        │
                        │ 🔌 ORQUESTADOR DE CONEXIÓN
                        │
┌───────────────────────▼───────────────────────────────────┐
│         SANDRA ORCHESTRATOR (Nueva Capa)                 │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  src/orchestrators/sandra-orchestrator.js            │ │
│  │  - Conecta ambos repos                               │ │
│  │  - Gestiona servicios de IA-SANDRA                   │ │
│  │  - Unifica persistencia Neon                         │ │
│  │  - Pipeline de negociación                           │ │
│  └─────────────────────────────────────────────────────┘ │
└───────────────────────┬───────────────────────────────────┘
                        │
                        │ 📦 MÓDULOS EXTERNOS (IA-SANDRA)
                        │
┌───────────────────────▼───────────────────────────────────┐
│              REPO IA-SANDRA (Externo)                     │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  services/          - Servicios de IA                │  │
│  │  neon-db-adapter/   - Adaptador Neon                │  │
│  │  negotiation/       - Pipeline de negociación       │  │
│  │  context/           - Orquestador de contexto       │  │
│  └─────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────┘
                        │
                        │ 💾 PERSISTENCIA UNIFICADA
                        │
┌───────────────────────▼───────────────────────────────────┐
│                    NEON DATABASE                          │
│  - sessions                                               │
│  - conversation_history                                   │
│  - users                                                   │
│  - properties                                              │
│  - negotiation_logs                                        │
└───────────────────────────────────────────────────────────┘
```

---

## 📦 Componentes a Integrar de IA-SANDRA

### 1. **Servicios de IA** (`services/`)
- Modelos de procesamiento de lenguaje
- Integración con múltiples proveedores (OpenAI, Gemini, Groq)
- Pipeline de generación de respuestas

### 2. **Adaptador Neon DB** (`neon-db-adapter/`)
- Conexión optimizada a Neon
- Queries especializadas
- Caché y optimización

### 3. **Pipeline de Negociación** (`negotiation/`)
- Cálculo de precios mínimos
- Ofertas estratégicas
- Modelos de regateo
- Ajuste por temporada y canal

### 4. **Orquestador de Contexto** (`context/`)
- Gestión de contexto conversacional
- Memoria persistente
- Personalización por usuario

---

## 🔧 Implementación

### Fase 1: Orquestador Base

**Archivo**: `src/orchestrators/sandra-orchestrator.js`

```javascript
/**
 * Sandra Orchestrator - Conecta IA-SANDRA con PWA
 * Sin modificar ninguno de los dos repos
 */

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SandraOrchestrator {
  constructor() {
    // Ruta al repo IA-SANDRA (configurable)
    this.sandraRepoPath = process.env.SANDRA_REPO_PATH || 
      path.join(__dirname, '../../IA-SANDRA');
    
    // Servicios cargados dinámicamente
    this.services = {};
    this.negotiationPipeline = null;
    this.contextOrchestrator = null;
    this.neonAdapter = null;
  }

  /**
   * Inicializar conexión con IA-SANDRA
   */
  async initialize() {
    try {
      // Cargar servicios de IA-SANDRA dinámicamente
      await this.loadSandraServices();
      
      // Inicializar adaptador Neon
      await this.initializeNeonAdapter();
      
      // Inicializar pipeline de negociación
      await this.initializeNegotiationPipeline();
      
      // Inicializar orquestador de contexto
      await this.initializeContextOrchestrator();
      
      return true;
    } catch (error) {
      console.error('[SANDRA ORCHESTRATOR] Error inicializando:', error);
      return false;
    }
  }

  /**
   * Cargar servicios de IA-SANDRA
   */
  async loadSandraServices() {
    // Implementación: cargar módulos dinámicamente desde IA-SANDRA
  }

  /**
   * Inicializar adaptador Neon de IA-SANDRA
   */
  async initializeNeonAdapter() {
    // Implementación: conectar con neon-db-adapter de IA-SANDRA
  }

  /**
   * Inicializar pipeline de negociación
   */
  async initializeNegotiationPipeline() {
    // Implementación: cargar pipeline de negociación de IA-SANDRA
  }

  /**
   * Inicializar orquestador de contexto
   */
  async initializeContextOrchestrator() {
    // Implementación: cargar orquestador de contexto de IA-SANDRA
  }
}

export default SandraOrchestrator;
```

### Fase 2: Integración con WebSocket Server

**Modificar**: `src/websocket/socket-server.js`

```javascript
import SandraOrchestrator from '../orchestrators/sandra-orchestrator.js';

// Inicializar orquestador
const sandraOrchestrator = new SandraOrchestrator();
await sandraOrchestrator.initialize();

// Usar en el flujo de llamadas
// ...
```

### Fase 3: Integración con Voice Services

**Modificar**: `src/services/voice-services.js`

```javascript
// Usar servicios de IA de IA-SANDRA en lugar de los actuales
// Mantener compatibilidad con el código existente
```

---

## 📊 Estructura de Archivos

```
GUESTVALENCIAPWA/
├── src/
│   ├── orchestrators/          # NUEVO: Orquestador de conexión
│   │   ├── sandra-orchestrator.js
│   │   ├── negotiation-bridge.js
│   │   └── context-bridge.js
│   ├── services/
│   │   ├── neon-service.js      # Mantener (compatibilidad)
│   │   └── voice-services.js   # Mantener (compatibilidad)
│   └── websocket/
│       └── socket-server.js     # Modificar (integración)
│
└── IA-SANDRA/                   # EXTERNO: No modificar
    ├── services/
    ├── neon-db-adapter/
    ├── negotiation/
    └── context/
```

---

## 🔌 Métodos de Conexión

### Opción 1: Git Submodule (Recomendado)

```bash
# Agregar IA-SANDRA como submodule
git submodule add https://github.com/GUESTVALENCIA/IA-SANDRA.git IA-SANDRA
```

### Opción 2: NPM Package Local

```bash
# En IA-SANDRA, crear package.json exportable
# En PWA, instalar como dependencia local
npm install ../IA-SANDRA
```

### Opción 3: Importación Dinámica

```javascript
// Cargar módulos dinámicamente desde ruta configurable
const sandraServices = await import(process.env.SANDRA_REPO_PATH + '/services');
```

---

## 🎯 Próximos Pasos

1. ✅ Crear estructura de orquestador
2. ⏳ Implementar carga dinámica de servicios
3. ⏳ Integrar adaptador Neon de IA-SANDRA
4. ⏳ Conectar pipeline de negociación
5. ⏳ Integrar orquestador de contexto
6. ⏳ Probar y validar

---

**Estado**: 🚀 Listo para implementación
