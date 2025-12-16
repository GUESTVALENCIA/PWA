# PLAN DE MIGRACIÓN: ESTRATEGIA DE MEMORIA PERSISTENTE (GOOGLE GALAXY)

## 1. El Diagnóstico: ¿Por qué fallan los agentes locales?
El problema con Gemini Code Assist (y otros agentes de IDE) es que sufren de **"Amnesia de Sesión"**. Cada vez que abres una ventana o cierras el editor, pierden el contexto. Para una migración masiva nivel Enterprise, esto es inaceptable.

## 2. La Solución: Google AI Studio + Context Caching
La única forma de tener "Memoria Persistente" real con las herramientas actuales de Google es utilizar **Gemini 1.5 Pro con Context Caching** en **Google AI Studio**.

### ¿Qué es Context Caching?
Es una tecnología que nos permite "congelar" el estado de todo tu repositorio (archivos, estructura, reglas) en la memoria de Gemini.
*   **Capacidad:** Hasta 2 millones de tokens (suficiente para todo tu código, documentación y logs).
*   **Persistencia:** El contexto se guarda y se reutiliza. No tienes que volver a explicarle quién es Sandra ni cómo es la arquitectura.

## 3. El Nuevo Flujo de Trabajo (Workflow Trinity)

Este plan reemplaza a los agentes "tontos" por un cerebro centralizado.

### FASE 1: La Creación del Cerebro (El "Contexto Maestro")
1.  **Extracción del Estado Local:**
    *   Usaremos un script (que yo crearé) para generar un `REPOSITORY_DUMP.txt`. Este archivo contendrá todo tu código actual concatenado.
2.  **Carga en Google AI Studio:**
    *   Subes este archivo a Google AI Studio.
    *   Activas **"Context Caching"**.
3.  **Instrucción de Sistema (System Prompt):**
    *   Le damos la identidad: *"Eres el Arquitecto de Migración Enterprise de GuestsValencia. Tu memoria contiene el estado exacto de los archivos locales."*

### FASE 2: La Ejecución Local (Jules + Gemini CLI)
Una vez el cerebro está activo en la nube:

1.  **Consulta:** Tú le preguntas al Cerebro (AI Studio): *"Genera el script para mover todos los archivos de frontend a /public y limpiar la raíz."*
2.  **Respuesta:** El Cerebro, conociendo *exactamente* tu estructura (porque la tiene en caché), genera un script `.ps1` perfecto y sin alucinaciones.
3.  **Acción:** Tú copias ese script y lo ejecutas con **Gemini CLI** (o directamente en PowerShell).
4.  **Verificación:** Yo (Jules) verifico en el repo que la estructura final cumpla con el estándar Enterprise.

## 4. Pasos Inmediatos para Ti

1.  **Aprobar este Plan:** Confírmame si quieres proceder con la estrategia de Context Caching.
2.  **Preparación:** Yo generaré el script `GENERATE_REPO_DUMP.js` para que puedas extraer tu contexto local en un solo click.
3.  **Ejecución:** Tú subirás ese contexto a tu cuenta Pro de Google AI Studio.

---
**Ventajas:**
*   ✅ **Memoria Infinita:** No olvida nada mientras el caché esté activo.
*   ✅ **Cero Alucinaciones:** Basa sus respuestas en tus archivos reales, no en suposiciones.
*   ✅ **Sincronización:** Alineado con tu suscripción "Antigravity".

¿Procedemos a crear el script de extracción para alimentar al Cerebro?
