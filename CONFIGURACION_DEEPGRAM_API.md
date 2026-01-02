# Configuración Deepgram via API

## Datos del Usuario

**Project ID:** `b9826b21-0218-495e-bb28-862be3f6a4da`
**API Key ID:** `3717e99d-47e7-43b6-bf06-fcbcc5d8dc36`
**Plan:** Pay As You Go
**Modelo a usar:** `nova-2` (confirmado como válido)

## Endpoint de Configuración

Según el ejemplo curl proporcionado:
```
POST https://api.deepgram.com/v1/listen
```

## Parámetros Actuales

- Model: `nova-2` (cambiado de nova-2-phonecall)
- Language: `es`
- Encoding: `linear16`
- Sample Rate: `16000`
- Channels: `1`
- Smart Format: `true`
- Punctuate: `true`
- Interim Results: `true`
- Endpointing: `250`
- VAD Events: `true`
- Utterances: `true`
- Utterance End MS: `600`
- Filler Words: `false`
- Numerals: `true`

## Acción Requerida

El usuario quiere que configure el sistema usando la API de Deepgram directamente, no solo cambiar código.
