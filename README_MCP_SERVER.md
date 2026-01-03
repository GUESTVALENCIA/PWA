# 🚀 Servidor MCP para ChatGPT Desktop

## Descripción

Este servidor MCP (Model Context Protocol) permite a **ChatGPT Desktop** acceder directamente a tu proyecto PWA de Guests Valencia. ChatGPT puede leer archivos, explorar la estructura, verificar configuración, buscar código y mucho más.

## 🎯 Características

- ✅ **8 Recursos MCP** - Archivos y configuración accesibles
- ✅ **7 Herramientas MCP** - Operaciones sobre el proyecto
- ✅ **Seguridad** - Solo acceso a archivos del proyecto
- ✅ **Protocolo Estándar** - Compatible con ChatGPT Desktop
- ✅ **Transporte stdio** - Comunicación directa con ChatGPT

## 📦 Instalación

```bash
# Instalar dependencias
npm install @modelcontextprotocol/sdk dotenv
```

## ⚙️ Configuración en ChatGPT Desktop

### Paso 1: Localizar Archivo de Configuración

**Windows:**
```
%APPDATA%\ChatGPT\mcp.json
```

O busca en:
- `%USERPROFILE%\.chatgpt\mcp.json`
- `C:\Users\TU_USUARIO\AppData\Roaming\ChatGPT\mcp.json`

**macOS:**
```
~/Library/Application Support/ChatGPT/mcp.json
```

**Linux:**
```
~/.config/ChatGPT/mcp.json
```

### Paso 2: Crear/Editar Archivo de Configuración

Crea el archivo `mcp.json` con este contenido (ajusta la ruta):

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

**⚠️ IMPORTANTE:** 
- Usa la ruta **absoluta** completa a `mcp-server-chatgpt.js`
- En Windows, usa barras invertidas dobles `\\` o barras normales `/`
- Ajusta la ruta según tu sistema

### Paso 3: Reiniciar ChatGPT Desktop

Cierra y vuelve a abrir ChatGPT Desktop para que cargue el servidor MCP.

## 🧪 Probar la Conexión

Abre ChatGPT Desktop y prueba con estos comandos:

```
¿Qué recursos MCP tienes disponibles?
```

```
Lee el archivo package.json del proyecto
```

```
Dame información sobre el proyecto
```

```
Verifica qué APIs están configuradas
```

## 📚 Recursos Disponibles

1. **`pwa://project/package.json`** - Dependencias y scripts
2. **`pwa://project/README.md`** - Documentación
3. **`pwa://project/server.js`** - Servidor principal
4. **`pwa://project/index.html`** - Cliente PWA
5. **`pwa://config/websocket`** - Configuración WebSocket
6. **`pwa://config/voice-services`** - Servicios de voz
7. **`pwa://config/api-keys`** - Estado de API keys
8. **`pwa://project/structure`** - Estructura del proyecto

## 🛠️ Herramientas Disponibles

### `read_file`
Lee cualquier archivo del proyecto.

**Ejemplo:**
```
Lee el archivo src/websocket/socket-server.js
```

### `list_files`
Lista archivos en un directorio.

**Ejemplo:**
```
Lista todos los archivos en src/services
```

### `get_project_info`
Información general del proyecto.

**Ejemplo:**
```
Dame información sobre el proyecto
```

### `check_api_status`
Verifica API keys configuradas.

**Ejemplo:**
```
¿Qué APIs están configuradas?
```

### `get_websocket_config`
Configuración del servidor WebSocket.

**Ejemplo:**
```
¿Cuál es la configuración del WebSocket?
```

### `search_code`
Busca texto en el código.

**Ejemplo:**
```
Busca todas las referencias a "Deepgram"
```

### `get_file_stats`
Estadísticas de un archivo.

**Ejemplo:**
```
Dame estadísticas de src/websocket/socket-server.js
```

## 🔒 Seguridad

- ✅ Solo acceso a archivos dentro del proyecto
- ✅ API keys nunca se exponen (solo estado)
- ✅ Validación de rutas
- ✅ Límites en búsquedas

## 🐛 Troubleshooting

### El servidor no se conecta

1. Verifica la ruta en `args[0]` (debe ser absoluta)
2. Verifica que Node.js esté en el PATH
3. Verifica que `@modelcontextprotocol/sdk` esté instalado

### ChatGPT no encuentra el servidor

1. Reinicia ChatGPT Desktop
2. Verifica ubicación del archivo de configuración
3. Revisa logs de ChatGPT Desktop

### Errores de permisos

1. Asegúrate de que Node.js tenga permisos de lectura
2. En Windows, ejecuta ChatGPT Desktop como administrador si es necesario

## 📖 Ejemplos de Uso

### Análisis de Código
```
Analiza src/websocket/socket-server.js y explícame cómo funciona el sistema de llamadas.
```

### Exploración
```
Explora la estructura del proyecto y dame un resumen de los componentes principales.
```

### Verificación
```
Verifica qué APIs están configuradas y el estado del servidor WebSocket.
```

### Búsqueda
```
Busca todas las referencias a "Deepgram" en el código.
```

## 🎉 ¡Listo!

Ahora ChatGPT Desktop puede:
- ✅ Leer cualquier archivo de tu proyecto
- ✅ Explorar la estructura
- ✅ Verificar configuración
- ✅ Buscar código
- ✅ Analizar y explicar código

¡Disfruta trabajando en equipo! 🚀
