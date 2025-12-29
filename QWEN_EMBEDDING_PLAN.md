# 🎯 Plan de Integración: Embedding QWEN en Aplicación Electron

**Objetivo:** Embeber QWEN internamente en tu aplicación de escritorio exactamente como funciona en VS Code

**Estado:** Planificación
**Fecha:** 2025-12-29

---

## 📋 Requisitos Funcionales

### 1. **Navegador Interno Embebido**
- ✅ Cargar URL de QWEN (https://qwenlm.ai/) dentro de la aplicación
- ✅ Mantener sesión persistente (cookies guardadas)
- ✅ Sin proceso externo - todo interno
- ✅ Credenciales guardadas transparentemente

### 2. **Interfaz de Usuario**
- ✅ Botón/Ícono en barra lateral o panel
- ✅ Al clickear → se abre QWEN embebido
- ✅ Barra de status mostrando estado de conexión
- ✅ Toggle: "Logging Out" ↔ "Logging In"

### 3. **Autenticación Transparente**
- ✅ Primera conexión: usuario inicia sesión en QWEN normalmente
- ✅ Sesiones posteriores: conecta automáticamente
- ✅ Manejo de cookies/tokens del navegador
- ✅ Sin exposición de credenciales en código

### 4. **Integración con MCP Server**
- ✅ Respuestas de QWEN van al MCP Server
- ✅ Workflow centralizado (propuestas, reviews, unificación)
- ✅ WebSocket bidireccional
- ✅ Estado sincronizado

---

## 🏗️ Arquitectura Técnica

```
┌─────────────────────────────────────────────────────────────┐
│                 APLICACIÓN ELECTRON (Desktop)              │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            Barra Lateral / Activity Bar              │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │  [🤖 QWEN] [📝 Projects] [⚙️ Settings]         │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                │
│                           ↓                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         QWEN Panel (BrowserView Embebido)            │  │
│  │                                                      │  │
│  │  ┌─ Estado Bar ──────────────────────────────────┐  │  │
│  │  │ 🟢 Conectado | Reconectar | Desconectar       │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │                                                      │  │
│  │  ┌─ Navegador Interno ────────────────────────────┐  │  │
│  │  │                                                 │  │  │
│  │  │  [https://qwenlm.ai/ embebido aquí]            │  │  │
│  │  │  • Chat de QWEN                                │  │  │
│  │  │  • Respuestas en tiempo real                   │  │  │
│  │  │  • Sesión persistente                          │  │  │
│  │  │                                                 │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                │
│                           ↓                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │        Eventos → MCP Server (WebSocket)             │  │
│  │                                                      │  │
│  │  • Mensajes de QWEN → POST /api/projects/:id/propose
│  │  • Respuesta usuario → Workflow centralizado        │  │
│  │  • Sync estado → Real-time updates                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                │
└───────────────────────────┼────────────────────────────────┘
                            │
                            ↓
        ┌───────────────────────────────────┐
        │  MCP UNIVERSAL SERVER              │
        │  https://pwa-imbf.onrender.com     │
        └───────────────────────────────────┘
```

---

## 🔧 Componentes Técnicos

### 1. **Electron Main Process**
```
main.js
├── createQwenWindow()           // Crear ventana principal
├── createQwenPanel()            // Crear panel embebido
├── setupBrowserView()           // Configurar vista del navegador
├── setupSessionPersistence()    // Guardar cookies/sesión
├── handleAuthState()            // Manejar estado de autenticación
└── connectToMCP()               // WebSocket a MCP Server
```

### 2. **Electron Preload Script**
```
preload.js
├── Inyectar contexto seguro
├── Bridge entre navegador embebido y proceso principal
├── IPC handlers para QWEN
└── Capturar mensajes/eventos
```

### 3. **Componentes React/Vue (UI)**
```
qwen-panel.tsx
├── QwenContainer              // Panel principal
├── StatusBar                  // Barra de estado (🟢/🔴)
├── ConnectionToggle           // Botón Logging In/Out
├── QwenWebView               // Contenedor del navegador
└── EventListener             // Escucha cambios QWEN
```

### 4. **Gestor de Sesiones**
```
session-manager.js
├── initializeSession()          // Primera conexión
├── saveSessionData()            // Guardar cookies/tokens
├── restoreSession()             // Recuperar sesión
├── clearSession()               // Logout
└── isSessionValid()             // Verificar validez
```

### 5. **Integrador MCP**
```
mcp-integrator.js
├── connectToMCPServer()         // WebSocket connection
├── sendProposal()               // Enviar propuesta
├── captureQwenResponse()        // Capturar respuestas
├── syncState()                  // Sincronizar estado
└── handleEvents()               // Procesar eventos
```

---

## 📦 Dependencias Necesarias

```json
{
  "dependencies": {
    "electron": "^latest",
    "electron-squirrel-startup": "^1.1.1",
    "ws": "^8.x",              // WebSocket para MCP
    "axios": "^1.x"            // HTTP requests
  },
  "devDependencies": {
    "typescript": "^5.x",
    "electron-builder": "^latest",
    "@electron/remote": "^latest",
    "ipc-main-handle": "^latest"
  }
}
```

---

## 🔐 Manejo de Sesiones

### Almacenamiento de Sesiones
```
~/AppData/Local/StudioLab/
├── sessions/
│   ├── qwen-session.json        # Datos de sesión
│   ├── cookies.json              # Cookies del navegador
│   └── auth-token.json           # Tokens de autenticación
└── config/
    └── qwen-config.json
```

### Flujo de Autenticación

**Primera vez:**
```
Usuario clickea [🤖 QWEN]
    ↓
Se abre navegador embebido en https://qwenlm.ai/
    ↓
Usuario ingresa credenciales
    ↓
Se guardan cookies automáticamente en ~/AppData/Local/StudioLab/sessions/
    ↓
Siguiente sesión: se cargan cookies automáticamente
    ↓
Sin necesidad de login nuevamente
```

---

## 🔄 Flujo de Integración con MCP

```
1. Usuario escribe en QWEN
2. QWEN genera respuesta
3. Aplicación captura el mensaje/respuesta
4. Envía al MCP Server: POST /api/projects/:id/propose
5. MCP procesa (unifica, revisa, etc.)
6. Resultado regresa vía WebSocket
7. Se muestra en la UI de la aplicación
8. QWEN puede continuar trabajando
```

---

## 📝 Implementación Paso a Paso

### Fase 1: Estructura Base (Semana 1)
- [ ] Crear ventana Electron principal
- [ ] Agregar BrowserView para embeber QWEN
- [ ] Implementar barra de status
- [ ] Crear preload script

### Fase 2: Autenticación (Semana 2)
- [ ] Implementar gestor de sesiones
- [ ] Guardar cookies/tokens
- [ ] Restaurar sesión automática
- [ ] Manejo de logout

### Fase 3: Integración MCP (Semana 3)
- [ ] WebSocket al MCP Server
- [ ] Capturar eventos de QWEN
- [ ] Enviar propuestas
- [ ] Sincronizar estado

### Fase 4: Refinamiento (Semana 4)
- [ ] Testing completo
- [ ] Manejo de errores
- [ ] Performance optimization
- [ ] UI/UX polish

---

## 🎯 Archivos a Crear/Modificar

### Crear:
```
src/
├── main/
│   ├── index.ts                    # Main process entry
│   ├── qwen-manager.ts             # Gestor QWEN
│   ├── session-manager.ts          # Gestor sesiones
│   ├── mcp-integrator.ts           # Integración MCP
│   └── preload.ts                  # Preload script
├── renderer/
│   ├── components/
│   │   ├── QwenPanel.tsx           # Panel principal
│   │   ├── StatusBar.tsx           # Barra de estado
│   │   └── ConnectionToggle.tsx    # Toggle conexión
│   ├── pages/
│   │   └── QwenView.tsx            # Vista de QWEN
│   └── App.tsx
├── utils/
│   ├── ipc-handlers.ts             # Handlers IPC
│   ├── storage.ts                  # Almacenamiento
│   └── logger.ts                   # Logging
└── types/
    └── qwen.ts                     # TypeScript types
```

### Modificar:
```
package.json                        # Agregar dependencias
tsconfig.json                       # Ajustar configuración
webpack.config.js                   # Configuración build
```

---

## 🔑 Conceptos Clave

### 1. **BrowserView vs WebView**
- **BrowserView**: Panel independiente (mejor para integración)
- **WebView**: Tag HTML (más lento, menos control)
- **Recomendación:** BrowserView + session persistence

### 2. **Session Persistence**
- Electron Session API: `electron.session.fromPartition()`
- Guardar datos entre sesiones
- Cookies automáticas

### 3. **IPC Communication**
- Main process ↔ Renderer process
- Main process ↔ Browser embebido
- Control de eventos

### 4. **Security**
- Preload script con contexto aislado
- No exponer APIs peligrosas
- Validar mensajes IPC
- CORS headers seguros

---

## 📊 Métricas de Éxito

- ✅ QWEN se abre con un click
- ✅ Sesión persiste entre reinicios
- ✅ Barra de status muestra estado correcto
- ✅ Mensajes de QWEN llegan al MCP Server
- ✅ Workflow centralizado funciona end-to-end
- ✅ <2 segundos para cargar sesión
- ✅ 0 credenciales expuestas en código/logs

---

## 🚀 Próximos Pasos

1. **Explorar tu aplicación actual** - Entender estructura Electron
2. **Crear módulo QwenManager** - Gestión del navegador embebido
3. **Implementar SessionManager** - Persistencia de sesiones
4. **Integrar con MCP** - WebSocket y event handling
5. **Testing y refinamiento** - Asegurar estabilidad

---

**Este plan proporciona:**
- Arquitectura clara y escalable
- Componentes reutilizables
- Seguridad en credenciales
- Integración completa con MCP Server
- Experiencia de usuario similar a VS Code

