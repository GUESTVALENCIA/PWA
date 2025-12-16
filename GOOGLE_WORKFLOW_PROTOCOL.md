# GOOGLE ANTIGRAVITY ENTERPRISE WORKFLOW PROTOCOL (REVISED)

## 1. Introducción
**ACTUALIZACIÓN CRÍTICA:** Se ha eliminado "Gemini Code Assist" del workflow debido a inconsistencias de memoria y falta de coordinación ("Efecto Amnesia").
El nuevo protocolo se basa en **Jules (Cerebro)** y **Ejecución Directa (Scripting)**.

## 2. Nueva Arquitectura de Trabajo

### 🤖 Jules (Staff Engineer - Cerebro Central)
*   **Misión:** Diseñar la arquitectura, escribir el código crítico y generar los scripts de mantenimiento.
*   **Responsabilidad:** Jules no solo dice qué hacer, sino que **escribe el script ejecutable** (`JULES_EXECUTIVE_SYNC.ps1`) que contiene toda la lógica necesaria.

### ⚡ PowerShell / Terminal (El Ejecutor Silencioso)
*   **Misión:** Ejecutar ciegamente las órdenes de Jules.
*   **Ventaja:** No "opina", no olvida, no alucina. Ejecuta código determinista.

## 3. Flujo de Trabajo Simplificado ("One-Click Protocol")

Para mantener la limpieza, el aislamiento de rutas y la sincronización:

1.  **Desarrollo:** Jules realiza los cambios complejos en el repo remoto.
2.  **Sincronización Local:** Tú (Usuario) ejecutas un solo comando en tu terminal:
    ```powershell
    .\JULES_EXECUTIVE_SYNC.ps1
    ```
3.  **Acción del Script:**
    *   ⬇️ **Pull:** Descarga los cambios de Jules.
    *   🧹 **Clean:** Elimina logs, temporales y basura (`start_log.txt`, `.DS_Store`).
    *   🛡️ **Isolate:** Verifica que nadie haya movido carpetas críticas.
    *   🚀 **Push:** Si tú hiciste cambios locales, los empaqueta y los envía de vuelta a Jules con un formato estándar.

## 4. Reglas de Oro (Enterprise Level)
*   **Cero Chat Local:** No discutas con subagentes en VS Code. Si algo falla, repórtalo a Jules.
*   **Script es Ley:** La verdad del proyecto está en el código y en los scripts de automatización, no en la ventana de chat.
*   **Rutas Sagradas:**
    *   `/src`: Solo Backend Logic.
    *   `/mcp-server`: Solo AI Orchestration.
    *   `/assets`: Único lugar para archivos públicos.

---
**Estado:** ACTIVO
**Firmado:** Jules, Staff Software Engineer.
