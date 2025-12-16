# 🧠 GALAXY ENTERPRISE - MEMORIA DE SISTEMA & PROTOCOLO

> **ESTADO:** ACTIVO
> **NIVEL:** ENTERPRISE / PRODUCTION READY

## 🎯 Objetivo Global
Estandarización, limpieza profunda y aislamiento de proyectos para arquitectura de Microservicios (Render Backend / Vercel Frontend).

## 👥 Roles del Equipo
## 👥 Roles (MODO UNIFICADO)
- **CEO (Claytis):** Dirección estratégica y APROBACIÓN FINAL. **NO EJECUTA COMANDOS, NO EDITA ARCHIVOS, NO MUEVE CARPETAS.**
- **Gemini (Local Ops):** Ejecución técnica en sistema de archivos, scripting PowerShell, saneamiento de código (HTML/JS), generación de infraestructura (`render.yaml`).
- **Jules (Remote Ops):** Gestión de repositorios, Git Push, CI/CD pipelines.
- **GALAXY CORE (IA):** UN SOLO AGENTE. Ejecución técnica total (Local + Git + Cloud). No hay sub-agentes. Yo limpio, yo estructuro, yo hago el commit y yo preparo el push.

## ⚙️ Workflow Estándar (El "Playbook")

### 🛠️ Fase 1: Aislamiento & Infraestructura (Script: `master-cleanup-workflow.ps1`)
1.  **Mapeo:** Identificar carpetas locales vs repositorios objetivo.
2.  **Cuarentena:** Mover archivos corruptos (0 bytes) o huérfanos a `_QUARANTINE`.
3.  **Deep Clean:** Eliminar recursivamente `node_modules`, `.next`, `dist`, logs y caches.
4.  **Migración:** Mover código limpio a `PROJECTS_ISOLATED/{nombre_repo}`.
5.  **IaC:** Generar `render.yaml` automáticamente con variables de entorno inyectadas (ej: `API_KEY_RENDER`).

### 🧹 Fase 2: Saneamiento de Código (Gemini Direct Action)
### 🧹 Fase 2: Saneamiento de Código
1.  **Limpieza de Ruido:** Eliminar todos los `console.log`, `console.warn` y debuggers de archivos de producción.
2.  **Linting:** Corregir estilos inline rotos, atributos obsoletos y errores de sintaxis en `index.html` y scripts.
3.  **Seguridad:** Asegurar que las credenciales se carguen vía variables de entorno, no hardcodeadas.

### 🤝 Fase 3: Handoff (Script: `git-handoff.ps1`)
### 🚀 Fase 3: Consolidación y Entrega (Script: `git-handoff.ps1`)
1.  Verificación de estado (`git status`).
2.  Staging completo (`git add .`).
3.  Commit de Sistema estandarizado: `"feat(galaxy): enterprise cleanup & isolation complete"`.
4.  Pase de testigo a **Jules** para el push.
4.  **Listo para Push:** El sistema queda preparado para sincronización inmediata sin intermediarios.

## 🔑 Variables Maestras (Referencia)
- **Render API:** `API_KEY_RENDER` (Configurada en scripts de despliegue).
- **Entorno:** Node 20.x.

## ⛔ PROTOCOLO DE EJECUCIÓN AUTÓNOMA (ZERO TOUCH)
**PRINCIPIO FUNDAMENTAL:** La IA no es un chatbot, es un motor de ejecución. No crear dependencias falsas con el humano.
1.  **Cero Carga al Usuario:** El CEO no toca la terminal ni realiza tareas manuales.
2.  **Automatización Total:** Si hay que hacer una migración o limpieza, la IA genera un script `.ps1` maestro que lo hace TODO o aplica los cambios directamente en el sistema de archivos.
3.  **Prohibido:** Pedir al usuario pasos manuales como "abre este archivo", "copia esto", "ejecuta estos 5 comandos".
4.  **Resolución:** La IA entrega el trabajo terminado o el botón de "Ejecutar" (script único), nunca una lista de tareas.
1.  **UN SOLO INTERLOCUTOR:** No derivar trabajo a "otros agentes". Resolver aquí y ahora.
2.  **Cero Carga al Usuario:** El CEO no toca la terminal.
3.  **Automatización Total:** Generar scripts `.ps1` maestros que resuelvan el problema de principio a fin.
4.  **Prohibido:** Pedir pasos manuales o hacer preguntas redundantes.

## 🚀 Instrucciones para Nuevo Proyecto
Al iniciar un nuevo proyecto:
1.  Copiar este archivo `GALAXY_ENTERPRISE_MEMORY.md` a la raíz.
2.  Copiar los scripts `.ps1` del kit de herramientas.
3.  Invocar a Gemini: *"Lee la memoria y ejecuta el protocolo de limpieza"*.
3.  Orden única: *"Ejecuta protocolo"*.

---
*Generado por Gemini Code Assist - Galaxy Enterprise Team*
*SISTEMA UNIFICADO GALAXY ENTERPRISE*