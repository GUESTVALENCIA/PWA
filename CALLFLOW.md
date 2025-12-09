# CALLFLOW.md

## Flujo de llamada conversacional (Sandra IA)

Este documento describe el flujo completo de la llamada conversacional activada desde el widget integrado en la PWA y gestionada por el servidor MCP (Sandra IA).

---

## 1. Activación del widget

* **Disparador:** El usuario hace clic en el botón de "Llamada conserje" en la PWA.

* **Acción inmediata:**

  * Transición visual: Imagen estática de Sandra se desvanece.
  * Inicio del vídeo animado (creado con Sora): Sandra cobra vida.
  * El MCP inicia el handshake de llamada y reserva un canal de voz.

---

## 2. Protocolo de comunicación

* **Canal:** WebSocket (persistente, bidireccional).
* **Servidor:** MCP-SANDRA
* **Cliente:** Widget embebido en la PWA
* **Tiempo de espera (timeout):** 5s para handshake

---

## 3. Inicio de la llamada

* **Mensaje de bienvenida:**

  * Se dispara el TTS de Cartesia Voice desde el MCP.
  * Audio sincronizado con los movimientos del video.
  * Comienza la transcripción automática (Deepgram STT).

---

## 4. Proceso conversacional

* **Entrada de usuario:**

  * Audio del usuario se transmite vía WebSocket al MCP.
  * Deepgram convierte audio en texto.
  * Sandra IA (orquestación interna) procesa la intención del usuario.

* **Lógica del sistema:**

  * Sandra ejecuta respuesta desde su modelo (Qwen/DeepSeek).
  * TTS de Cartesia genera audio con voz de "Sandra".
  * El sistema sincroniza el audio con los movimientos del video.

---

## 5. Sincronización audiovisual

* **Video en pantalla:** Reproduce bucle de Sandra atenta.
* **Audio:** Se inyecta desde Cartesia TTS.
* **Sincronización:** Ajustes por latencia automática desde el MCP (objetivo < 700ms).

---

## 6. Finalización de la llamada

* **Desencadenantes:**

  * Inactividad prolongada (90s).
  * Usuario cuelga manualmente.
  * Error de red o servidor.

* **Acciones:**

  * Video se desvanece a imagen estática.
  * Canal WebSocket se cierra.
  * Se registra el log de la conversación en el MCP.

---

## 7. Logs y monitoreo

* MCP registra:

  * ID de sesión
  * Tiempos de inicio y fin
  * Latencia media
  * Transcripción completa
  * Intervenciones de Sandra

---

## 8. Recomendaciones para el equipo

* ✅ Validar sincronización de audio y video (latencia < 700ms).
* ✅ Confirmar funcionalidad en navegadores modernos (Chrome, Safari, Edge).
* ✅ Verificar transcripción en distintos acentos.
* ✅ Simular condiciones de red variable para stress test.
* ✅ Garantizar fallback si Cartesia o Deepgram fallan.

---

## 9. Próximos pasos

* Ajustes en la sincronización labial.
* Mejora de transiciones nocturnas/diurnas.
* Entrenamiento de Sandra con data de interacciones reales.
* Despliegue de sub-modelos específicos por alojamiento.

---

## ✅ Estado de Implementación

**Implementado completamente en `assets/js/uig-sandra.js`:**

- ✅ Activación del widget con transición visual
- ✅ Protocolo WebSocket con timeout de 5s
- ✅ Mensaje de bienvenida sincronizado
- ✅ Proceso conversacional completo (STT → LLM → TTS)
- ✅ Sincronización audiovisual con ajuste de latencia
- ✅ Finalización de llamada (inactividad, manual, error)
- ✅ Logs y monitoreo completo

---

**Archivo preparado para producción. Puede compartirse con el equipo técnico.**

