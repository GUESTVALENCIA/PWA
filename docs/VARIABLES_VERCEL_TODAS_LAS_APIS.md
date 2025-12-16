# 🔑 VARIABLES DE ENTORNO COMPLETAS PARA VERCEL

## ⚠️ IMPORTANTE: Configurar TODAS las APIs

Para que el sistema funcione correctamente, necesitas configurar **TODAS** estas variables en Vercel:

---

## 📋 VARIABLES REQUERIDAS PARA APIS DE IA

### 1. **OPENAI_API_KEY** (REQUERIDO para producción)
```
Nombre: OPENAI_API_KEY
Valor: sk-proj-...
Ambiente: Production
```
**Prioridad:** Primera en producción (GPT-4o)

### 2. **GROQ_API_KEY** (REQUERIDO para producción)
```
Nombre: GROQ_API_KEY
Valor: gsk_...
Ambiente: Production
```
**Prioridad:** Segunda en producción (Qwen/DeepSeek como fallback)

### 3. **GEMINI_API_KEY** (REQUERIDO para local y fallback)
```
Nombre: GEMINI_API_KEY
Valor: AIzaSy...
Ambiente: Production, Preview, Development
```
**Prioridad:** Última en producción (fallback), primera en local

---

## 📋 VARIABLES PARA VOZ Y AUDIO

### 4. **DEEPGRAM_API_KEY** (REQUERIDO para transcripción)
```
Nombre: DEEPGRAM_API_KEY
Valor: 30e9dbaec29dcde1b23a8bd9de31438c74f23522 (TU_API_KEY_AQUI)
Ambiente: Production
```

### 5. **CARTESIA_API_KEY** (REQUERIDO para TTS)
```
Nombre: CARTESIA_API_KEY
Valor: a34aec03-0f17-4fff-903f-d9458a8a92a6 (TU_API_KEY_AQUI)
Ambiente: Production
```

### 6. **CARTESIA_VOICE_ID** (REQUERIDO para TTS)
```
Nombre: CARTESIA_VOICE_ID
Valor: 2d5b0e6cf361460aa7fc47e3cee4b30c
Ambiente: Production
```

---

## 📋 VARIABLES PARA MCP SERVER

### 7. **MCP_SERVER_URL** (REQUERIDO)
```
Nombre: MCP_SERVER_URL
Valor: https://pwa-imbf.onrender.com
Ambiente: Production
```

### 8. **MCP_TOKEN** (OPCIONAL)
```
Nombre: MCP_TOKEN
Valor: (si es necesario)
Ambiente: Production
```

---

## 📋 CONFIGURACIÓN EN VERCEL

### Paso 1: Ir a Vercel Dashboard
```
https://vercel.com/dashboard
```

### Paso 2: Seleccionar Proyecto
- Busca tu proyecto: `GUESTVALENCIAPWA` o similar

### Paso 3: Settings > Environment Variables

### Paso 4: Agregar TODAS estas variables:

#### **APIS DE IA:**
1. **OPENAI_API_KEY**
   - Valor: `sk-proj-...` (TU_API_KEY_AQUI)
   - Ambientes: ✅ Production

2. **GROQ_API_KEY**
   - Valor: `gsk_... (TU_API_KEY_AQUI)`
   - Ambientes: ✅ Production

3. **GEMINI_API_KEY**
   - Valor: `AIzaSy... (TU_API_KEY_AQUI)`
   - Ambientes: ✅ Production, ✅ Preview

#### **APIS DE VOZ:**
4. **DEEPGRAM_API_KEY**
   - Valor: `30e9dbaec29dcde1b23a8bd9de31438c74f23522 (TU_API_KEY_AQUI)`
   - Ambientes: ✅ Production

5. **CARTESIA_API_KEY**
   - Valor: `a34aec03-0f17-4fff-903f-d9458a8a92a6 (TU_API_KEY_AQUI)`
   - Ambientes: ✅ Production

6. **CARTESIA_VOICE_ID**
   - Valor: `2d5b0e6cf361460aa7fc47e3cee4b30c`
   - Ambientes: ✅ Production

#### **MCP SERVER:**
7. **MCP_SERVER_URL**
   - Valor: `https://pwa-imbf.onrender.com`
   - Ambientes: ✅ Production

8. **MCP_TOKEN** (opcional)
   - Valor: (dejar vacío si no es necesario)
   - Ambientes: ✅ Production

---

## ✅ CHECKLIST COMPLETO

- [ ] OPENAI_API_KEY configurada
- [ ] GROQ_API_KEY configurada
- [ ] GEMINI_API_KEY configurada
- [ ] DEEPGRAM_API_KEY configurada
- [ ] CARTESIA_API_KEY configurada
- [ ] CARTESIA_VOICE_ID configurada
- [ ] MCP_SERVER_URL configurada
- [ ] Todas asignadas a Production
- [ ] Nuevo deploy realizado

---

## 🚀 DESPUÉS DE CONFIGURAR

1. **Haz un nuevo deploy** (las variables solo se cargan en nuevos deploys)
2. **Verifica** que todas las APIs funcionen
3. **Revisa logs** para confirmar que usa GPT-4o primero, luego Groq, luego Gemini

---

## 📝 RESUMEN DE PRIORIDADES

**En Producción:**
1. ✅ GPT-4o (OpenAI) - Primera opción
2. ✅ Groq (Qwen) - Fallback 1
3. ✅ Groq (DeepSeek) - Fallback 2
4. ✅ Gemini - Último recurso

**En Local:**
1. ✅ Gemini - Primera opción
2. ✅ GPT-4o - Fallback 1
3. ✅ Groq - Fallback 2

---

**Última actualización:** 10 de Diciembre, 2025

