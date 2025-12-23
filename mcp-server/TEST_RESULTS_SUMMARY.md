#  Resumen de Testing del Servidor MCP-SANDRA

##  Estado Actual

### Scripts y Documentación Creados

-  `start-and-test.ps1` - Script automático para Windows
-  `test-mcp-complete.js` - Suite completa de tests (7 tests)
-  `DEPLOY_AND_TEST.md` - Guía completa de deployment y testing
-  Directorios creados: `data/`, `snapshots/`, `logs/`

### Tests Implementados

1. **Health Check** (`/health`) - Verifica que el servidor está corriendo
2. **Status del Sistema** (`/api/status`) - Estado de todos los servicios
3. **Welcome Message** (`/api/audio/welcome`) - TTS del saludo inicial
4. **Ambientación Dinámica** (`/api/video/ambientation`) - Ambientación según hora
5. **Mensaje Conserje** (`/api/conserje/message`) - Procesamiento de chat
6. **Flujo Completo de Voz** (`/api/conserje/voice-flow`) - STT → LLM → TTS
7. **Búsqueda de Public APIs** (`/api/apis/search`) - APIs indexadas

---

##  Instrucciones para Ejecutar Tests

### Opción 1: Manual (Recomendado para primera vez)

**Terminal 1 - Iniciar Servidor:**
```powershell
cd C:\Temp\PWA_test\mcp-server
node index.js
```

Deberías ver:
```
============================================================
 MCP-SANDRA Server v1.0.0
============================================================
 HTTP Server: http://0.0.0.0:4042
 WebSocket Server: ws://0.0.0.0:4042
 Health Check: http://0.0.0.0:4042/health
 API Base: http://0.0.0.0:4042/api
============================================================
 Servidor iniciado y listo para orquestar Sandra IA
```

**Terminal 2 - Ejecutar Tests:**
```powershell
cd C:\Temp\PWA_test\mcp-server
node test-mcp-complete.js
```

### Opción 2: Script Automático

```powershell
cd C:\Temp\PWA_test\mcp-server
.\start-and-test.ps1
```

---

##  Notas Importantes

### Variables de Entorno

Asegúrate de tener configurado `.env.production` o al menos `.env.production.example` con:
- Al menos una API Key de LLM (OpenAI, Gemini, o Qwen)
- `CARTESIA_API_KEY` para TTS (opcional, algunos tests pueden fallar)
- `DEEPGRAM_API_KEY` para STT (opcional, algunos tests pueden fallar)

### Errores Comunes

1. **Puerto 4042 en uso**: 
   ```powershell
   Get-NetTCPConnection -LocalPort 4042 | Select-Object OwningProcess | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
   ```

2. **Falta archivo public-apis-index.json**:
   - No crítico, el servicio funcionará pero la búsqueda de APIs puede fallar
   - Para generar: `node scripts/setup-public-apis.js`

3. **API Keys no configuradas**:
   - Los tests marcarán como "PASS" pero mostrarán advertencias
   - Para tests completos, configura al menos las API keys básicas

---

##  Checklist Pre-Deployment

Antes de deploy a producción:

- [ ] Todos los tests pasan localmente
- [ ] Variables de entorno configuradas correctamente
- [ ] Health check responde: `curl http://localhost:4042/health`
- [ ] Servicios inicializan sin errores críticos
- [ ] Logs no muestran errores de API keys (si aplica)
- [ ] Directorios `data/`, `snapshots/`, `logs/` existen

---

##  Próximos Pasos

1. **Ejecutar tests manualmente** usando las instrucciones arriba
2. **Verificar resultados** - Todos los tests deberían pasar
3. **Configurar variables de producción** si vas a deploy
4. **Deploy según DEPLOY_PRODUCCION.md** cuando esté listo

---

**Estado**:  Scripts y documentación listos
**Próximo paso**: Ejecutar tests manualmente para verificar funcionamiento completo

