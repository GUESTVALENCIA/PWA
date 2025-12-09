# 🚀 DEPLOY NOW - Pasos Inmediatos

## ✅ Verificación Pre-Deploy COMPLETADA

El script de verificación ha confirmado que todo está listo:
- ✅ Todos los archivos críticos presentes
- ✅ Serverless functions configuradas correctamente
- ✅ vercel.json configurado
- ✅ Utilidades de entorno implementadas

---

## 📋 PASOS PARA DEPLOY

### 1. Preparar Git (si aún no está hecho)

```bash
# Si el repositorio no está inicializado
git init

# Añadir todos los archivos
git add .

# Commit inicial
git commit -m "Sistema completo: Sandra IA con flujo de voz, detección automática de entorno, y deployment ready"
```

### 2. Conectar con GitHub

```bash
# Añadir remoto (reemplaza con tu repo real)
git remote add origin https://github.com/GUESTVALENCIA/PWA.git

# Push a main
git branch -M main
git push -u origin main
```

### 3. Deploy en Vercel

#### Opción A: Desde Vercel Dashboard (Recomendado)

1. **Ve a** [https://vercel.com/new](https://vercel.com/new)
2. **Selecciona** "Import Git Repository"
3. **Conecta** tu repositorio `GUESTVALENCIA/PWA`
4. **Configura:**
   - Framework Preset: **Other**
   - Root Directory: `/`
   - Build Command: *(vacío)*
   - Output Directory: `.`
   - Install Command: `npm install`
5. **Añade variables de entorno** (ver sección siguiente)
6. **Click "Deploy"**

#### Opción B: Desde CLI

```bash
# Instalar Vercel CLI (si no lo tienes)
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

---

## 🔐 VARIABLES DE ENTORNO EN VERCEL

**CRÍTICO:** Añade estas variables en **Settings > Environment Variables** antes del deploy:

### Variables Requeridas (Mínimas)

```
GEMINI_API_KEY=tu_clave_aqui
OPENAI_API_KEY=tu_clave_aqui
GROQ_API_KEY=tu_clave_aqui
CARTESIA_API_KEY=tu_clave_aqui
CARTESIA_VOICE_ID=tu_voice_id_aqui
DEEPGRAM_API_KEY=tu_clave_aqui
```

### Seleccionar Entornos

Para cada variable, selecciona:
- ✅ Production
- ✅ Preview
- ✅ Development

---

## ⚡ DEPLOY RÁPIDO

Si ya tienes todo configurado, ejecuta:

```bash
# Verificar que todo esté bien
node PRE_DEPLOY_VERIFY.js

# Si todo está OK, continúa con:
git add .
git commit -m "Ready for production deployment"
git push origin main

# Luego ve a Vercel y haz deploy
```

---

## 🎯 POST-DEPLOY

Una vez desplegado, verifica:

1. ✅ La página carga correctamente
2. ✅ Widget Galaxy funciona
3. ✅ Chat de texto responde
4. ✅ Voz de Sandra funciona
5. ✅ Endpoints `/api/sandra/*` responden

Ver `DEPLOY_PRODUCCION.md` para verificación completa.

---

**¡Listo para deploy!** 🚀

