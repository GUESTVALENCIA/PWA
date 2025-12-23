#  Variables para Render.com

## Copia estas variables en Render.com > Environment Variables

```
OPENAI_API_KEY=sk-REEMPLAZA_CON_TU_KEY_OPENAI
GROQ_API_KEY=gsk_REEMPLAZA_CON_TU_KEY_GROQ
GEMINI_API_KEY=AIzaSyREEMPLAZA_CON_TU_KEY_GEMINI
CARTESIA_API_KEY=REEMPLAZA_CON_TU_KEY_CARTESIA
CARTESIA_VOICE_ID=2d5b0e6cf361460aa7fc47e3cee4b30c
DEEPGRAM_API_KEY=REEMPLAZA_CON_TU_KEY_DEEPGRAM
SANDRA_TOKEN=sk-sandra-production-token-reemplaza
REQUIRE_AUTH=false
MCP_PORT=4042
MCP_HOST=0.0.0.0
NODE_ENV=production
ALLOWED_ORIGINS=*
```

##  IMPORTANTE

Reemplaza los valores con las keys REALES que tienes configuradas en Vercel:

1. **OPENAI_API_KEY**: La misma que en Vercel
2. **GROQ_API_KEY**: La misma que en Vercel  
3. **GEMINI_API_KEY**: La misma que en Vercel
4. **CARTESIA_API_KEY**: La misma que en Vercel
5. **DEEPGRAM_API_KEY**: La misma que en Vercel

##  Pasos en Render.com

1. Ve a tu servicio en Render Dashboard
2. Click en **Environment**
3. Click en **Add Environment Variable**
4. Añade cada variable una por una:
   - Key: `OPENAI_API_KEY`
   - Value: `sk-tu-key-real-aqui`
   - Repite para todas las variables

O usa el archivo `ENV_RENDER.txt` como referencia.

