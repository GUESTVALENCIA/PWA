# 🔑 Instrucciones: Actualizar API Key de Deepgram en Render

## API Key Nueva (Management API)

La nueva API key es para **producción** (diferente de la consola):
```
7272fea75e3f1f064f64db4f43ff5f19e576e642
```

## Pasos para Actualizar en Render

### 1. Acceder a Render Dashboard

1. Ve a [Render Dashboard](https://dashboard.render.com/)
2. Inicia sesión con tu cuenta

### 2. Encontrar el Servicio

1. Busca el servicio: **pwa-imbf** (o el nombre de tu servicio)
2. Haz clic en el servicio para abrirlo

### 3. Actualizar Variable de Entorno

1. En el menú lateral, haz clic en **"Environment"** (Entorno)
2. Busca la variable: **`DEEPGRAM_API_KEY`**
3. Haz clic en el valor actual para editarlo
4. **Reemplaza** el valor antiguo con la nueva API key:
   ```
   7272fea75e3f1f064f64db4f43ff5f19e576e642
   ```
5. Haz clic en **"Save Changes"** (Guardar cambios)

### 4. Reiniciar el Servicio

1. Render debería detectar el cambio y reiniciar automáticamente
2. Si no se reinicia automáticamente:
   - Ve a la pestaña **"Events"** o **"Logs"**
   - Haz clic en **"Manual Deploy"** → **"Clear build cache & deploy"**

### 5. Verificar

1. Espera a que el servicio se reinicie (2-3 minutos)
2. Prueba la llamada conversacional
3. Revisa los logs para verificar que no hay errores de autenticación

## Notas Importantes

- ✅ Esta API key es para **producción** (no consola)
- ✅ Tiene acceso a **Management API** para configurar el sistema
- ✅ **NO** compartas esta API key públicamente
- ✅ **NO** la subas a Git/GitHub
- ✅ Solo debe estar en las variables de entorno de Render

## Próximos Pasos (Después de Actualizar)

Una vez actualizada la API key:

1. ✅ El error STT debería desaparecer
2. ✅ Podremos usar Management API para configurar voces
3. ✅ Podremos configurar el pipeline completo via API
