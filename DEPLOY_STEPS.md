# 🚀 PASOS INMEDIATOS PARA DEPLOY

## ✅ Estado Actual

- ✅ Verificación pre-deploy completada exitosamente
- ✅ Todos los archivos críticos presentes
- ✅ Serverless functions configuradas
- ⚠️ Hay cambios sin commitear en Git
- ⚠️ Branch local detrás de origin/main (11 commits)

---

## 📋 COMANDOS PARA EJECUTAR

### Paso 1: Actualizar desde remoto

```bash
# Actualizar desde remoto (merge seguro)
git pull origin main --no-rebase
```

Si hay conflictos, resuélvelos antes de continuar.

### Paso 2: Añadir todos los cambios

```bash
# Añadir archivos modificados y nuevos
git add .

# Verificar qué se va a commitear
git status
```

### Paso 3: Commit

```bash
git commit -m "Sistema completo: Sandra IA con flujo de voz, detección automática de entorno, integración Galaxy, y deployment ready para Vercel"
```

### Paso 4: Push a GitHub

```bash
git push origin main
```

---

## 🌐 DEPLOY EN VERCEL

### Opción A: Dashboard de Vercel (Recomendado)

1. Ve a: https://vercel.com/new
2. Selecciona "Import Git Repository"
3. Conecta `GUESTVALENCIA/PWA`
4. Configura:
   - Framework: **Other**
   - Root: `/`
   - Build: *(vacío)*
   - Output: `.`
5. **AÑADE VARIABLES DE ENTORNO** (ver abajo)
6. Click "Deploy"

### Opción B: Vercel CLI

```bash
# Instalar CLI
npm i -g vercel

# Login
vercel login

# Deploy (primera vez)
vercel

# Deploy a producción
vercel --prod
```

---

## 🔐 VARIABLES DE ENTORNO EN VERCEL

**CRÍTICO:** Configura estas variables en **Settings > Environment Variables**:

```
GEMINI_API_KEY=...
OPENAI_API_KEY=...
GROQ_API_KEY=...
CARTESIA_API_KEY=...
CARTESIA_VOICE_ID=...
DEEPGRAM_API_KEY=...
```

**Selecciona para:** Production, Preview, Development

---

## ✅ VERIFICACIÓN POST-DEPLOY

Una vez desplegado, verifica:

- [ ] Página carga: `https://[tu-proyecto].vercel.app`
- [ ] Widget Galaxy funciona
- [ ] `/api/sandra/chat` responde
- [ ] Voz de Sandra funciona

---

**¿Listo? Ejecuta los comandos del Paso 1-4 y luego deploy en Vercel.** 🚀

