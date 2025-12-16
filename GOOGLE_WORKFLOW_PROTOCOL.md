# GOOGLE ANTIGRAVITY ENTERPRISE WORKFLOW PROTOCOL

## 1. Introducción
Este documento define el protocolo de trabajo estricto para el ecosistema "GuestsValencia Galaxy", integrando los tres agentes de Google para garantizar un nivel de desarrollo "Enterprise":
1.  **Jules (Agente Autónomo - Cloud/Repo):** Ejecución pesada, arquitectura, refactorización y blindaje del núcleo.
2.  **Gemini CLI (Agente Local - Terminal):** Gestión de archivos masivos, sincronización, limpieza local y despliegue.
3.  **Gemini Code Assist (Agente Copiloto - IDE):** Asistencia en tiempo real, autocompletado inteligente y revisión de código.

## 2. Roles y Responsabilidades

### 🤖 Jules (Yo - El Ingeniero)
*   **Entorno:** Repositorio Remoto / Sandbox.
*   **Misión:** Mantener la integridad del código fuente.
*   **Tareas Exclusivas:**
    *   Refactorización de la arquitectura (evitar cruce de rutas).
    *   Creación y mantenimiento de Tests Unitarios e Integrales.
    *   Blindaje de seguridad (Security Hardening).
    *   Revisión de Pull Requests complejos.
*   **Comando de Activación:** Chat directo en la interfaz de Jules.

### 💻 Gemini CLI (El Orquestador Local)
*   **Entorno:** Tu Terminal Local (PowerShell / Bash).
*   **Misión:** Gestión del sistema de archivos y despliegue.
*   **Tareas Exclusivas:**
    *   `cleanup`: Ejecución de scripts de limpieza (`master-cleanup-workflow.ps1`).
    *   `sync`: Sincronización de cambios locales al repositorio (pre-Jules).
    *   `handoff`: Ejecución del protocolo de entrega (`git-handoff.ps1`).
    *   Inyección de variables de entorno en tiempo de despliegue (no en código).

### 🧠 Gemini Code Assist (El Copiloto)
*   **Entorno:** Visual Studio Code / Cursor / Google IDX.
*   **Misión:** Aceleración del desarrollo diario.
*   **Tareas Exclusivas:**
    *   Explicación de cambios realizados por Jules.
    *   Autocompletado de código siguiendo el estilo "Enterprise".
    *   Generación de documentación JSDoc automática.
    *   Detección temprana de errores de sintaxis o tipos.

## 3. Protocolo de Aislamiento de Rutas (Strict Isolation)

Para evitar que los proyectos se "crucen" y las rutas se rompan:

1.  **Estructura de Directorios Inmutable:**
    *   `/src`: **SOLO** código fuente de la aplicación principal (Backend API Gateway).
    *   `/mcp-server`: **SOLO** código del servidor MCP (Microservicio de IA).
    *   `/public`: **SOLO** archivos estáticos servibles (imágenes, favicon, robots.txt). **NUNCA** servir la raíz `./`.
    *   `/docs`: Documentación del proyecto.

2.  **Reglas de Enrutamiento:**
    *   El servidor principal (`server.js`) **NO** debe servir archivos estáticos fuera de `/public` o carpetas explícitamente permitidas (`/assets`).
    *   Cualquier ruta no definida explícitamente debe retornar `404 Not Found` (o JSON de error) inmediatamente. No hay "fallback" a index.html a menos que sea una SPA explícitamente configurada en una ruta específica.

## 4. Flujo de Trabajo Diario (Workflow)

1.  **Inicio (Gemini CLI):**
    *   Ejecutar `git pull` para bajar los cambios blindados de Jules.
    *   Ejecutar `npm install` si Jules ha cambiado dependencias.

2.  **Desarrollo (Gemini Code Assist):**
    *   Editar código en VS Code.
    *   Usar Code Assist para generar boilerplate o tests rápidos.

3.  **Cierre y Entrega (Gemini CLI -> Jules):**
    *   Ejecutar script de limpieza local (si aplica).
    *   Ejecutar `.\git-handoff.ps1` (proporcionado por Gemini).
    *   Esto crea un commit limpio y estandarizado.
    *   Hacer `git push`.

4.  **Refinamiento (Jules):**
    *   Avisar a Jules: "He subido cambios, por favor verifica, blinda y despliega".
    *   Jules ejecuta tests, refactoriza si es necesario y asegura que el "Level Enterprise" se mantenga.

---
**Firmado:** Jules, Staff Software Engineer.
