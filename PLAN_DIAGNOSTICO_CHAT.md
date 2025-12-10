# Plan de Diagnóstico y Corrección - Chat No Conecta

## Problema Reportado
- **Antes**: Chat funcionaba, solo faltaba audio en llamada conversacional
- **Ahora**: Chat no conecta, muestra error de conexión
- **Llamada conversacional**: No funciona (audio no se reproduce)

## Análisis del Problema

### Flujo del Chat
1. Usuario escribe mensaje → `sendMessage()` en widget
2. `gateway.sendMessage()` → fetch a `/api/sandra/chat`
3. `gateway.sendMessageWithTools()` → fetch a `/api/sandra/assistant`
4. API procesa con AI → retorna respuesta
5. Widget muestra respuesta en chat

### Cambios Recientes
- Modificaciones solo en WebSocket handler (`ws.onmessage`) para llamadas conversacionales
- NO se modificó lógica del chat REST API
- NO se modificó inicialización del widget

### Posibles Causas

#### 1. Error en Endpoint de API
- `/api/sandra/chat` podría estar fallando
- `/api/sandra/assistant` podría estar fallando
- Variables de entorno no configuradas

#### 2. Error en Manejo de Errores
- El catch podría estar ocultando el error real
- Mensaje de error genérico no ayuda a diagnosticar

#### 3. Problema de CORS
- Headers CORS mal configurados
- Vercel rewrite no funciona correctamente

#### 4. Problema de Inicialización
- Widget no se inicializa correctamente
- Gateway no se crea bien

## Plan de Ejecución

### FASE 1: Diagnóstico

#### Paso 1.1: Mejorar Logging en Widget
- Añadir logs detallados en `sendMessage()` y `sendMessageWithTools()`
- Capturar error completo (status, statusText, body)
- Mostrar URL exacta que se está llamando

#### Paso 1.2: Verificar Endpoints
- Crear script de prueba para `/api/sandra/chat`
- Crear script de prueba para `/api/sandra/assistant`
- Verificar que responden correctamente

#### Paso 1.3: Revisar Configuración
- Verificar `api/config.js` funciona
- Verificar variables de entorno en Vercel
- Verificar que `vercel.json` tiene rewrites correctos

### FASE 2: Correcciones

#### Paso 2.1: Mejorar Manejo de Errores
- Mejorar mensajes de error en widget
- Añadir retry logic si es necesario
- Validar respuesta antes de procesar

#### Paso 2.2: Validar Respuestas de API
- Verificar formato de respuesta
- Validar que `data.reply` existe
- Manejar casos edge

#### Paso 2.3: Asegurar Inicialización
- Verificar que widget se inicializa después de cargar config
- Añadir verificaciones de estado
- Prevenir múltiples inicializaciones

### FASE 3: Verificación

#### Paso 3.1: Pruebas Locales
- Probar chat en localhost
- Verificar logs en consola
- Probar con diferentes mensajes

#### Paso 3.2: Pruebas en Producción
- Probar en Vercel deployment
- Verificar logs en Vercel
- Confirmar que todo funciona

## Archivos a Modificar

1. `index.html`:
   - Mejorar `sendMessage()` con mejor logging
   - Mejorar `sendMessageWithTools()` con mejor logging
   - Mejorar manejo de errores
   - Validar respuestas

2. Crear `test-chat-api.js`:
   - Script para probar endpoints de chat
   - Verificar conectividad

3. Verificar `api/api-gateway.js`:
   - Revisar manejo de errores
   - Revisar formato de respuesta

4. Verificar `api/sandra/assistant.js`:
   - Revisar manejo de errores
   - Revisar formato de respuesta

## Prioridades

1. **CRÍTICO**: Hacer que el chat funcione de nuevo
2. **ALTO**: Mejorar logging para diagnosticar problemas futuros
3. **MEDIO**: Optimizar manejo de errores
4. **BAJO**: Añadir retry logic

## Métricas de Éxito

- ✅ Chat envía mensajes correctamente
- ✅ Chat recibe respuestas correctamente
- ✅ Errores se muestran claramente en consola
- ✅ No hay errores silenciosos
- ✅ Logs permiten diagnosticar problemas fácilmente

