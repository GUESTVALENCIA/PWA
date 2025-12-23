#  INFORMACIÓN COMPLETA: Sistema Galaxy en GuestsValencia PWA

---

##  RESUMEN EJECUTIVO

**Estado del Sistema Galaxy:**
-  **NO está clonado** como repositorio independiente
-  **Está adaptado** en el código actual (versión propia)
-  **UIG/Widget es PROPIO** (`sandra-widget.js`), NO del sistema Galaxy original
-  **Sistema Galaxy original** está como referencia en `api/api-gateway.js`
-  **NO hay dependencias externas** (npm packages) relacionadas con Galaxy
-  **Función de integración** `connectGalaxyToSandra()` permite conectar widgets externos tipo Galaxy

---

##  UBICACIÓN DE ARCHIVOS

### 1. Sistema Galaxy Original (Referencia)
**Archivo:** `api/api-gateway.js`
-  Archivo existe en el repositorio
-  Es una **referencia** del sistema Galaxy original
-  Contiene la estructura original de `AIOrchestrator`
-  **NO se está usando activamente** (es solo referencia)

### 2. Servidor Local (Adaptación del Sistema Galaxy)
**Archivo:** `server.js`
-  Archivo principal del servidor local
-  **Adaptado del sistema Galaxy original**
-  Puerto: `4040` (HTTP)
-  Funcionalidades:
  - AIOrchestrator (adaptado de Galaxy)
  - Endpoints REST: `/api/sandra/chat`, `/api/sandra/voice`
  - Integración con Gemini y Cartesia

**Comentario en el código:**
```javascript
// Servidor Local para Sistema Galaxy
// Adaptado del api-gateway.js original para Node.js local
```

### 3. Widget UIG (PROPIO, NO de Galaxy)
**Archivo:** `assets/js/sandra-widget.js`
-  Archivo propio del proyecto
-  **NO es del sistema Galaxy**
-  Es el widget conversacional de Sandra IA
-  Clase: `SandraWidget` (NO `UIGSandra` ni `GalaxyWidget`)
-  Se carga directamente en `index.html`:
  ```html
  <script src="/assets/js/sandra-widget.js" defer></script>
  ```

### 4. Servidor WebSocket (NO relacionado con Galaxy)
**Archivo:** `server-websocket.js`
-  Servidor WebSocket para llamadas conversacionales
-  Puerto: `4041`
-  Implementación propia, no del sistema Galaxy

### 5. Función de Integración Galaxy
**Archivo:** `src/utils/env.js`
**Función:** `connectGalaxyToSandra(widget, options)`

**Propósito:** Conectar widgets externos tipo Galaxy con Sandra IA

**Características:**
-  Permite integrar widgets externos compatibles
-  NO requiere que el widget sea específicamente "Galaxy"
-  Opciones configurable:
  - `onUserMessage`: Callback personalizado
  - `autoLock`: Bloquear widget durante procesamiento
  - `showTyping`: Mostrar indicador de escritura
  - `autoSpeak`: Reproducir voz automáticamente

**Implementación también presente en:** `index.html` (línea ~1681)

---

##  ANÁLISIS DETALLADO

### ¿Está Clonado?

**Respuesta:**  **NO**

**Evidencia:**
1.  No existe directorio `galaxy/` en el proyecto
2.  No existe `.gitmodules` (no hay submodules de Git)
3.  No hay comandos `git clone` relacionados con Galaxy en el historial reciente
4.  El `README.md` menciona `src/galaxy/` pero **no existe** en el directorio

**En `README.md` línea 28:**
```markdown
│   ├── galaxy/            # Clonado del widget Galaxy adaptable
```
 **Esto es incorrecto** - el directorio NO existe.

---

### ¿Servicio Autónomo desde el Repo?

**Respuesta:**  **SÍ**

**Servidor Propio:**
-  `server.js` - Servidor HTTP local (puerto 4040)
-  `server-websocket.js` - Servidor WebSocket (puerto 4041)
-  Adaptado del sistema Galaxy pero **propio del proyecto**
-  No depende de servicios externos de Galaxy

**Endpoints Propios:**
```
POST http://localhost:4040/api/sandra/chat
POST http://localhost:4040/api/sandra/voice
```

---

### ¿Usando desde Repo de Guests Valencia?

**Respuesta:**  **NO directamente**

**Situación:**
-  No hay referencias a repositorio externo de Galaxy
-  El código está **adaptado y propio** en este repo
-  El sistema Galaxy original está como **referencia** en `api/api-gateway.js`

---

### ¿Paquetes/Librerías Externas?

**Respuesta:**  **NO hay paquetes relacionados con Galaxy**

**Dependencias actuales (`package.json`):**
```json
{
  "dependencies": {
    "dotenv": "^16.6.1",
    "ws": "^8.18.3"
  }
}
```

**Análisis:**
-  `dotenv` - Para variables de entorno
-  `ws` - Para WebSocket (no relacionado con Galaxy)
-  No hay `@galaxy/*`, `galaxy-widget`, `galaxy-sdk`, etc.

---

##  INTEGRACIÓN ACTUAL

### Widget UIG (SandraWidget)

**Archivo:** `assets/js/sandra-widget.js`

**Características:**
-  Clase: `SandraWidget`
-  Widget conversacional propio
-  Conexión con MCP Server
-  Flujo completo: STT → LLM → TTS
-  WebSocket para llamadas conversacionales

**Carga en `index.html`:**
```html
<!-- En <head> -->
<script src="/assets/js/sandra-widget.js" defer></script>

<!-- En <body> -->
<script>
  window.WIDGET_ENABLED = true;
  window.MCP_SERVER_URL = '...';
  // El widget se auto-inicializa
</script>
```

