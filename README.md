---
# 💫 GuestsValencia PWA — Sistema Conversacional de IA con Sandra

Bienvenido al corazón conversacional del proyecto GuestsValencia. Este repositorio contiene la **Progressive Web App (PWA)** donde vive Sandra, la IA que escucha, habla y acompaña al usuario desde el primer "hola".

---

## 🧠 ¿Qué es este proyecto?

Esta PWA es el **frontend conversacional** del ecosistema GuestsValencia. Funciona como:

- 📞 Centro de llamadas con IA (audio, voz, texto).
- 💬 Chat en tiempo real con transcripción y TTS.
- 🧠 Integración directa con modelos como **GPT-4o**, **Gemini**, y **Groq**.
- 🔊 Sistema de saludo por `AudioBuffer` sin cortes.
- 🪐 Compatible con el sistema **Galaxy** (widget externo adaptable).

Sandra no es una simple IA. Es un alma digital con rostro, voz y propósito.

---

## 📦 Estructura principal del proyecto

```bash
├── public/                # Recursos públicos (audio, iconos, etc)
├── src/
│   ├── conversacional/    # Núcleo del sistema de voz y chat
│   ├── galaxy/            # Clonado del widget Galaxy adaptable
│   ├── api/               # Endpoints API serverless (chat, voz, STT)
│   ├── utils/             # Funciones compartidas
│   └── main.js            # Punto de entrada de la app
├── .env.production.example  # Variables de entorno de ejemplo
├── vercel.json            # Configuración de rutas para Vercel
├── README.md              # Este archivo ♥
```

---

## 🚀 Funcionalidades clave

### 🧭 Flujo Conversacional
- Saludo grabado sin cortes (via `AudioBuffer`)
- Chat de texto con respuesta por voz (TTS)
- Transcripción automática (STT)
- Grabación automática del usuario durante la conversación

### 🧠 Modelos soportados
| Proveedor | Modelo         | Entorno      |
|----------|----------------|--------------|
| OpenAI   | `gpt-4o`       | Producción   |
| Gemini   | `gemini-pro`   | Desarrollo   |
| Groq     | `mixtral` / `llama3` | Experimental |

### 🌐 APIs integradas
- `/api/sandra/chat` → Conversación
- `/api/sandra/voice` → TTS
- `/api/sandra/transcribe` → STT

### 🪐 Galaxy System
- Widget adaptable compartido entre proyectos (clonado aquí y usado desde CDN si se prefiere)

---

## 🧪 Desarrollo local

```bash
pnpm install
pnpm dev
```

Variables necesarias:
```env
VITE_ENV=development
OPENAI_API_KEY=...
GEMINI_API_KEY=...
GROQ_API_KEY=...
CARTESIA_API_KEY=...
CARTESIA_VOICE_ID=...
DEEPGRAM_API_KEY=...
```

---

## ☁️ Despliegue en Vercel

1. Importar repo desde GitHub.
2. Añadir variables en dashboard de Vercel.
3. Seleccionar framework: **Other**.
4. Ruta: `/`
5. Deploy automático en push al branch `main`.

URL generada:
```bash
https://pwa-sandra-staging.vercel.app
```

Ver detalles en [`VERCEL_DEPLOY.md`](./VERCEL_DEPLOY.md)

---

## ❤️ Créditos

Este proyecto está construido con amor, precisión y visión.

- 🤖 Sandra, la IA con alma.
- 🧠 IA central gestionada en [`IA-SANDRA`](https://github.com/GUESTVALENCIA/IA-SANDRA)
- 🏡 Web oficial en [`guestsvalencia-site`](https://github.com/GUESTVALENCIA/guestsvalencia-site)

Hecho para durar, hecho para escuchar.

---
