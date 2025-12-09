# 🚀 Deploy y Testing del Servidor MCP-SANDRA

## Procedimiento Paso a Paso

### Opción 1: Testing Local (Recomendado para desarrollo)

#### Paso 1: Iniciar Servidor y Ejecutar Tests

**Windows PowerShell:**
```powershell
cd C:\Temp\PWA_test\mcp-server
.\start-and-test.ps1
```

**Manual (si el script no funciona):**
```powershell
# Terminal 1: Iniciar servidor
cd C:\Temp\PWA_test\mcp-server
node index.js

# Terminal 2: Ejecutar tests
cd C:\Temp\PWA_test\mcp-server
node test-mcp-complete.js
```

#### Paso 2: Verificar Resultados

El script ejecutará automáticamente todos los tests:
- ✅ Health Check
- ✅ Status del Sistema
- ✅ Welcome Message (TTS)
- ✅ Ambientación Dinámica (Vídeo)
- ✅ Mensaje Conserje (Chat)
- ✅ Flujo Completo de Voz (STT -> LLM -> TTS)
- ✅ Búsqueda de Public APIs

---

### Opción 2: Deploy en Producción (Railway/Render/VPS)

#### Paso 1: Preparar Variables de Entorno

```bash
# Copiar plantilla
cp .env.production.example .env.production

# Editar con claves reales (solo localmente)
nano .env.production
```

#### Paso 2: Deploy en Railway

1. **Conectar Repositorio**
   - Railway Dashboard > New Project
   - Deploy from GitHub repo
   - Seleccionar repositorio

2. **Configurar Variables**
   - Settings > Variables
   - Añadir todas las variables de `.env.production`

3. **Deploy**
   - Push a `main` = deploy automático

#### Paso 3: Testing Post-Deploy

```bash
# Health Check
curl https://tu-servidor-railway.railway.app/health

# Ejecutar tests completos (ajustar URL)
MCP_BASE_URL=https://tu-servidor-railway.railway.app node test-mcp-complete.js
```

---

## 🧪 Tests Incluidos

### 1. Health Check (`/health`)
Verifica que el servidor está corriendo y todos los servicios están disponibles.

### 2. Status del Sistema (`/api/status`)
Comprueba el estado de cada servicio (Qwen, Cartesia, BridgeData, etc.)

### 3. Welcome Message (`/api/audio/welcome`)
Genera el saludo inicial de Sandra con TTS y ambientación.

### 4. Ambientación Dinámica (`/api/video/ambientation`)
Obtiene la ambientación actual según la hora del día.

### 5. Mensaje Conserje (`/api/conserje/message`)
Procesa un mensaje de texto con el rol Conserje de Sandra.

### 6. Flujo Completo de Voz (`/api/conserje/voice-flow`)
Flujo completo: STT (transcripción) → LLM (procesamiento) → TTS (voz)

### 7. Búsqueda de Public APIs (`/api/apis/search`)
Busca APIs públicas indexadas localmente.

---

## ✅ Resultados Esperados

### Todos los Tests Pasados

```
═══════════════════════════════════════════════════════
📊 RESULTADOS FINALES
═══════════════════════════════════════════════════════
  ✅ health: PASS
  ✅ status: PASS
  ✅ welcome: PASS
  ✅ ambientation: PASS
  ✅ conserje: PASS
  ✅ voiceFlow: PASS
  ✅ publicAPIs: PASS

✅ Tests pasados: 7/7

🎉 ¡TODOS LOS TESTS PASARON!
✨ El servidor MCP-SANDRA está funcionando correctamente
```

---

## 🔧 Troubleshooting

### Servidor no inicia

**Error**: `Error: Cannot find module './routes/audio'`

**Solución**: Verifica que todos los archivos estén en su lugar:
```bash
ls routes/ services/ middleware/
```

### Tests fallan por falta de API Keys

**Error**: `CARTESIA_API_KEY no configurada`

**Solución**: Asegúrate de tener `.env.production` con todas las claves necesarias, o usa `.env.production.example` como base.

### Puerto ya en uso

**Error**: `Error: listen EADDRINUSE: address already in use :::4042`

**Solución**: 
```bash
# Windows
netstat -ano | findstr :4042
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:4042 | xargs kill
```

---

## 📊 Checklist de Deployment

Antes de considerar el deployment exitoso:

- [ ] Todos los tests pasan localmente
- [ ] Variables de entorno configuradas en producción
- [ ] Health check responde correctamente
- [ ] Servicios inicializan sin errores
- [ ] WebSocket funciona (opcional, probar manualmente)
- [ ] Logs no muestran errores críticos
- [ ] Integración con PWA funciona (si aplica)

---

## 🎯 Próximos Pasos

Después de que todos los tests pasen:

1. **Integrar con PWA en Vercel**
   - Configurar `MCP_SERVER_URL` en Vercel
   - Actualizar endpoints en la PWA

2. **Monitoreo en Producción**
   - Configurar alertas
   - Revisar logs regularmente
   - Verificar snapshots automáticos

3. **Optimización**
   - Ajustar timeouts según latencia real
   - Optimizar fallbacks de modelos
   - Configurar rate limiting si es necesario

---

**✨ ¡Servidor MCP-SANDRA desplegado y testeado exitosamente!**