---

### Función de Integración con Widgets Externos

**Función:** `connectGalaxyToSandra(widget, options)`

**Ubicaciones:**
1. `src/utils/env.js` (exportada)
2. `index.html` (inline, línea ~1681)

**Uso:**
```javascript
// Ejemplo de uso con widget externo compatible
const galaxyWidget = {
  addMessage: (msg) => { /* ... */ },
  showTyping: (show) => { /* ... */ },
  lock: () => { /* ... */ },
  unlock: () => { /* ... */ }
};

connectGalaxyToSandra(galaxyWidget, {
  autoSpeak: true,
  showTyping: true,
  autoLock: true
});
```

**Nota:** Esta función permite usar widgets externos tipo Galaxy, pero el widget actual (`sandra-widget.js`) **NO es del sistema Galaxy**, es propio.

---

##  ESTRUCTURA DEL SISTEMA GALAXY ORIGINAL

### AIOrchestrator (Referencia en `api/api-gateway.js`)

**Componentes:**
-  **Proveedores IA:**
  - Gemini (Google)
  - OpenAI (GPT-4o)
  - Cartesia (TTS)
  - Deepgram (STT - referenciado pero no implementado)

-  **Reglas Conversacionales Globales:**
  ```javascript
  GLOBAL_CONVERSATION_RULES = `
  REGLAS CONVERSACIONALES GLOBALES (Sandra IA 8.0 Pro):
  - Sandra SÍ puede realizar llamadas de voz conversacionales...
  - Responde SIEMPRE en español neutro...
  - Actúa como experta en Hospitalidad y Turismo...
  `;
  ```

-  **Método principal:**
  ```javascript
  async generateResponse(shortPrompt, context = 'luxury')
  ```

---

##  HISTORIAL Y EVOLUCIÓN

### ¿Cuándo se integró Galaxy?

**Análisis del código:**
-  `server.js` tiene comentarios indicando que fue "adaptado del api-gateway.js original"
-  La función `connectGalaxyToSandra()` fue creada para permitir integración con widgets externos
-  No hay commits específicos de clonación de Galaxy en el historial reciente

**Conclusión:**
- El sistema Galaxy original fue usado como **referencia y base**
- Se **adaptó** para el proyecto propio
- NO se clonó como dependencia externa

---

##  CONCLUSIÓN FINAL

### Estado Actual:

1. **Sistema Galaxy Original:**
   -  Ubicación: `api/api-gateway.js` (solo referencia)
   -  NO está clonado
   -  Está adaptado en `server.js`

2. **Widget UIG:**
   -  Ubicación: `assets/js/sandra-widget.js`
   -  Es PROPIO del proyecto
   -  NO es del sistema Galaxy

3. **Servidor:**
   -  Autónomo desde este repo
   -  Adaptado del sistema Galaxy pero propio
   -  Puertos: 4040 (HTTP), 4041 (WebSocket)

4. **Dependencias:**
   -  NO hay paquetes npm relacionados con Galaxy
   -  Solo dependencias básicas: `dotenv`, `ws`

5. **Integración Externa:**
   -  Función `connectGalaxyToSandra()` permite conectar widgets externos compatibles
   -  Pero el widget actual NO requiere esta función (es propio)

---

##  RECOMENDACIONES

### Si necesitas el Sistema Galaxy Original:

1. **Opción A: Usar como referencia**
   -  Ya está en `api/api-gateway.js`
   -  Puedes consultar su estructura

2. **Opción B: Clonar repositorio externo (si existe)**
   -  Necesitarías la URL del repositorio de Galaxy
   -  Actualmente NO hay referencias a un repo externo

3. **Opción C: Mantener adaptación actual**
   -  Ya está funcionando
   -  Es propio y controlable

---

##  REFERENCIAS EN EL CÓDIGO

### Archivos que mencionan "Galaxy":

1. `README.md` - Menciona `src/galaxy/` (NO existe)
2. `README_GALAXY.md` - Documentación del servidor local
3. `server.js` - Comentarios sobre adaptación de Galaxy
4. `api/api-gateway.js` - Sistema Galaxy original (referencia)
5. `src/utils/env.js` - Función `connectGalaxyToSandra()`
6. `index.html` - Función `connectGalaxyToSandra()` inline
7. Múltiples archivos `.md` - Documentación sobre integración Galaxy

---

##  DATOS TÉCNICOS

### Endpoints del Sistema (Adaptación Galaxy):

```
POST /api/sandra/chat
  - Body: { "message": "...", "context": "luxury" }
  - Response: { "response": "..." }

POST /api/sandra/voice
  - Body: { "text": "..." }
  - Response: { "audio": "base64..." }
```

### Variables de Entorno Requeridas:

```env
GEMINI_API_KEY=...
CARTESIA_API_KEY=...
CARTESIA_VOICE_ID=...
DEEPGRAM_API_KEY=... (opcional, referenciado pero no usado activamente)
```

---

##  RESPUESTA DIRECTA AL USUARIO

**¿Está clonado?**
-  NO

**¿Servicio autónomo desde nuestro repo?**
-  SÍ (`server.js`, `server-websocket.js`)

**¿Usando desde repo de Guests Valencia?**
-  NO directamente, es adaptación propia

**¿Paquetes/librerías externas?**
-  NO

**El UIG es del sistema Galaxy?**
-  NO, el UIG (`sandra-widget.js`) es PROPIO
-  Hay función `connectGalaxyToSandra()` para integrar widgets externos compatibles

---

**Última actualización:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

