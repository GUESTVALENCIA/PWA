# 📋 INFORMACIÓN DEL SERVIDOR MCP

## 🔧 Variables Requeridas en el Servidor MCP

### LLM APIs (Al menos una):
```bash
OPENAI_API_KEY=sk-...
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AIzaSy...
```

### Voice APIs:
```bash
CARTESIA_API_KEY=...
CARTESIA_VOICE_ID=...
DEEPGRAM_API_KEY=...
```

### Configuración:
```bash
MCP_PORT=4042
MCP_HOST=0.0.0.0
NODE_ENV=production
SANDRA_TOKEN=... (opcional)
REQUIRE_AUTH=false
```

## 🎯 Prioridad de Modelos (Actualizada)

1. **GPT-4o** (OPENAI_API_KEY) - Prioridad 1
2. **Groq Qwen 2.5** (GROQ_API_KEY) - Fallback 1
3. **Groq DeepSeek R1** (GROQ_API_KEY) - Fallback 2
4. **Gemini 2.5-flash-lite** (GEMINI_API_KEY) - Último recurso

## 📍 Dónde Configurar

### Si está en Railway:
- Dashboard > Tu Proyecto > Variables > Añadir variables

### Si está en Render:
- Dashboard > Tu Servicio > Environment > Add Environment Variable

### Si está en VPS:
- Editar `.env` en el directorio del servidor MCP
- Reiniciar servicio

### Si está local:
- Crear `.env` en `mcp-server/` con las variables arriba

## 🔍 Verificar

```bash
cd mcp-server
node test-mcp-complete.js
```

O probar endpoint:
```bash
curl http://localhost:4042/health
curl http://localhost:4042/api/status
```

