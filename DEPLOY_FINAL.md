# 🚀 DEPLOY FINAL - Ejecutar Ahora

## ✅ PREPARACIÓN COMPLETADA

Todo está verificado y listo para deployment:

- ✅ Verificación pre-deploy: **PASADA**
- ✅ Archivos críticos: **OK**
- ✅ Serverless functions: **Configuradas**
- ✅ vercel.json: **Configurado**
- ✅ Utilidades de entorno: **Implementadas**

---

## 📋 EJECUTA ESTOS COMANDOS

### 1. Actualizar desde remoto

```bash
git pull origin main --no-rebase
```

Si hay conflictos, resuélvelos antes de continuar.

### 2. Añadir cambios

```bash
git add .
```

### 3. Commit

```bash
git commit -m "Sistema completo: Sandra IA con flujo de voz completo, detección automática de entorno, integración Galaxy, y listo para producción"
```

### 4. Push a GitHub

```bash
git push origin main
```

---

## 🌐 DEPLOY EN VERCEL

### Paso 1: Ir a Vercel

Abre: https://vercel.com/new

### Paso 2: Importar Repositorio

1. Selecciona "Import Git Repository"
2. Conecta `GUESTVALENCIA/PWA`
3. Click "Import"

### Paso 3: Configurar Proyecto

| Campo              | Valor          |
| ------------------ | -------------- |
| **Framework Preset** | `Other`        |
| **Root Directory**   | `/`            |
| **Build Command**    | *(vacío - dejar en blanco)* |
| **Output Directory** | `.`            |
| **Install Command**  | `npm install`  |

**Project Name:** `pwa-sandra-staging` (o el que prefieras)

### Paso 4: Configurar Variables de Entorno

**ANTES de hacer deploy**, añade estas variables:

En **"Environment Variables"**, añade:

```
GEMINI_API_KEY=tu_clave_aqui
OPENAI_API_KEY=tu_clave_aqui
GROQ_API_KEY=tu_clave_aqui
CARTESIA_API_KEY=tu_clave_aqui
CARTESIA_VOICE_ID=tu_voice_id_aqui
DEEPGRAM_API_KEY=tu_clave_aqui
```

**Para cada variable**, selecciona:
- ✅ Production
- ✅ Preview
- ✅ Development

### Paso 5: Deploy

1. Click **"Deploy"**
2. Espera 2-5 minutos
3. Obtendrás una URL: `https://[tu-proyecto].vercel.app`

---

## ✅ VERIFICAR DEPLOY

Una vez desplegado, verifica:

1. Abre la URL de Vercel
2. Abre la consola del navegador (F12)
3. Deberías ver:
   ```
   🔍 [SandraGateway] Entorno detectado: staging
   🤖 [SandraGateway] Modelo: gemini-pro (gemini)
   ```

4. Prueba el widget Galaxy:
   - Abre el widget
   - Escribe: "Hola Sandra"
   - Debe responder con texto y voz

5. Prueba endpoints:
   ```
   https://[tu-proyecto].vercel.app/api/sandra/chat
   ```

---

## 🎯 ¿PROBLEMAS?

### Si el deploy falla:

1. Revisa los logs en Vercel Dashboard
2. Verifica que todas las variables estén configuradas
3. Verifica que `vercel.json` esté correcto
4. Ver `DEPLOY_PRODUCCION.md` para troubleshooting

### Si las APIs no responden:

1. Verifica las API keys en Vercel
2. Revisa los logs de las serverless functions
3. Verifica que los endpoints estén bien configurados

---

## 📞 RECURSOS

- `DEPLOY_STEPS.md` - Pasos detallados
- `DEPLOY_PRODUCCION.md` - Guía completa
- `DEPLOY_CHECKLIST.md` - Checklist técnico
- `PRE_DEPLOY_VERIFY.js` - Script de verificación

---

**🚀 ¡Ejecuta los comandos y haz el deploy! Todo está listo.** ✨

