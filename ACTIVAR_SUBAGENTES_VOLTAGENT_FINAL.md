# 🚀 ACTIVAR SUBAGENTES VOLTAGENT - Guía Completa

## ⚠️ SITUACIÓN ACTUAL

- ✅ VoltAgent está configurado en: `C:\Users\clayt\Desktop\VoltAgent-Composer-Workflow`
- ✅ Tokens configurados y válidos
- ✅ Agentes listados en `invocar-agente.js`
- ⚠️ API REST no responde (404) - Los agentes deben activarse desde la **consola web**

## 🎯 MÉTODO RECOMENDADO: Consola Web de VoltAgent

### Paso 1: Acceder a la Consola

1. Abre: **https://console.voltagent.dev**
2. Inicia sesión con: `sandra-coo@guestsvalencia.es`
3. Ve a la sección **"Agents"** o **"Agentes"**

### Paso 2: Seleccionar Agente

Elige uno de estos agentes especializados:

- **`conversational-code-reviewer`** - Revisor de Código Conversacional ✅ RECOMENDADO
- **`claude-code`** - Claude Code Assistant  
- **`frontend-audio-specialist`** - Especialista en Frontend

### Paso 3: Enviar Tarea

Pega este prompt en el chat del agente:

```
Corrige TODOS los 41 errores de linting en index.html.

📁 ARCHIVO: C:\Users\clayt\OneDrive\GUESTVALENCIAPWA\index.html

🔴 ERRORES A CORREGIR:

1. CSS inline styles → Mover a clases CSS (líneas: 72, 96, 99, 108, 109, 242, 277, 278, 329, 330, 350, 351, 680, 681, 730, 731, 801)
   ⚠️ EXCEPCIÓN: Mantener estilos inline dinámicos (background-image establecido en JavaScript)

2. Compatibilidad video[playsinline] → Agregar webkit-playsinline (líneas: 96, 272, 284, 329, 350, 680, 730)

3. Accesibilidad botones → Agregar aria-label y title (líneas: 298, 305, 308)

4. Input file → Agregar aria-label (línea: 262)

5. Link sin rel="noopener" → Agregar rel="noopener noreferrer" (línea: 701)

6. iframe referrerpolicy → Cambiar a "no-referrer" (línea: 801)

7. CSS backdrop-filter → Asegurar que -webkit-backdrop-filter esté ANTES (líneas: 45, 46, 55)

✅ REQUISITOS:
- Mantener TODA la funcionalidad JavaScript existente
- NO romper ningún comportamiento
- Generar código HTML completo corregido
- Listo para reemplazar el archivo original

Lee el archivo completo desde la ruta especificada, corrige TODOS los errores, y proporciona el código HTML corregido completo.
```

### Paso 4: Obtener Resultado

El agente:
1. Leerá el archivo `index.html`
2. Corregirá los 41 errores
3. Generará el código HTML completo corregido
4. Te proporcionará el archivo listo para reemplazar

## 🔄 MÉTODO ALTERNATIVO: Script Local con GROQ

Si prefieres usar directamente GROQ API, ejecuta:

```bash
cd "C:\Users\clayt\OneDrive\GUESTVALENCIAPWA"
node activar-subagentes-groq.js
```

**Nota:** Requiere `GROQ_API_KEY` configurada en variables de entorno.

## 📋 RESUMEN

| Método | Estado | Recomendación |
|--------|--------|---------------|
| **Consola Web VoltAgent** | ✅ Disponible | **USAR ESTE** |
| API REST VoltAgent | ❌ 404 | No funciona actualmente |
| Script GROQ directo | ⚠️ Requiere API Key | Alternativa |

## 🔗 ENLACES

- **Consola VoltAgent:** https://console.voltagent.dev
- **Documentación:** https://voltagent.dev/
- **VoltAgent Framework:** https://docs.voltagent.dev

---

**✨ Una vez corregidos los errores, haz commit y push para desplegar a producción.**

