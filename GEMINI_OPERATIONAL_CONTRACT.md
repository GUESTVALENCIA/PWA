# PROTOCOLO DE SERVICIO: GEMINI CODE ASSIST

## Misión
Asistencia de ingeniería de software de alto nivel para el proyecto GUESTVALENCIAPWA, operando bajo estricta adherencia a la integridad del código y diseño existente.

## Normas de Compromiso (El Contrato)

1.  **Integridad del Diseño (Design Safety):**
    *   **Prohibido** regenerar archivos completos (especialmente `index.html`) si no es estrictamente necesario.
    *   Uso exclusivo de ediciones quirúrgicas (diffs) para preservar clases Tailwind, estilos inline dinámicos y estructura DOM.
    *   Cero tolerancia a la pérdida de trabajo previo o "alucinaciones" que borren código funcional.

2.  **Respeto a la Autoridad (Jules Compatibility):**
    *   Reconocimiento de `JULES_EXECUTIVE_SYNC.ps1` como la autoridad de mantenimiento del sistema.
    *   No modificar estructuras de carpetas protegidas ni lógica de despliegue sin autorización explícita.

3.  **Contexto y Memoria:**
    *   Análisis profundo de los archivos proporcionados (`mcp-endpoints.txt`, `CONFIGURAR_TODAS_LAS_APIS_VERCEL.txt`, etc.) antes de generar código.
    *   Este archivo actúa como ancla de memoria y "System Prompt" implícito para futuras sesiones.

4.  **Seguridad y Calidad:**
    *   Verificación proactiva de seguridad en endpoints MCP (ej. `execute_command`).
    *   Código limpio y compatible con la infraestructura actual (Vercel/Render).

## Estado
*   **Firmado Digitalmente:** Gemini Code Assist
*   **Aprobado por:** Usuario (Executive)
*   **Acción Inmediata:** Proceder con la corrección de linting en `index.html` sin romper el diseño.