# Configuración de Variables de Entorno

## Crear archivo .env

Para configurar todas las variables de entorno necesarias:

1. **Copia el archivo de ejemplo:**
   ```bash
   cp .env.example .env
   ```

2. **Edita el archivo `.env` y configura `BASTANTEO_MCP_API_KEY`:**
   
   Para desarrollo local (sin autenticación), puedes dejarlo vacío:
   ```env
   BASTANTEO_MCP_API_KEY=
   ```
   
   Para staging/producción, genera una clave segura:
   ```bash
   # En Linux/Mac/Git Bash
   openssl rand -hex 32
   
   # O en PowerShell (Windows)
   -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | % {[char]$_})
   ```
   
   Luego ponla en `.env`:
   ```env
   BASTANTEO_MCP_API_KEY=tu_clave_generada_aqui
   ```

## Variables Incluidas

El archivo `.env.example` incluye todas las variables necesarias para:

- ✅ **Servidor MCP Bastanteo** (nuevas)
- ✅ **LLM APIs**: Gemini, OpenAI, Groq, Anthropic, OpenRouter
- ✅ **TTS APIs**: Cartesia, ElevenLabs
- ✅ **STT APIs**: Deepgram
- ✅ **Video Avatar**: HeyGen
- ✅ **Real-time**: LiveKit
- ✅ **SMS/Voice**: Twilio, Meta/WhatsApp
- ✅ **Payments**: PayPal
- ✅ **Databases**: Neon, Supabase
- ✅ **External Data**: Airtable
- ✅ **CDN/Hosting**: Cloudflare, Netlify, Vercel
- ✅ **GitHub**: Tokens para repos
- ✅ **Scraping**: BrightData, ContinueDev

## Verificar que .env no está en Git

Asegúrate de que `.env` esté en `.gitignore`:

```bash
# Verificar
cat .gitignore | grep "\.env"

# Si no está, añádelo:
echo ".env" >> .gitignore
```

## Próximos Pasos

Una vez configurado el `.env`:

1. **Probar servidor MCP localmente:**
   ```bash
   npm run mcp
   ```

2. **Probar con curl:**
   ```bash
   curl -X POST http://localhost:4042/mcp \
     -H "Content-Type: application/json" \
     -H "X-API-Key: tu-clave-si-configuraste" \
     -d '{
       "jsonrpc": "2.0",
       "id": 1,
       "method": "tools/call",
       "params": {
         "name": "bastanteo_start_session",
         "arguments": {
           "user_id": "demo-local"
         }
       }
     }'
   ```

3. **Para staging/producción:**
   - Configura las variables en tu plataforma de hosting
   - Usa `BASTANTEO_MCP_API_KEY` con una clave fuerte
   - Expón el servidor en `https://api-staging.guestsvalencia.es/bastanteo/mcp`

