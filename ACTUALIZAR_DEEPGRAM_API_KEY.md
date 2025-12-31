# 🔑 ACTUALIZAR API KEY DE DEEPGRAM

## Nueva API Key de Deepgram

**API Key:** `53202ecf825c59e8ea498f7cf68c4822c2466005618e1cd99dad83387e673405cdf5bac3d668f90a`

**Nota:** Parece que son dos partes. Si es una sola key, únelas sin espacios. Si son dos keys diferentes, usa la primera.

---

## Dónde Actualizar

### 1. Render (Servidor MCP) - PRIORITARIO ⚠️

El servidor MCP está en Render: `https://pwa-imbf.onrender.com`

**Service ID:** `srv-d4sqhoeuk2gs73f1ba8g`

**Nueva API Key de Deepgram:**
```
53202ecf825c59e8ea498f7cf68c4822c2466005618e1cd99dad83387e673405cdf5bac3d668f90a
```

**Pasos Manuales (Render Dashboard):**
1. Ve a: **https://dashboard.render.com**
2. Busca el servicio: `mcp-enterprise-server` o busca por ID: `srv-d4sqhoeuk2gs73f1ba8g`
3. Click en el servicio
4. Ve a: **Environment** (en el menú lateral izquierdo)
5. Busca la variable: `DEEPGRAM_API_KEY`
   - Si existe: Click en el **lápiz (✏️)** para editar
   - Si NO existe: Click en **"Add Environment Variable"**
6. **Key:** `DEEPGRAM_API_KEY`
7. **Value:** `53202ecf825c59e8ea498f7cf68c4822c2466005618e1cd99dad83387e673405cdf5bac3d668f90a`
   - **Nota:** Si son dos keys separadas, únelas sin espacios. Si solo quieres usar la primera parte: `53202ecf825c59e8ea498f7cf68c4822c2466005`
8. Click en **"Save Changes"** o **"Add"**
9. **El servicio se reiniciará automáticamente** (espera 2-3 minutos)

**Verificación:**
- Espera 2-3 minutos después de guardar
- Los logs deberían mostrar que Deepgram funciona correctamente
- Prueba una llamada conversacional

---

### 2. Vercel (Opcional - solo si se usa en funciones serverless)

Si el widget también usa Deepgram directamente desde Vercel:

1. Ve a: https://vercel.com/dashboard
2. Selecciona el proyecto: `GUESTVALENCIAPWA`
3. Ve a: **Settings > Environment Variables**
4. Busca: `DEEPGRAM_API_KEY`
5. Edita y actualiza el valor
6. Haz un nuevo deploy

---

## Formato de la API Key

Las API keys de Deepgram normalmente tienen formato:
- `dg_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (nuevo formato)
- O simplemente una cadena hexadecimal larga

La key que proporcionaste parece ser hexadecimal. Úsala tal cual.

---

## Verificación Post-Actualización

Después de actualizar en Render:

1. **Espera 2-3 minutos** para que el servicio se reinicie
2. **Prueba una llamada conversacional** desde el widget
3. **Verifica los logs de Render** - deberías ver:
   - `✅ Deepgram transcription: "..."` en lugar de errores 400
4. **Si sigue fallando:**
   - Verifica que la key esté correctamente copiada (sin espacios)
   - Verifica que el servicio se haya reiniciado
   - Revisa los logs completos de Render

---

## Nota Importante

**NO** hardcodees la API key en el código. Siempre usa variables de entorno (`process.env.DEEPGRAM_API_KEY`).

El código ya está configurado correctamente para leer de variables de entorno.
