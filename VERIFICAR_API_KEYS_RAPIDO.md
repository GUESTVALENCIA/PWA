#  VERIFICACIÓN RÁPIDA DE API KEYS

##  Problema Actual
- OpenAI (GPT-4o) falla
- Groq (Qwen/DeepSeek) falla  
- Solo Gemini funciona

##  SOLUCIÓN INMEDIATA

### 1. Verifica que las keys están en Vercel:
```
Vercel Dashboard > Tu Proyecto > Settings > Environment Variables
```

**DEBE haber estas 3:**
-  OPENAI_API_KEY
-  GROQ_API_KEY  
-  GEMINI_API_KEY

### 2. Verifica que están asignadas a Production:
Cada variable debe tener **Production** seleccionado

### 3. HAZ UN NUEVO DEPLOY:
Las variables solo se cargan en nuevos deploys, no en runtime.

### 4. Verifica en logs después del deploy:
Busca estos mensajes:
- `hasApiKey: true` =  Key configurada
- `hasApiKey: false` =  Key NO configurada

##  Si sigue fallando:

1. **Verifica el formato de las keys:**
   - OpenAI: debe empezar con `sk-proj-` o `sk-`
   - Groq: debe empezar con `gsk_`
   - Gemini: debe empezar con `AIzaSy`

2. **Verifica que no haya espacios extra:**
   - Copia/pega directo, sin espacios al inicio o final

3. **Verifica en runtime:**
   - Ve a Vercel Dashboard > Deployments > Último deploy > Functions
   - Revisa los logs de `/api/sandra/chat` o `/api/sandra/assistant`
   - Busca mensajes de error específicos

##  Próximo paso si nada funciona:
Necesito ver los logs exactos de Vercel para diagnosticar.

