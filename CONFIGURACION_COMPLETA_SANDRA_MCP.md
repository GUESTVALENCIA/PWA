# 🔧 CONFIGURACIÓN COMPLETA - Sandra MCP + Aplicación de Escritorio

## 📋 OBJETIVO

Configurar y sincronizar:
1. ✅ Servidor MCP en Render (`https://pwa-imbf.onrender.com`)
2. ✅ Aplicación de escritorio Sandra Studio Ultimate
3. ✅ Repositorio IA-SANDRA (GitHub)
4. ✅ Widget PWA (GuestsValencia)

---

## 🚀 PASO 1: Verificar Servidor MCP en Render

### Estado Actual:
- **URL:** `https://pwa-imbf.onrender.com`
- **Puerto:** `4042`
- **WebSocket:** `wss://pwa-imbf.onrender.com` (sin puerto explícito)
- **Status:** ✅ Desplegado y funcionando

### Variables de Entorno en Render:
```bash
# ===== LLM APIs =====
OPENAI_API_KEY=sk-proj-...
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AIzaSy...

# ===== Voice APIs =====
CARTESIA_API_KEY=a34aec03-...
CARTESIA_VOICE_ID=2d5b0e6cf361460aa7fc47e3cee4b30c
DEEPGRAM_API_KEY=30e9dbaec...

# ===== BrightData Proxy =====
BRIGHTDATA_PROXY_URL=wss://brd-customer-...
BRIDGEDATA_API_KEY=brd-customer-...

# ===== Database =====
NEON_DB_URL=postgresql://...
DATABASE_URL=postgresql://...

# ===== Server Config =====
MCP_PORT=4042
MCP_HOST=0.0.0.0
NODE_ENV=production
ALLOWED_ORIGINS=*

# ===== Security =====
SANDRA_TOKEN=sk-sandra-production-token
REQUIRE_AUTH=false
```

---

## 🖥️ PASO 2: Configurar Aplicación de Escritorio

### Ubicación:
```
C:\Users\clayt\Desktop\Sandra Studio Ultimate.lnk
→ C:\Users\clayt\Desktop\Sandra-IA-8.0-Pro\sandra_studio_ultimate\
```

### Archivos a Configurar:

#### 1. `.env.pro` (Raíz del proyecto IA-SANDRA)
```bash
# ===== MCP Server Configuration =====
MCP_SERVER_URL=https://pwa-imbf.onrender.com
MCP_PORT=4042
MCP_SECRET_KEY=sandra_mcp_ultra_secure_2025

# ===== LLM APIs =====
OPENAI_API_KEY=sk-proj-...
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AIzaSy...

# ===== Voice APIs =====
CARTESIA_API_KEY=a34aec03-...
CARTESIA_VOICE_ID=2d5b0e6cf361460aa7fc47e3cee4b30c
DEEPGRAM_API_KEY=30e9dbaec...

# ===== HeyGen (Opcional) =====
HEYGEN_API_KEY=tu_clave_heygen
HEYGEN_AVATAR_ID=tu_avatar_id

# ===== BrightData =====
BRIGHTDATA_PROXY_URL=wss://brd-customer-...
BRIDGEDATA_API_KEY=brd-customer-...

# ===== Database =====
NEON_DB_URL=postgresql://...
DATABASE_URL=postgresql://...
```

#### 2. `src/main/orchestrator/sandra-orchestrator.js`
```javascript
class SandraOrchestrator {
  constructor() {
    // PRODUCCIÓN: Usar servidor MCP en Render
    this.mcpBaseUrl = process.env.MCP_SERVER_URL || 'https://pwa-imbf.onrender.com';
    this.mcpPort = process.env.MCP_PORT || '4042';
    this.mcpSecret = process.env.MCP_SECRET_KEY || 'sandra_mcp_ultra_secure_2025';
    
    // Construir URL completa
    const mcpUrl = `${this.mcpBaseUrl}:${this.mcpPort}`;
    
    // Inicializar servicios
    this.qwen3Executor = new Qwen3ExecutorCore(mcpUrl, this.mcpSecret);
    this.descriptiveBypass = new DescriptiveBypass(this.qwen3Executor, mcpUrl, this.mcpSecret);
    
    console.log(`🔗 MCP Universal conectado: ${mcpUrl}`);
  }
}
```

