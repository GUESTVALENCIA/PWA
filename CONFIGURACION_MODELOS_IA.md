# 🤖 Configuración de Modelos de IA para Sandra

## 📊 Estrategia de Prioridades

### 🔵 PRODUCCIÓN (`VERCEL_ENV=production`)

**Prioridad de modelos:**
1. **GPT-4o** (OpenAI) - Modelo principal para producción
2. **Groq (Qwen 2.5)** - Fallback rápido y eficiente
3. **Groq (DeepSeek R1)** - Segundo fallback
4. **Gemini 2.5-flash-lite** - Último recurso

### 🟢 LOCAL (Desarrollo)

**Prioridad de modelos:**
1. **Gemini 2.5-flash-lite** - Modelo principal para desarrollo local
2. **GPT-4o** (OpenAI) - Fallback
3. **Groq (Qwen 2.5)** - Segundo fallback

---

## 🔑 Variables de Entorno Necesarias

### Para Producción (Prioridad Alta):

1. **OPENAI_API_KEY** (REQUERIDO para producción)
   ```
   Nombre: OPENAI_API_KEY
   Valor: sk-... (tu API key de OpenAI)
   Ambiente: Production
   ```

2. **GROQ_API_KEY** (RECOMENDADO para fallback)
   ```
   Nombre: GROQ_API_KEY
   Valor: gsk_... (tu API key de Groq)
   Ambiente: Production
   ```

### Para Desarrollo Local (Opcional):

3. **GEMINI_API_KEY** (Recomendado para local)
   ```
   Nombre: GEMINI_API_KEY
   Valor: AIzaSy... (tu API key de Gemini)
   Ambiente: Development
   ```

---

## 📋 Modelos Disponibles

### OpenAI
- **Modelo**: `gpt-4o`
- **Uso**: Producción (prioridad 1)
- **Endpoint**: `https://api.openai.com/v1/chat/completions`
- **Function Calling**: ✅ Soportado nativamente

### Groq (Qwen 2.5)
- **Modelo**: `qwen/qwen-2.5-72b-instruct`
- **Uso**: Producción (fallback 1)
- **Endpoint**: `https://api.groq.com/openai/v1/chat/completions`
- **Function Calling**: ✅ Soportado (formato OpenAI compatible)
- **Ventajas**: Muy rápido, eficiente

### Groq (DeepSeek R1)
- **Modelo**: `deepseek/deepseek-r1`
- **Uso**: Producción (fallback 2)
- **Endpoint**: `https://api.groq.com/openai/v1/chat/completions`
- **Function Calling**: ✅ Soportado (formato OpenAI compatible)
- **Ventajas**: Razonamiento avanzado

### Gemini 2.5-flash-lite
- **Modelo**: `gemini-2.5-flash-lite`
- **Uso**: Desarrollo local (prioridad 1) / Producción (último recurso)
- **Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent`
- **Function Calling**: ⚠️ No soportado nativamente (se puede implementar con prompts)

---

## 🔄 Flujo de Decisión

```
¿Estamos en producción?
  ├─ SÍ → ¿Tiene OPENAI_API_KEY válida?
  │         ├─ SÍ → Usar GPT-4o
  │         └─ NO → ¿Tiene GROQ_API_KEY?
  │                   ├─ SÍ → Usar Groq (Qwen)
  │                   └─ NO → ¿Tiene GEMINI_API_KEY?
  │                             └─ SÍ → Usar Gemini (último recurso)
  │
  └─ NO (Local) → ¿Tiene GEMINI_API_KEY?
                    ├─ SÍ → Usar Gemini
                    └─ NO → ¿Tiene OPENAI_API_KEY?
                              ├─ SÍ → Usar GPT-4o
                              └─ NO → ¿Tiene GROQ_API_KEY?
                                        └─ SÍ → Usar Groq (Qwen)
```

---

## 🚀 Configuración en Vercel

### Variables Requeridas para Producción:

1. **OPENAI_API_KEY**
   - Ve a: Settings > Environment Variables
   - Nombre: `OPENAI_API_KEY`
   - Valor: `sk-...`
   - Ambiente: **Production** (y Preview si quieres)

2. **GROQ_API_KEY** (Opcional pero recomendado)
   - Nombre: `GROQ_API_KEY`
   - Valor: `gsk_...`
   - Ambiente: **Production**

3. **GEMINI_API_KEY** (Opcional, para desarrollo)
   - Nombre: `GEMINI_API_KEY`
   - Valor: `AIzaSy...`
   - Ambiente: **Development**, Preview (opcional)

---

## 📝 Ejemplos de Uso

### Chat Normal (`/api/sandra/chat`)
- **Producción**: Usa GPT-4o → Groq (Qwen) → Gemini
- **Local**: Usa Gemini → GPT-4o → Groq

### Assistant con Function Calling (`/api/sandra/assistant`)
- **Producción**: Usa GPT-4o (con function calling) → Groq (con function calling) → Gemini (sin function calling)
- **Local**: Usa Gemini (sin function calling) → GPT-4o → Groq

### Llamadas Conversacionales
- **Producción**: WebSocket a MCP server → GPT-4o para procesamiento
- **Local**: WebSocket local → Gemini para procesamiento

---

## ✅ Verificación

Para verificar que todo funciona:

```bash
node verificar-sandra-conexiones.js
```

**Resultados esperados:**
- ✅ Config endpoint funcionando
- ✅ Chat usando GPT-4o en producción
- ✅ Assistant usando GPT-4o en producción
- ✅ Fallbacks funcionando correctamente

---

## 🔧 Troubleshooting

### Error: "No hay API key válida configurada"
**Solución**: Configura al menos `OPENAI_API_KEY` en Vercel para producción

### Error: "OpenAI API Error: 401"
**Solución**: Verifica que `OPENAI_API_KEY` sea válida y esté configurada correctamente

### Error: "Groq API Error: 401"
**Solución**: Verifica que `GROQ_API_KEY` sea válida (formato: `gsk_...`)

### Usa siempre Gemini en producción
**Solución**: Verifica que `OPENAI_API_KEY` y `GROQ_API_KEY` estén configuradas. El sistema solo usa Gemini como último recurso.

---

## 📚 Referencias

- OpenAI API: https://platform.openai.com/docs
- Groq API: https://console.groq.com/docs
- Gemini API: https://ai.google.dev/docs
- Qwen Models: https://qwenlm.github.io/
- DeepSeek: https://www.deepseek.com/

