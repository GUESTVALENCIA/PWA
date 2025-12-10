# 🔧 Configuración Completa de Vercel para el Widget MCP

## ✅ ¿Qué está configurado ahora?

### 1. Endpoint API de Configuración (`/api/config`)

Se ha creado un endpoint API que expone las variables de entorno necesarias para el widget:
- **Archivo**: `api/config.js`
- **Endpoint**: `/api/config`
- **Método**: GET
- **Respuesta**: JSON con `MCP_SERVER_URL` y `MCP_TOKEN` (si está configurado)

Este endpoint permite que el widget obtenga la configuración del servidor MCP sin exponer directamente las variables de entorno en el código del cliente.

### 2. Carga Automática de Configuración

El widget ahora carga automáticamente la configuración desde `/api/config` al iniciar en producción:
- Se ejecuta antes de inicializar `SandraGateway`
- Solo se ejecuta en producción (no en localhost)
- Usa valores por defecto si falla la carga

### 3. Configuración de Vercel (`vercel.json`)

El `vercel.json` está configurado para:
- ✅ Servir el endpoint `/api/config`
- ✅ Procesar funciones serverless en `/api/`
- ✅ Configurar caché adecuado para `index.html`
- ✅ Headers de seguridad

## 🔑 Variables de Entorno REQUERIDAS en Vercel

### Configurar en Vercel Dashboard

1. **Ir a tu proyecto en Vercel:**
   ```
   https://vercel.com/dashboard
   ```

2. **Navegar a Settings:**
   ```
   Tu Proyecto > Settings > Environment Variables
   ```

3. **Añadir las siguientes variables:**

   #### **MCP_SERVER_URL** (REQUERIDO)
   ```
   Nombre: MCP_SERVER_URL
   Valor: https://tu-servidor-mcp.com
   Ambiente: Production, Preview, Development (si quieres)
   ```
   
   **Ejemplos de valores:**
   - `https://mcp.sandra-ia.com`
   - `https://tu-mcp-server.railway.app`
   - `https://tu-mcp-server.render.com`
   - `https://tu-mcp-server.herokuapp.com`

   #### **MCP_TOKEN** (OPCIONAL)
   ```
   Nombre: MCP_TOKEN
   Valor: tu-token-de-autenticacion
   Ambiente: Production, Preview (si aplica)
   ```
   
   **Nota:** Solo necesario si tu servidor MCP requiere autenticación. El token se añadirá automáticamente a la URL del WebSocket: `wss://server:4042?token=TU_TOKEN`

## 🧪 Verificar la Configuración

### 1. Verificar Variables de Entorno en Vercel

1. Ve a: **Settings > Environment Variables**
2. Verifica que `MCP_SERVER_URL` esté configurada
3. Verifica que esté asignada al ambiente **Production**

### 2. Verificar Endpoint de Configuración

Después de hacer deploy, verifica que el endpoint funcione:

```bash
# Desde tu terminal o navegador
curl https://pwa-chi-six.vercel.app/api/config
```

**Respuesta esperada:**
```json
{
  "MCP_SERVER_URL": "https://tu-servidor-mcp.com",
  "MCP_TOKEN": null
}
```

### 3. Verificar en la Consola del Navegador

1. Abre tu sitio en producción: `https://pwa-chi-six.vercel.app`
2. Abre la consola del navegador (F12)
3. Busca el mensaje:
   ```
   ✅ [MCP] Configuración cargada desde API: {MCP_SERVER_URL: "...", hasToken: true/false}
   ```
4. Verifica que la URL sea correcta y no sea `localhost`

### 4. Verificar Conexión WebSocket

1. Abre el widget en producción
2. Inicia una llamada conversacional
3. En la consola, busca:
   ```
   🔌 [MCP] Configuración de producción: {wsUrl: "wss://...", ...}
   ```
4. Verifica que `wsUrl` apunte al servidor MCP (no a localhost)

## 📋 Checklist de Configuración Completa

### Antes del Deploy
- [ ] `MCP_SERVER_URL` configurada en Vercel Environment Variables
- [ ] `MCP_TOKEN` configurada (si es necesario)
- [ ] Variables asignadas al ambiente Production
- [ ] `api/config.js` existe y está correcto
- [ ] `vercel.json` tiene la ruta `/api/config` configurada

### Después del Deploy
- [ ] Endpoint `/api/config` responde correctamente
- [ ] Widget carga configuración desde API
- [ ] WebSocket se conecta al servidor MCP (no localhost)
- [ ] Llamada conversacional funciona correctamente
- [ ] Logs en consola muestran configuración correcta

## 🔍 Troubleshooting

### Problema: Endpoint `/api/config` retorna 404

**Solución:**
1. Verifica que `api/config.js` esté en el repositorio
2. Verifica que `vercel.json` tenga la ruta configurada:
   ```json
   {
     "source": "/api/config",
     "destination": "/api/config"
   }
   ```
3. Haz un nuevo deploy

### Problema: Variables de entorno no están disponibles

**Solución:**
1. Verifica en Vercel Dashboard > Settings > Environment Variables
2. Asegúrate de que estén asignadas al ambiente correcto (Production)
3. Haz un nuevo deploy después de añadir las variables

### Problema: Widget usa localhost en producción

**Solución:**
1. Verifica que `MCP_SERVER_URL` esté configurada en Vercel
2. Verifica que el endpoint `/api/config` retorne la URL correcta
3. Verifica en la consola que la configuración se cargue correctamente
4. El código tiene un fallback que previene usar localhost, pero verifica los logs

### Problema: WebSocket no se conecta

**Solución:**
1. Verifica que el servidor MCP esté desplegado y accesible
2. Verifica que el puerto 4042 esté abierto
3. Verifica que la URL del servidor MCP sea correcta
4. Verifica que el token (si es necesario) esté configurado correctamente

## 📚 Referencias

- `CONFIGURACION_MCP_PRODUCCION.md` - Configuración del servidor MCP
- `MEJORAS_SINCRONIZACION_AUDIO_VIDEO.md` - Mejoras implementadas
- `api/config.js` - Endpoint de configuración
- `vercel.json` - Configuración de Vercel

## 🎯 Resumen

**Para que TODO funcione correctamente:**

1. ✅ **Configurar `MCP_SERVER_URL` en Vercel** (REQUERIDO)
2. ✅ **Configurar `MCP_TOKEN` en Vercel** (OPCIONAL, solo si es necesario)
3. ✅ **Hacer deploy** (las variables de entorno se aplican en el próximo deploy)
4. ✅ **Verificar** que el endpoint `/api/config` funcione
5. ✅ **Probar** la llamada conversacional en producción

¡Con esto, la configuración está COMPLETA! 🎉

