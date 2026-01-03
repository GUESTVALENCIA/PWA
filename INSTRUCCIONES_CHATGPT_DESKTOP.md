# 🚀 Instrucciones: Conectar Servidor MCP con ChatGPT Desktop

## ✅ Instalación Completada

El servidor MCP ha sido instalado automáticamente en:
```
C:\Users\clayt\AppData\Roaming\ChatGPT\mcp.json
```

## 📋 Configuración Instalada

El archivo `mcp.json` contiene:
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
      },
      "description": "Servidor MCP unificado - Level Enterprise by Power HGPT - Level Galaxy"
    }
  }
}
```

## 🎯 Próximos Pasos

### 1. Reiniciar ChatGPT Desktop
- Cierra completamente ChatGPT Desktop
- Vuelve a abrirlo
- El servidor MCP se conectará automáticamente

### 2. Verificar Conexión
Cuando ChatGPT Desktop se conecte, deberías ver:
- El mensaje de bienvenida de O3 Pro High
- 14 herramientas disponibles
- Acceso a ejecutar código directamente

### 3. Probar la Conexión
En ChatGPT Desktop, prueba con:
```
¿Qué recursos MCP tienes disponibles?
```

O:
```
Ejecuta el comando "npm test" en el proyecto
```

## 🔍 Ubicación del Archivo

Si necesitas editar la configuración manualmente:
```
C:\Users\clayt\AppData\Roaming\ChatGPT\mcp.json
```

## 🛠️ Si No Funciona

### Verificar Node.js
```powershell
node --version
```
Debe mostrar la versión de Node.js instalada.

### Verificar Ruta del Servidor
El archivo debe existir en:
```
C:\Users\clayt\OneDrive\GUESTVALENCIAPWA\mcp-server-chatgpt.js
```

### Reinstalar
Si necesitas reinstalar:
```powershell
node instalar-mcp-chatgpt-desktop.js
```

## 📚 Herramientas Disponibles

### Lectura/Exploración (7):
- `read_file` - Lee archivos
- `list_files` - Lista directorios
- `get_project_info` - Info del proyecto
- `check_api_status` - Estado de APIs
- `get_websocket_config` - Config WebSocket
- `search_code` - Busca en código
- `get_file_stats` - Estadísticas

### Ejecución (7):
- `execute_command` - Ejecuta comandos shell
- `execute_node_script` - Ejecuta código JS
- `run_npm_script` - Ejecuta scripts npm
- `execute_file` - Ejecuta archivos JS
- `run_test` - Ejecuta tests
- `install_dependencies` - Instala paquetes

## 🎉 ¡Listo!

El servidor MCP está instalado y listo para usar. Solo reinicia ChatGPT Desktop y comenzará a funcionar automáticamente.