#### 3. `src/main/main.js` (IPC Handler)
```javascript
ipcMain.handle('mcp-get-config', async () => {
  const mcpServerUrl = process.env.MCP_SERVER_URL || 'https://pwa-imbf.onrender.com';
  const mcpPort = process.env.MCP_PORT || '4042';
  
  // Construir URL completa
  const mcpUrl = mcpServerUrl.includes('://') 
    ? (mcpServerUrl.includes(':') ? mcpServerUrl : `${mcpServerUrl}:${mcpPort}`)
    : `http://localhost:${mcpPort}`;
  
  return store.get('mcpConfig', {
    servers: [
      { 
        id: 'mcp-master', 
        name: 'MCP Master (Render)', 
        type: 'http', 
        url: mcpUrl, 
        enabled: true 
      },
      { 
        id: 'windows-cli', 
        name: 'Windows CLI (Local)', 
        type: 'stdio', 
        command: 'node', 
        args: ['C:\\Sandra-IA-8.0-Pro\\mcp-integrado\\build\\index.js'], 
        enabled: false // Deshabilitado, usar Render
      }
    ]
  });
});
```

---

## 🔄 PASO 3: Sincronización con Repositorio IA-SANDRA

### Estructura Esperada:
```
IA-SANDRA/
├── desktop-app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── main.js
│   │   │   └── orchestrator/
│   │   │       └── sandra-orchestrator.js
│   │   └── renderer/
│   │       └── index.html
│   ├── preload.js
│   └── package.json
├── mcp-server/
│   ├── index.js
│   ├── server.js
│   ├── routes/
│   ├── services/
│   └── package.json
├── .env.pro
├── .env.example
└── package.json
```

### Comandos para Sincronizar:

```bash
# En el repositorio IA-SANDRA
cd IA-SANDRA

# Instalar dependencias
npm install

# Verificar configuración MCP
npm run verify:mcp

# Iniciar servidor MCP local (opcional, para desarrollo)
npm run start:mcp

# Iniciar aplicación de escritorio
npm start
# o
./ABRIR_SANDRA.bat
```

---

## ⚙️ PASO 4: Configurar Proveedores en la App

### 1. Abrir Configuración (⚙️)
   - Ir a pestaña "Proveedores"

### 2. Ingresar API Keys:
   - **OpenAI:** (si usas GPT-4o)
   - **Groq:** (MÁS IMPORTANTE - para Mixtral/Llama)
   - **Gemini:** (para modelos Google)
   - **DeepGram:** (para STT)
   - **Cartesia:** (para TTS)
   - **HeyGen:** (opcional, para avatar)

### 3. Configurar MCP:
   - **URL:** `https://pwa-imbf.onrender.com`
   - **Puerto:** `4042`
   - **Secret Key:** `sandra_mcp_ultra_secure_2025`

### 4. Desactivar Modo Offline:
   - Cambiar toggle "Modo Offline" → OFF
   - Esto hará que Sandra use el servidor MCP en Render

---

## ✅ PASO 5: Verificación

### 1. Verificar Servidor MCP:
```bash
# Health Check
curl https://pwa-imbf.onrender.com/health

# Status Check
curl https://pwa-imbf.onrender.com/api/status
```

### 2. Verificar Conexión desde App:
   - Abrir consola de la app (DevTools)
   - Buscar: `🔗 MCP Universal conectado: https://pwa-imbf.onrender.com:4042`
   - Si aparece, conexión exitosa ✅

### 3. Probar Chat:
   - Escribir mensaje en chat
   - Debería responder usando Groq/Mixtral desde Render
   - Ver logs en Render dashboard

---

## 🔍 PASO 6: Troubleshooting

### Problema: App no se conecta al MCP
**Solución:**
1. Verificar `.env.pro` tiene `MCP_SERVER_URL` correcto
2. Verificar que Render está activo: `curl https://pwa-imbf.onrender.com/health`
3. Verificar puerto: debe ser `4042` (no `3001`)
4. Verificar firewall/antivirus no bloquea conexión

### Problema: "Modo Offline" activo
**Solución:**
1. Ir a Configuración → Proveedores
2. Asegurar que todas las API keys están configuradas
3. Desactivar toggle "Modo Offline"
4. Reiniciar aplicación

### Problema: No responde usando Groq
**Solución:**
1. Verificar `GROQ_API_KEY` en Render está configurada
2. Verificar `GROQ_API_KEY` en `.env.pro` de la app
3. Verificar logs en Render para ver si hay errores de API

---

## 📝 RESUMEN DE CONFIGURACIÓN

### Servidor MCP (Render):
- ✅ URL: `https://pwa-imbf.onrender.com`
- ✅ Puerto: `4042`
- ✅ Variables de entorno: Configuradas
- ✅ WebSocket: `wss://pwa-imbf.onrender.com`

### Aplicación de Escritorio:
- ✅ `.env.pro` configurado con `MCP_SERVER_URL`
- ✅ `sandra-orchestrator.js` usando Render
- ✅ `main.js` IPC configurado
- ✅ Proveedores configurados en UI

### Flujo Completo:
```
Usuario → App Desktop → IPC → SandraOrchestrator 
  → Render MCP Server → Groq/OpenAI/Gemini 
  → Respuesta → App Desktop → Usuario
```

---

## 🚀 PRÓXIMOS PASOS

1. ✅ Verificar que Render está activo
2. ✅ Configurar `.env.pro` en IA-SANDRA
3. ✅ Actualizar `sandra-orchestrator.js` y `main.js`
4. ✅ Iniciar aplicación y verificar conexión
5. ✅ Probar chat con Groq
6. ✅ Verificar logs en Render

---

**Fecha de creación:** $(date)
**Última actualización:** $(date)

