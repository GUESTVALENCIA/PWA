# 📦 BACKUP: Pipeline Enterprise - Pre Fase 1

**Fecha:** 2026-01-02 01:08:36  
**Motivo:** Backup antes de implementar Fase 1 (TTS WebSocket + PCM + AudioWorklet + Audio Nativo)

## 📋 Contenido del Backup

- ✅ `src/` - Todo el código fuente del servidor (comprimido en backup.zip)
- ✅ `index.html` - Cliente principal (comprimido en backup.zip)
- ✅ `package.json` - Dependencias (comprimido en backup.zip)
- ✅ `assets/audio/` - Archivos de audio nativo (comprimido en backup.zip)

## 🎯 Estado del Sistema Antes del Backup

### Sistema Actual:
- ✅ Deepgram STT streaming funcionando
- ✅ Deepgram TTS REST API (MP3 + base64)
- ✅ Audio nativo: `sandra-conversational.wav` disponible pero NO usado actualmente
- ✅ Cliente: `<audio>` element con base64 → Blob → URL
- ✅ Barge-in básico (bajar volumen)
- ✅ Pipeline secuencial (STT → LLM → TTS)

### Problemas Conocidos:
- ❌ Voz acelerada (playbackRate = 0.5)
- ❌ Latencia alta (~2750ms)
- ❌ MP3 + base64 overhead
- ❌ `<audio>` buffering alto
- ❌ Pipeline secuencial (no paralelo)
- ❌ **Voz no sale del widget** (problema principal a resolver en Fase 1)

## 🚀 Próximos Pasos (Fase 1)

### Objetivos Fase 1:
1. ✅ TTS WebSocket + PCM (linear16) - Deepgram streaming
2. ✅ AudioWorklet para reproducción (reemplazar `<audio>`)
3. ✅ **Soporte para audio nativo** (`sandra-conversational.wav`) para reducir latencia
4. ✅ **Testing principal: Conseguir que salga la voz del widget**

### Cambios Esperados:
- Eliminar MP3 + base64 overhead
- Reproducción PCM directa con AudioWorklet
- Mantener audio nativo como opción de baja latencia
- Mejorar calidad y latencia percibida

## 📝 Notas

- Audio nativo (`sandra-conversational.wav`) se mantiene como opción de baja latencia
- Deepgram TTS WebSocket para respuestas dinámicas
- AudioWorklet reemplaza `<audio>` element
- **Prioridad: Hacer que la voz salga del widget correctamente**
