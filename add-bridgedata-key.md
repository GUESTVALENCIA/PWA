# 🔑 Añadir BRIDGEDATA_API_KEY

## ⚠️ Variable Crítica Faltante

La variable `BRIDGEDATA_API_KEY` es necesaria para que Sandra pueda pasar datos en tiempo real y gestionar reservas/bookings.

## 📋 Opciones para Añadirla

### Opción 1: Desde Vercel Dashboard (Recomendado)

1. Ve a: https://vercel.com/dashboard
2. Selecciona el proyecto: **pwa**
3. Ve a **Settings > Environment Variables**
4. Click en **Add New**
5. Configura:
   - **Name:** `BRIDGEDATA_API_KEY`
   - **Value:** `tu_clave_api_de_bridgedata`
   - **Environments:** Selecciona Production, Preview, Development
6. Click **Save**

### Opción 2: Desde Terminal

Si tienes la clave API, ejecuta:

```bash
# Para cada entorno
echo "tu_bridgedata_api_key" | npx vercel env add BRIDGEDATA_API_KEY production --token i1lM2Keza4869FscLnkWquYi
echo "tu_bridgedata_api_key" | npx vercel env add BRIDGEDATA_API_KEY preview --token i1lM2Keza4869FscLnkWquYi
echo "tu_bridgedata_api_key" | npx vercel env add BRIDGEDATA_API_KEY development --token i1lM2Keza4869FscLnkWquYi
```

### Opción 3: Añadir al .env y re-ejecutar script

1. Añade al archivo `.env`:
   ```
   BRIDGEDATA_API_KEY=tu_clave_api_aqui
   ```

2. Ejecuta:
   ```bash
   node add-missing-env-vars.js
   ```

## ✅ Después de Añadirla

1. **Reinicia el deployment** (si es necesario) en Vercel Dashboard
2. **Prueba el flujo completo** con datos en tiempo real
3. **Verifica** que Sandra puede acceder a BridgeData API

---

**Una vez añadida, el sistema estará completamente funcional para post-producción con datos en tiempo real.** ✨

