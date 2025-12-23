#  DEPLOY A PRODUCCIÓN - MCP-SANDRA Server

##  Preparación Pre-Deployment

### 1. Configurar Variables de Entorno

** IMPORTANTE:** Nunca subir archivos `.env` con claves reales al repositorio.

1. Copiar plantilla:
   ```bash
   cp .env.production.example .env.production
   ```

2. Editar `.env.production` con claves reales (solo localmente)

3. Configurar variables en el panel de control de tu plataforma:
   - **Railway**: Settings > Variables
   - **Render**: Environment > Environment Variables
   - **Vercel**: Settings > Environment Variables
   - **VPS**: Usar `export` o gestor de secretos

### 2. Variables Críticas Mínimas

```bash
# Servidor
MCP_PORT=443
NODE_ENV=production

# IA Models (al menos uno)
QWEN_GLOBAL_TOKEN=sk-qwen-...
# O alternativas:
OPENAI_API_KEY=sk-openai-...
GEMINI_API_KEY=AIzaSy-...

# Voice
CARTESIA_API_KEY=sk-cartesia-...
CARTESIA_VOICE_ID=sandra-premium-espanol

# STT
DEEPGRAM_API_KEY=sk-deepgram-...

# Seguridad
SANDRA_TOKEN=sk-sandra-production-...
REQUIRE_AUTH=true
```

---

##  Deployment en Railway

### Opción A: Desde GitHub (Recomendado)

1. **Conectar Repositorio**
   - Ir a Railway Dashboard
   - "New Project" > "Deploy from GitHub repo"
   - Seleccionar el repositorio con `mcp-server/`

2. **Configurar Build**
   - Railway detectará automáticamente el Dockerfile
   - Si no, configurar manualmente:
     - Build Command: (automático)
     - Start Command: `node index.js`
     - Root Directory: `mcp-server`

3. **Configurar Variables**
   - Settings > Variables
   - Añadir todas las variables de `.env.production.example`
   - **No** subir el archivo `.env.production` real

4. **Configurar Puerto**
   - Settings > Networking
   - Exponer puerto: `4042`
   - Railway asignará automáticamente un dominio

5. **Deploy**
   - Push a `main` branch = deploy automático
   - O "Deploy" manual desde Dashboard

### Opción B: Desde Docker Image

```bash
# Construir imagen
docker build -t sandra-mcp-server .

# Subir a Railway
railway login
railway init
railway up
```

---

##  Deployment en Render

### Pasos:

1. **Nuevo Web Service**
   - Dashboard > "New" > "Web Service"
   - Conectar repositorio GitHub

2. **Configuración**
   ```
   Name: sandra-mcp-server
   Environment: Docker
   Build Command: docker build -t sandra-mcp-server .
   Start Command: docker run -p $PORT:4042 sandra-mcp-server
   ```

3. **Variables de Entorno**
   - Environment > Add Environment Variable
   - Añadir todas las variables críticas
   - Importar desde `.env.production.example`

4. **Deploy**
   - Render detectará cambios automáticamente
   - O "Manual Deploy" desde Dashboard

---

##  Deployment en VPS

### Requisitos:
- Ubuntu 20.04+ / Debian 11+
- Docker y Docker Compose instalados
- Nginx (opcional, para proxy reverso)

### Pasos:

1. **Clonar Repositorio**
   ```bash
   git clone tu-repo
   cd mcp-server
   ```

2. **Configurar Variables**
   ```bash
   cp .env.production.example .env.production
   nano .env.production  # Editar con claves reales
   ```

3. **Construir y Ejecutar**
   ```bash
   docker-compose -f docker-compose.yml up -d
   ```

4. **Verificar**
   ```bash
   docker logs sandra-mcp-server
   curl http://localhost:4042/health
   ```

5. **Nginx (Opcional)**
   ```nginx
   server {
       listen 443 ssl;
       server_name mcp.sandra-ia.com;

       location / {
           proxy_pass http://localhost:4042;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

---

##  Integración con Vercel PWA

Una vez desplegado el MCP Server:

1. **Obtener URL del Servidor**
   - Railway: `https://sandra-mcp.railway.app`
   - Render: `https://sandra-mcp-server.onrender.com`
   - VPS: `https://mcp.sandra-ia.com`

2. **Configurar en Vercel**
   - Vercel Dashboard > Project > Settings > Environment Variables
   - Añadir:
     ```
     MCP_SERVER_URL=https://tu-mcp-server-url
     ```
   - Configurar para: Production, Preview, Development

3. **Verificar Conexión**
   ```bash
   curl https://tu-pwa.vercel.app/api/sandra/mcp/status
   ```

---

##  Verificación Post-Deployment

### Health Check

```bash
curl https://tu-mcp-server/health
```

**Respuesta esperada:**
```json
{
  "status": "ok",
  "server": "MCP-SANDRA",
  "version": "1.0.0",
  "services": {
    "qwen": true,
    "cartesia": true,
    "bridgeData": true,
    ...
  }
}
```

### Probar Endpoints

```bash
# Status
curl https://tu-mcp-server/api/status

# Welcome message
curl -X POST https://tu-mcp-server/api/audio/welcome \
  -H "Content-Type: application/json" \
  -d '{"timezone": "Europe/Madrid"}'

# Ambientación
curl https://tu-mcp-server/api/video/ambientation?timezone=Europe/Madrid
```

### WebSocket Test

```javascript
const ws = new WebSocket('wss://tu-mcp-server?token=tu_token');

ws.on('open', () => {
  ws.send(JSON.stringify({
    route: 'conserje',
    action: 'message',
    payload: {
      message: 'Hola Sandra',
      timezone: 'Europe/Madrid'
    }
  }));
});

ws.on('message', (data) => {
  console.log('Respuesta:', JSON.parse(data));
});
```

---

##  Seguridad en Producción

### Checklist:

- [ ] `REQUIRE_AUTH=true` en producción
- [ ] `SANDRA_TOKEN` configurado y seguro
- [ ] `ALLOWED_ORIGINS` limitado a dominios reales
- [ ] HTTPS habilitado (SSL/TLS)
- [ ] Rate limiting activado
- [ ] Logs configurados (sin información sensible)
- [ ] Snapshots automáticos habilitados
- [ ] Monitoreo y alertas configurados

---

##  Monitoreo

### Logs

```bash
# Railway
railway logs

# Render
Dashboard > Logs

# VPS
docker logs -f sandra-mcp-server
```

### Métricas

- Health checks: `/health`
- Status: `/api/status`
- Snapshots: Verificar en `./snapshots/`
- Alarmas: Verificar en logs

---

##  Troubleshooting

### Servidor no inicia

1. Verificar variables de entorno
2. Revisar logs: `docker logs sandra-mcp-server`
3. Verificar puerto: `netstat -tulpn | grep 4042`

### Servicios no disponibles

1. Verificar API keys en `.env`
2. Probar endpoints individuales
3. Revisar conectividad de red

### WebSocket no conecta

1. Verificar token: `?token=tu_token`
2. Verificar CORS: `ALLOWED_ORIGINS`
3. Verificar SSL/TLS si usa `wss://`

---

##  Referencias

- `WORKFLOW_MCP_SANDRA.md` - Plan maestro
- `MCP_DEPLOYMENT_GUIDE.md` - Guía técnica
- `.env.production.example` - Plantilla de variables

---

** ¡Servidor MCP-SANDRA desplegado y listo para producción!**

