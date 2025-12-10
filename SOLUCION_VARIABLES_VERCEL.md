# 🔧 Solución: Variables Configuradas pero No se Usan

## 🎯 Problema Detectado

Las variables de entorno (`OPENAI_API_KEY`, `GROQ_API_KEY`) **ESTÁN CONFIGURADAS** en Vercel Dashboard, pero el sistema sigue usando Gemini en producción.

## 🔍 Causa Probable

**Vercel necesita un nuevo deploy para cargar las variables de entorno** que acabas de configurar.

Las variables de entorno solo están disponibles en los deployments que se crearon **DESPUÉS** de configurar las variables.

## ✅ Solución

### Paso 1: Verificar que las Variables Estén Guardadas
1. Ve a Vercel Dashboard
2. Tu Proyecto > Settings > Environment Variables
3. Verifica que `OPENAI_API_KEY` y `GROQ_API_KEY` estén listadas
4. **IMPORTANTE**: Asegúrate de que estén configuradas para **Production**

### Paso 2: Hacer un Nuevo Deploy
Tienes 3 opciones:

#### Opción A: Redeploy Manual (Más Rápido)
1. Ve a Vercel Dashboard > Deployments
2. Encuentra el último deployment
3. Haz clic en los 3 puntos (⋯) > **"Redeploy"**
4. Espera a que termine el deploy

#### Opción B: Push a Git (Automático)
1. Haz un cambio pequeño en cualquier archivo (o solo haz push)
2. Vercel hará deploy automáticamente
3. Las nuevas variables estarán disponibles

#### Opción C: Trigger Manual
```bash
# Si tienes Vercel CLI instalado
vercel --prod
```

### Paso 3: Verificar que Funciona
Después del deploy, ejecuta:
```bash
node verificar-todas-las-apis.js
```

Deberías ver:
- ✅ GPT-4o funcionando (si `OPENAI_API_KEY` está bien)
- ✅ O Groq funcionando (si `OPENAI_API_KEY` falla pero `GROQ_API_KEY` funciona)

## 🔍 Verificación con Endpoint de Diagnóstico

He creado un endpoint de diagnóstico que puedes usar:

```bash
# Verificar variables en runtime
curl https://pwa-chi-six.vercel.app/api/diagnostico
```

Este endpoint te dirá:
- Qué variables están disponibles en runtime
- Longitud de las keys (para verificar que están cargadas)
- Qué modelo debería usarse según el entorno

## ⚠️ Problemas Comunes

### 1. Variables Configuradas pero No en Production
**Solución**: Asegúrate de que las variables estén configuradas para:
- ✅ Production
- ✅ Preview (opcional)
- ✅ Development (opcional)

### 2. Variables Configuradas Después del Último Deploy
**Solución**: Haz un nuevo deploy (Redeploy)

### 3. Keys Inválidas o Vencidas
**Solución**: Verifica que las keys sean válidas:
- `OPENAI_API_KEY`: Debe empezar con `sk-` y tener más de 40 caracteres
- `GROQ_API_KEY`: Debe empezar con `gsk_` y tener más de 40 caracteres

### 4. Caché de Vercel
**Solución**: A veces Vercel cachea las funciones. Espera 1-2 minutos después del deploy o invalida el caché.

## 📋 Checklist

- [ ] Variables configuradas en Vercel Dashboard
- [ ] Variables configuradas para **Production**
- [ ] Nuevo deploy hecho después de configurar variables
- [ ] Verificado con `verificar-todas-las-apis.js`
- [ ] GPT-4o o Groq funcionando en producción

## 🚀 Una Vez que Funcione

Cuando las variables estén cargadas, el sistema usará:
1. **GPT-4o** (producción) - si `OPENAI_API_KEY` funciona
2. **Groq (Qwen)** (fallback) - si OpenAI falla pero `GROQ_API_KEY` funciona
3. **Gemini** (último recurso) - solo si las otras fallan

---

**NOTA IMPORTANTE**: Sandra es el nombre del sistema. Los modelos (GPT-4o, Qwen, DeepSeek, Gemini) son solo las herramientas que usa Sandra para responder.

