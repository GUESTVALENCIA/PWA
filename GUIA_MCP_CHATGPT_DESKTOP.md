# 🚀 Guía: Conectar PWA con ChatGPT Desktop via MCP

## 📋 Resumen

Este servidor MCP permite a ChatGPT Desktop acceder directamente a tu proyecto PWA de Guests Valencia, leer archivos, explorar la estructura, verificar configuración y mucho más.

## 🔧 Instalación

### 1. Instalar Dependencias

```bash
npm install @modelcontextprotocol/sdk
```

### 2. Hacer el Script Ejecutable (Opcional)

```bash
chmod +x mcp-server-chatgpt.js
```

## 📝 Configuración en ChatGPT Desktop

### Opción 1: Configuración Manual

1. **Abrir ChatGPT Desktop**
2. **Ir a Configuración** (⚙️)
3. **Seleccionar "Conectores" o "MCP Servers"**
4. **Añadir nuevo servidor MCP**

### Opción 2: Archivo de Configuración

**Ubicación del archivo de configuración:**

- **Windows:** `%APPDATA%\ChatGPT\mcp.json` o `%USERPROFILE%\.chatgpt\mcp.json`
- **macOS:** `~/Library/Application Support/ChatGPT/mcp.json`
- **Linux:** `~/.config/ChatGPT/mcp.json`

**Contenido del archivo:**

```json
{
  "mcpServers": {
    "guests-valencia-pwa": {
      "command": "node",
      "args": [
        "C:\\Users\\clayt\\OneDrive\\GUESTVALENCIAPWA\\mcp-server-chatgpt.js"
      ],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

**⚠️ IMPORTANTE:** Ajusta la ruta `args[0]` a la ruta absoluta de tu proyecto.

### Opción 3: Variables de Entorno

Si ChatGPT Desktop soporta variables de entorno, puedes usar:

```json
{
  "mcpServers": {
    "guests-valencia-pwa": {
      "command": "node",
      "args": [
        "${PWA_ROOT}/mcp-server-chatgpt.js"
      ],
      "env": {
        "NODE_ENV": "production",
        "PWA_ROOT": "C:\\Users\\clayt\\OneDrive\\GUESTVALENCIAPWA"
      }
    }
  }
}
```

## 🎯 Recursos Disponibles

El servidor MCP expone los siguientes recursos que ChatGPT puede leer:

1. **`pwa://project/package.json`** - Dependencias y scripts del proyecto
2. **`pwa://project/README.md`** - Documentación principal
3. **`pwa://project/server.js`** - Servidor Express principal
4. **`pwa://project/index.html`** - Cliente principal con widget Sandra
5. **`pwa://config/websocket`** - Configuración del servidor WebSocket
6. **`pwa://config/voice-services`** - Configuración de servicios de voz
7. **`pwa://config/api-keys`** - Estado de API keys (sin valores)
8. **`pwa://project/structure`** - Estructura completa del proyecto

## 🛠️ Herramientas Disponibles

ChatGPT puede usar estas herramientas para interactuar con tu PWA:

### 1. `read_file`
Lee cualquier archivo del proyecto.

**Ejemplo de uso en ChatGPT:**
```
Lee el archivo src/websocket/socket-server.js para entender cómo funciona el sistema de llamadas.
```

### 2. `list_files`
Lista archivos en un directorio.

**Ejemplo:**
```
Lista todos los archivos en el directorio src/services
```

### 3. `get_project_info`
Obtiene información general del proyecto.

**Ejemplo:**
```
Dame información sobre el proyecto: dependencias, scripts, estructura.
```

### 4. `check_api_status`
Verifica qué API keys están configuradas (sin exponer valores).

**Ejemplo:**
```
Verifica qué APIs están configuradas en el proyecto.
```

### 5. `get_websocket_config`
Obtiene la configuración actual del sistema de llamadas.

**Ejemplo:**
```
¿Cuál es la configuración actual del servidor WebSocket?
```

### 6. `search_code`
Busca texto en el código del proyecto.

**Ejemplo:**
```
Busca todas las referencias a "Deepgram" en el código.
```

### 7. `get_file_stats`
Obtiene estadísticas de un archivo.

**Ejemplo:**
```
Dame estadísticas del archivo src/websocket/socket-server.js
```

## 🧪 Probar la Conexión

### Método 1: Desde ChatGPT Desktop

1. Abre ChatGPT Desktop
2. Inicia una nueva conversación
3. Pregunta: "¿Qué recursos MCP tienes disponibles?"
4. O: "Lee el archivo package.json del proyecto"

### Método 2: Prueba Manual (Terminal)

```bash
# El servidor MCP usa stdio, así que puedes probarlo directamente:
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node mcp-server-chatgpt.js
```

## 🔒 Seguridad

- ✅ El servidor **solo** puede acceder a archivos dentro del directorio del proyecto
- ✅ Las API keys **nunca** se exponen (solo se muestra si están configuradas)
- ✅ Validación de rutas para prevenir acceso fuera del proyecto
- ✅ Límites en búsquedas (máximo 50 resultados)

## 🐛 Troubleshooting

### El servidor no se conecta

1. Verifica que la ruta en `args[0]` sea correcta (absoluta)
2. Verifica que Node.js esté en el PATH
3. Verifica que `@modelcontextprotocol/sdk` esté instalado

### ChatGPT no encuentra el servidor

1. Reinicia ChatGPT Desktop después de añadir la configuración
2. Verifica que el archivo de configuración esté en la ubicación correcta
3. Revisa los logs de ChatGPT Desktop para errores

### Errores de permisos

1. Asegúrate de que Node.js tenga permisos para leer archivos del proyecto
2. En Windows, ejecuta ChatGPT Desktop como administrador si es necesario

## 📚 Ejemplos de Uso

### Análisis de Código

```
Analiza el archivo src/websocket/socket-server.js y explícame cómo funciona el sistema de llamadas conversacionales.
```

### Exploración del Proyecto

```
Explora la estructura del proyecto y dame un resumen de los componentes principales.
```

### Verificación de Configuración

```
Verifica qué APIs están configuradas y cuál es el estado del servidor WebSocket.
```

### Búsqueda de Código

```
Busca todas las referencias a "Deepgram" en el código y explícame cómo se usa.
```

## 🎉 ¡Listo!

Una vez configurado, ChatGPT Desktop podrá:
- ✅ Leer cualquier archivo de tu proyecto
- ✅ Explorar la estructura del proyecto
- ✅ Verificar configuración y estado
- ✅ Buscar código y patrones
- ✅ Analizar y explicar el código

¡Disfruta trabajando en equipo con ChatGPT Desktop! 🚀
