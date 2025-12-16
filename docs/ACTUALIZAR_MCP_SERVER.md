# ✅ ACTUALIZACIÓN DEL SERVIDOR MCP

## 🔧 Cambios Realizados

He actualizado `mcp-server/services/chat.js` para usar las mismas APIs que Vercel:

### Prioridad de Modelos (igual que en producción):
1. **GPT-4o (OpenAI)** - Prioridad 1
2. **Groq (Qwen 2.5)** - Fallback 1  
3. **Groq (DeepSeek R1)** - Fallback 2
4. **Gemini 2.5-flash-lite** - Último recurso

### Variables Requeridas:

El servidor MCP ahora usa:
- ✅ `OPENAI_API_KEY` - Para GPT-4o
- ✅ `GROQ_API_KEY` - Para Qwen y DeepSeek (vía Groq)
- ✅ `GEMINI_API_KEY` - Para Gemini (último recurso)

## 📋 Acción Requerida

1. **Crear archivo `.env` en `mcp-server/`**:
   ```bash
   cd mcp-server
   cp .env.example .env
   ```

2. **Configurar las variables en `.env`**:
   ```bash
   OPENAI_API_KEY=tu_key_de_openai
   GROQ_API_KEY=tu_key_de_groq
   GEMINI_API_KEY=tu_key_de_gemini
   CARTESIA_API_KEY=tu_key_de_cartesia
   DEEPGRAM_API_KEY=tu_key_de_deepgram
   ```

3. **Si el servidor MCP está desplegado** (Railway, Render, VPS):
   - Configura las mismas variables en el panel de control
   - Reinicia el servidor

4. **Verificar que funciona**:
   ```bash
   cd mcp-server
   node test-mcp-complete.js
   ```

## 🎯 Resultado

Ahora el servidor MCP usará:
- **GPT-4o en producción** (si `OPENAI_API_KEY` está configurada)
- **Groq (Qwen/DeepSeek) como fallback** (si `GROQ_API_KEY` está configurada)
- **Gemini solo como último recurso**

Igual que las funciones serverless de Vercel.

