# 📋 WIDGET_WORKFLOW.md

## ✨ Objetivo

Instrucciones para integrar, habilitar y verificar el funcionamiento del **widget conversacional de Sandra IA** en entorno de producción.

---

## 🔧 Integración del UIG (User Interaction Gateway)

### 📁 Ubicación del código

* **Repositorio**: PWA Vercel (frontend)
* **Archivo del widget**: `assets/js/uig-sandra.js`
* **Archivo de montaje**: `index.html` (al final, antes de `</body>`)

### ✅ Pasos técnicos

1. **Importar script del widget en `index.html`:**

```html
<script src="/assets/js/uig-sandra.js"></script>
```

2. **Verificar variable de entorno activada:**

```javascript
// En index.html o configuración
window.WIDGET_ENABLED = true;
window.MCP_SERVER_URL = 'https://mcp.sandra-ia.com'; // URL del servidor MCP
```

3. **Comprobar visibilidad:**

   * El widget se auto-inicializa al cargar la página
   * Verifica que no tenga `display: none`, `visibility: hidden`, ni `opacity: 0`
   * Confirmar `z-index: 9999`

4. **Revisar condiciones de entorno:**

   * El widget se carga siempre si `WIDGET_ENABLED !== false`
   * Para deshabilitar: `window.WIDGET_ENABLED = false` o añadir `data-widget-disabled` al body

5. **Pruebas de compatibilidad:**

   * Escritorio y móvil
   * Navegadores: Chrome, Firefox, Safari
   * Verificar permisos de micrófono

---

## ☎️ Activación del Flujo de Llamada Conversacional

1. **Click en el botón del widget** inicia el flujo.

2. Se dispara la llamada al servidor MCP:

```javascript
POST https://mcp.sandra-ia.com/api/conserje/voice-flow
{
  "action": "start_call",
  "timezone": "Europe/Madrid"
}
```

3. **Servidor MCP responde:**

   * Inicia **transcripción en tiempo real** (Deepgram)
   * Solicita respuesta a modelo (Qwen / Gemini / DeepSeek)
   * Devuelve **respuesta TTS** para reproducir (Cartesia)
   * Coordinación con **video de Sandra en transición activa**

4. **Flujo completo:**

   - Usuario habla → MediaRecorder captura audio
   - Audio enviado → STT (Deepgram) → Texto
   - Texto → LLM (Qwen/Gemini) → Respuesta
   - Respuesta → TTS (Cartesia) → Audio
   - Audio reproducido → Usuario escucha
   - Ciclo se repite

---

## 📊 Validaciones Finales

* [ ] Widget visible en producción (https://pwa-*.vercel.app/)
* [ ] Carga automática al abrir la web
* [ ] Inicia llamada sin errores
* [ ] Transcripción activa correctamente
* [ ] Voz de Sandra se reproduce sin cortes
* [ ] Video se sincroniza en transición sin lag
* [ ] Fin de llamada correctamente manejado
* [ ] Permisos de micrófono funcionan

---

## 🔗 Integración con Servidor MCP

### Endpoints utilizados:

1. **Iniciar llamada**: `POST /api/conserje/voice-flow`
2. **Welcome message**: `POST /api/audio/welcome`
3. **Ambientación**: `GET /api/video/ambientation?timezone=...`
4. **Flujo de voz**: `POST /api/conserje/voice-flow` (audio)

### WebSocket:

```
ws://mcp.sandra-ia.com?token=...
```

Mensajes:
```json
{
  "route": "conserje",
  "action": "message",
  "payload": { "message": "...", "timezone": "..." }
}
```

---

## ⚙️ Configuración

### Variables de entorno (en Vercel o código):

```javascript
window.WIDGET_ENABLED = true;
window.MCP_SERVER_URL = 'https://mcp.sandra-ia.com';
window.SANDRA_TOKEN = 'tu_token'; // Opcional para autenticación
```

### Auto-detección:

El widget detecta automáticamente:
- **Local**: `http://localhost:4042`
- **Producción**: `https://mcp.sandra-ia.com` o variable de entorno

---

## 📆 Próximos pasos

* ✅ Implementación completa del widget UIG
* ⏳ Integración en `index.html`
* ⏳ Verificar implementación completa
* ⏳ Prueba real con cliente / usuario
* ⏳ Recoger feedback
* ⏳ Pulir detalles con el equipo técnico

---

## ⚠️ Notas

* Este widget es parte del sistema MCP-SANDRA.
* No modificar directamente sin validación.
* En caso de duda, contactar con dirección técnica o responsable IA.
* El widget requiere permisos de micrófono del navegador.

---

> "Este componente representa el alma visible de Sandra IA frente al usuario. Cada detalle cuenta."

---

## 🐛 Troubleshooting

### Widget no aparece:
- Verificar `WIDGET_ENABLED !== false`
- Comprobar que el script se carga: `<script src="/assets/js/uig-sandra.js"></script>`
- Revisar consola del navegador

### Error al iniciar llamada:
- Verificar `MCP_SERVER_URL` correcto
- Comprobar permisos de micrófono
- Verificar que el servidor MCP esté corriendo

### Audio no se reproduce:
- Verificar que TTS (Cartesia) esté configurado en MCP
- Comprobar formato de audio (MP3 base64)

---

**Estado**: ✅ Widget implementado, pendiente integración en `index.html`

