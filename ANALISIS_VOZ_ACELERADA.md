# Análisis: Problema de Voz Acelerada en Llamada Conversacional

## Problema Identificado
La voz de Sandra en la llamada conversacional se reproduce acelerada ("ida de revoluciones"), haciendo que suene más rápida de lo normal.

## Investigación Realizada

### 1. Causas Comunes de Audio Acelerado
- **Desajuste de Sample Rate**: Cuando el sample rate del audio generado no coincide con el esperado por el navegador durante la reproducción
- **Formato MP3**: Los navegadores pueden interpretar incorrectamente el sample rate de archivos MP3 si no es estándar
- **Configuración del Navegador**: Algunos navegadores asumen sample rates específicos para MP3

### 2. Configuración Actual
- **Cartesia TTS**: Genera audio MP3 con `sample_rate: 22050 Hz`
- **Navegador**: Reproduce el audio usando `HTMLAudioElement` con `data:audio/mp3;base64,...`
- **playbackRate**: Forzado a 1.0 en múltiples puntos del código

### 3. Problema Identificado
Los navegadores web (Chrome, Firefox, Safari) comúnmente esperan que los archivos MP3 tengan un sample rate de **44100 Hz** (estándar de CD). Cuando reciben un MP3 con sample rate de 22050 Hz, pueden interpretarlo incorrectamente y reproducirlo al doble de velocidad.

**Cálculo**: Si el navegador asume 44100 Hz pero el audio es 22050 Hz:
- Velocidad de reproducción = 44100 / 22050 = 2.0x (doble de velocidad)

### 4. Solución Propuesta
Cambiar el sample rate de Cartesia de **22050 Hz** a **44100 Hz**, que es:
- El estándar para MP3 en navegadores web
- Compatible con todos los navegadores modernos
- No requiere cambios en el código del cliente
- Solo requiere un cambio en la configuración del servidor (1 línea)

## Cambio Necesario

**Archivo**: `server-websocket.js`
**Línea**: 624
**Cambio**: 
```javascript
// ANTES:
sample_rate: 22050

// DESPUÉS:
sample_rate: 44100  // Estándar para MP3 en navegadores web
```

## Impacto
- ✅ **Sin cambios en el cliente**: No se modifica `index.html`
- ✅ **Sin cambios en la lógica**: Solo se ajusta el sample rate
- ✅ **Sin eliminación de código**: Se mantiene todo el código existente
- ✅ **Solución estándar**: Usa el sample rate recomendado para MP3 en web

## Referencias
- Sample rate estándar para MP3: 44100 Hz (CD quality)
- Navegadores web esperan 44100 Hz para MP3 por defecto
- Problemas de audio acelerado comúnmente causados por discrepancias de sample rate

