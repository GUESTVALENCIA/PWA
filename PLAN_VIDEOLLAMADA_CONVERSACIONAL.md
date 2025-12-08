# Plan de Implementación: Videollamada Conversacional en Tiempo Real

## Objetivo
Convertir el hero de imagen estática a video animado en tiempo real cuando el usuario acepta una llamada conversacional con Sandra.

## Arquitectura Técnica

### Componentes Necesarios:

1. **D-ID API o Alternativa**
   - Talking Photo: Animar imagen estática con movimiento de labios
   - Streaming en tiempo real
   - Sincronización audio/video

2. **Flujo de Llamada:**
   ```
   Usuario → Widget → "¿Llamada conversacional?" → Acepta
   ↓
   Ringtone → Transición Hero (imagen → video)
   ↓
   Sandra coge teléfono → Video animado en tiempo real
   ↓
   Audio usuario → STT → Gemini → TTS → D-ID → Video animado
   ↓
   Streaming al hero
   ```

3. **APIs a Integrar:**
   - D-ID API (talking photos) - Requiere API key
   - O alternativa: HeyGen, Synthesia
   - Cartesia TTS (ya configurado)
   - Gemini Live (STT + respuesta)

## Implementación por Fases

### Fase 1: Configuración D-ID API
- [ ] Obtener API key de D-ID
- [ ] Agregar al .env
- [ ] Crear endpoint en server.js para D-ID
- [ ] Probar con imagen estática

### Fase 2: Botón Llamada Conversacional
- [ ] Agregar botón en widget de Sandra
- [ ] Lógica de aceptación/rechazo
- [ ] Estado de llamada activa

### Fase 3: Transición Hero
- [ ] Ringtone al iniciar llamada
- [ ] Transición CSS: imagen → video
- [ ] Video player en hero para streaming

### Fase 4: Streaming en Tiempo Real
- [ ] WebSocket o Server-Sent Events
- [ ] Audio usuario → STT (Gemini Live)
- [ ] Respuesta Gemini → TTS (Cartesia)
- [ ] TTS → D-ID → Video animado
- [ ] Streaming video al hero

### Fase 5: Optimización
- [ ] Reducir latencia (<1 segundo)
- [ ] Mejorar calidad de video
- [ ] Sincronización audio/video perfecta

## Notas Técnicas

- **Latencia objetivo:** <1 segundo
- **Formato video:** MP4 streaming
- **Audio:** WebRTC o MediaRecorder API
- **Sincronización:** Buffer mínimo para evitar cortes

## Próximos Pasos

1. Verificar acceso a D-ID API
2. Implementar endpoint básico
3. Probar con imagen actual
4. Integrar con widget
5. Implementar streaming

