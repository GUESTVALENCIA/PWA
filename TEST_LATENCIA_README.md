# 🧪 Script de Test de Latencia - Pipeline Completo

## 📋 Descripción

Script ejecutable que mide la latencia **REAL** de todo el pipeline de llamada conversacional, desde que se descuelga hasta que se recibe la respuesta del modelo.

## 🎯 Métricas Medidas

1. **Conexión WebSocket** - Tiempo real de conexión
2. **Ringtones** - 2 ringtones simulados (4 segundos total)
3. **Generación Saludo (TTS)** - Tiempo REAL desde servidor
4. **Transcripción (STT)** - Tiempo REAL desde servidor
5. **Respuesta IA** - Tiempo REAL desde servidor
6. **Audio Respuesta (TTS)** - Tiempo REAL desde servidor
7. **Latencia Total** - Tiempo completo del pipeline

## 🚀 Uso

```bash
# Ejecutar test
node scripts/test-latencia-llamada.js
```

## ⚙️ Configuración

El script lee las variables de entorno desde `.env`:

```env
MCP_SERVER_URL=wss://pwa-imbf.onrender.com
```

O usa la URL por defecto: `wss://pwa-imbf.onrender.com`

## 📊 Salida del Test

El script muestra:

1. **Métricas en tiempo real** - Cada fase se muestra cuando se completa
2. **Resumen de latencias** - Tabla con todos los tiempos
3. **Desglose por componentes** - Red, TTS, STT, IA, etc.
4. **Análisis y recomendaciones** - Sugerencias de optimización

### Ejemplo de Salida:

```
🧪 INICIANDO TEST DE LATENCIA

📡 Conectando a: wss://pwa-imbf.onrender.com

✅ WebSocket conectado (234ms)

📞 Simulando ringtones (2x = 4s)...

✅ Ringtones completados

📤 Enviando mensaje "ready"...
✅ Saludo recibido (REAL) (2.34s)
   Texto: "Hola, soy Sandra, tu asistente inteligente de Guests Valencia, ¿en qué puedo ayudarle hoy?"

🎤 Enviando transcripción de prueba...
✅ Transcripción procesada (REAL) (0.87s)
   Texto: "Hola Sandra, ¿cómo estás?"

🤖 Esperando respuesta IA (REAL)...
✅ Respuesta IA generada (REAL) (1.95s)
   Texto: "¡Hola! Estoy muy bien, gracias por preguntar..."

🎙️ Esperando audio respuesta (TTS REAL)...
✅ Audio respuesta recibido (REAL) (1.67s)
   Texto: "¡Hola! Estoy muy bien, gracias por preguntar..."

============================================================
📊 RESUMEN DE LATENCIAS
============================================================

1. Conexión WebSocket:              234ms
2. Ringtones (2x):                  4.00s
3. Generación Saludo (TTS):         2.34s
4. Transcripción (STT):             0.87s
5. Respuesta IA:                    1.95s
6. Audio Respuesta (TTS):           1.67s

⏱️  LATENCIA TOTAL:                  11.09s

------------------------------------------------------------
📈 DESGLOSE POR COMPONENTES:

  • Red (WebSocket):                234ms
  • TTS (Saludo + Respuesta):        4.01s
  • STT (Transcripción):             0.87s
  • IA (Procesamiento):              1.95s
  • Ringtones:                       4.00s
  • Otros (overhead):                0.16s

------------------------------------------------------------
🔍 ANÁLISIS:

⚠️  Latencia ACEPTABLE (5-10s)

💡 Recomendación: Optimizar TTS (considerar WebSocket streaming)
```

## 🔍 Interpretación de Resultados

### Latencia Excelente (< 5s)
- ✅ Pipeline optimizado
- ✅ Experiencia de usuario fluida

### Latencia Aceptable (5-10s)
- ⚠️ Funcional pero mejorable
- 💡 Considerar optimizaciones

### Latencia Alta (> 10s)
- ❌ Necesita optimización urgente
- 💡 Revisar cada componente

## 🛠️ Solución de Problemas

### Error: "WebSocket connection failed"
- Verificar que el servidor esté corriendo
- Verificar `MCP_SERVER_URL` en `.env`
- Verificar firewall/proxy

### Timeout: "Test no completado en 30s"
- El servidor puede estar lento
- Verificar logs del servidor
- Aumentar timeout si es necesario

### No se recibe saludo
- Verificar que el servidor esté enviando el saludo automáticamente
- Verificar logs del servidor
- Verificar configuración de Deepgram TTS

## 📝 Notas

- El script mide tiempos **REALES** del servidor, no simulados
- Los ringtones son simulados (4s total) porque son del cliente
- El test envía una transcripción simulada para activar el pipeline completo
- El timeout es de 30 segundos por defecto

## 🔄 Próximos Pasos

Después de ejecutar el test:

1. **Analizar latencias** - Identificar cuellos de botella
2. **Optimizar componentes lentos** - TTS, IA, STT
3. **Re-ejecutar test** - Verificar mejoras
4. **Documentar resultados** - Guardar métricas para comparación

---

**Última actualización:** 2026-01-02  
**Estado:** ✅ Script funcional y listo para usar
