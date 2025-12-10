# 📋 INSTRUCCIONES: Cómo Inyectar el Widget de Sandra

---

## 🎯 OBJETIVO

Inyectar el widget conversacional de Sandra IA directamente en cualquier plataforma o sitio web. El widget es completamente autocontenido y no requiere archivos externos.

---

## 📁 ARCHIVO A USAR

**Archivo:** `WIDGET_INYECTABLE.js`

Este archivo contiene TODO el código necesario:
- ✅ Clase `SandraWidget` completa
- ✅ Inicialización automática
- ✅ Configuración incluida
- ✅ Sin dependencias externas

---

## 🔧 PASOS PARA INYECTAR EL WIDGET

### 1. Obtener el Código

1. Abre el archivo `WIDGET_INYECTABLE.js`
2. Copia **TODO** el contenido del archivo

---

### 2. Inyectar en tu Plataforma

**Método 1: Directamente en HTML**
- Abre el HTML de tu página
- Busca el cierre de `</body>`
- Pega el código justo ANTES de `</body>`
- Guarda y publica

**Método 2: En plataformas con Custom Code**
- Accede a la sección de código personalizado de tu plataforma
- Crea un nuevo bloque de código JavaScript
- Pega el código completo
- Configura para ejecutarse al final del body

---

### 3. Configurar Variables (OPCIONAL)

Si necesitas cambiar la URL del servidor MCP, puedes agregar código ANTES del widget:

```javascript
// Configuración personalizada (opcional)
window.MCP_SERVER_URL = 'https://tu-servidor-mcp.com';
window.WIDGET_ENABLED = true;
window.SANDRA_TOKEN = 'tu-token-opcional';
```

O simplemente edita estas líneas en el archivo antes de pegarlo:

```javascript
// En las primeras líneas del archivo
window.MCP_SERVER_URL = window.MCP_SERVER_URL || 'https://mcp.sandra-ia.com';
window.WIDGET_ENABLED = window.WIDGET_ENABLED !== false;
window.SANDRA_TOKEN = window.SANDRA_TOKEN || '';
```

---

### 4. Guardar y Publicar

1. Guarda los cambios en tu plataforma/sitio
2. Publica tu sitio
3. Verifica que el widget aparece en la esquina inferior derecha

---

## ✅ VERIFICACIÓN

Después de publicar, deberías ver:

1. **Botón flotante** en la esquina inferior derecha
   - Color: Gradiente azul-púrpura
   - Icono: Micrófono
   - Indicador verde pulsante

2. **Al hacer clic:**
   - Solicita permiso de micrófono
   - Se conecta al servidor MCP
   - Reproduce mensaje de bienvenida
   - Inicia llamada conversacional

3. **En la consola del navegador** (F12):
   - `✅ SandraWidget inicializado`
   - Logs del flujo conversacional

---

## 🔧 PERSONALIZACIÓN

### Cambiar Posición del Widget

Para cambiar la posición, edita esta línea en el código:

```javascript
container.style.cssText = 'position: fixed !important; bottom: 1rem !important; right: 1rem !important; ...';
```

**Ejemplos:**
- Esquina superior derecha: `top: 1rem; right: 1rem;`
- Esquina inferior izquierda: `bottom: 1rem; left: 1rem;`
- Centrado inferior: `bottom: 1rem; left: 50%; transform: translateX(-50%);`

### Cambiar Tamaño del Botón

Edita estas líneas:

```javascript
// En createWidgetUI()
width: 4rem; height: 4rem;  // Cambiar a 3rem, 5rem, etc.
width: 2rem; height: 2rem;  // Tamaño del icono SVG
```

### Cambiar Colores

Edita el gradiente:

```javascript
background: linear-gradient(to bottom right, #3b82f6, #9333ea);
// Cambiar a tus colores preferidos, ej:
// background: linear-gradient(to bottom right, #10b981, #059669); // Verde
// background: linear-gradient(to bottom right, #f59e0b, #d97706); // Naranja
```

---

## ⚠️ SOLUCIÓN DE PROBLEMAS

### El widget no aparece

1. **Verifica la consola** (F12) para errores
2. **Verifica que `WIDGET_ENABLED` sea `true`**
3. **Verifica que el código se inyectó correctamente** en tu plataforma
4. **Limpia caché del navegador** (Ctrl+Shift+R)

### Error de conexión WebSocket

1. **Verifica la URL del servidor MCP** en `MCP_SERVER_URL`
2. **Verifica que el servidor esté funcionando**
3. **Verifica CORS** en el servidor MCP

### El micrófono no funciona

1. **Verifica permisos del navegador** (Configuración → Privacidad → Micrófono)
2. **Verifica que uses HTTPS** (requerido para acceso al micrófono)
3. **Verifica la consola** para errores específicos

---

## 📝 NOTAS IMPORTANTES

1. **El widget es autocontenido**: No necesita archivos externos
2. **Compatible con cualquier plataforma**: Usa IIFE para evitar conflictos
3. **Z-index alto**: El widget usa `z-index: 99999` para estar siempre visible
4. **Sin dependencias**: No requiere jQuery, React, Vue, etc.
5. **Sistema Galaxy**: El widget se conecta al sistema Galaxy/MCP que gestiona las llamadas

---

## 🔗 INTEGRACIÓN CON SISTEMA GALAXY

El widget está diseñado para trabajar con el **Sistema Galaxy**, que es:

- ✅ **Sistema externo e independiente**
- ✅ **Reutilizable en múltiples proyectos**
- ✅ **Gestiona el backend de Sandra IA**
- ✅ **Servidor MCP**: `https://mcp.sandra-ia.com` (o tu servidor personalizado)

**Endpoints que usa el widget:**
- `/api/video/ambientation` - Obtener video de ambientación
- `/api/audio/welcome` - Mensaje de bienvenida
- `/api/conserje/voice-flow` - Flujo de voz (STT → LLM → TTS)
- WebSocket - Comunicación en tiempo real

---

## ✅ CHECKLIST FINAL

- [ ] Archivo `WIDGET_INYECTABLE.js` copiado completo
- [ ] Código inyectado en tu plataforma/sitio
- [ ] Configurado correctamente (ubicación antes de `</body>`)
- [ ] Variables configuradas (MCP_SERVER_URL)
- [ ] Sitio publicado
- [ ] Widget visible en la esquina inferior derecha
- [ ] Al hacer clic, solicita permiso de micrófono
- [ ] Se conecta correctamente al servidor MCP
- [ ] Mensaje de bienvenida se reproduce

---

**¡Listo!** El widget de Sandra está inyectado y funcionando. 🎉

