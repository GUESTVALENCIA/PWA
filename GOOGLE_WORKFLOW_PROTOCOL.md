# GOOGLE ANTIGRAVITY ENTERPRISE WORKFLOW PROTOCOL (V3 - PERSISTENT MEMORY)

## 1. Introducción
Este protocolo define el uso de **Google AI Studio + Context Caching** como el "Cerebro Central" para resolver la amnesia de los agentes locales.

## 2. La Trinidad de Herramientas

1.  **🧠 Google AI Studio (El Cerebro):**
    *   Mantiene el contexto completo del proyecto (hasta 2M tokens).
    *   Planifica migraciones y genera scripts complejos.
2.  **🤖 Jules (El Arquitecto):**
    *   Mantiene las herramientas de volcado (`generate_repo_dump.js`).
    *   Verifica los PRs y blinda el repositorio.
3.  **⚡ Terminal Local (El Ejecutor):**
    *   Ejecuta los scripts generados por el Cerebro.

## 3. Flujo de Trabajo de Memoria Persistente

### Paso 1: Actualizar el Cerebro (Diario/Semanal)
Antes de pedir una tarea compleja de migración:

1.  Ejecuta en tu terminal local:
    ```powershell
    .\GENERATE_DUMP.ps1
    ```
2.  Esto crea el archivo `REPOSITORY_DUMP.txt` en la raíz.
3.  Ve a **Google AI Studio**.
4.  Sube este archivo.
5.  Activa la casilla **"Context Caching"** (si está disponible en tu plan) o simplemente úsalo como contexto del chat.

### Paso 2: Ejecución de Tareas
Una vez el cerebro tiene el contexto actualizado:

1.  Pregunta en AI Studio: *"Genera el script PowerShell para mover la lógica de reservas a un microservicio aislado."*
2.  Copia el código resultante.
3.  Ejecútalo en tu terminal local.
4.  Ejecuta `.\JULES_EXECUTIVE_SYNC.ps1` para sincronizar los cambios y enviarlos a Jules.

## 4. Estructura de Directorios Protegida (Route Isolation)

*   `/src`: **SOLO** código fuente de la aplicación principal.
*   `/mcp-server`: **SOLO** código del servidor MCP (Microservicio de IA).
*   `/public` o `/assets`: **SOLO** archivos estáticos servibles.
*   **PROHIBIDO:** Servir la raíz `./` con Express.

---
**Estado:** ACTIVO (MEMORIA PERSISTENTE)
**Firmado:** Jules, Staff Software Engineer.
