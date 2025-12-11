# 🔗 Configurar VS Code para MCP Server (Render)

Esta guía te permite conectar Visual Studio Code a tu servidor MCP en Render para usar herramientas con modelos Qwen/Groq.

## 📋 Requisitos Previos

1. **Visual Studio Code** instalado
2. **Servidor MCP** desplegado en Render: `https://pwa-imbf.onrender.com`
3. **Token de acceso** MCP (por defecto: `sandra_mcp_ultra_secure_2025`)

## 🚀 Configuración Automática

Ejecuta el script PowerShell desde la raíz del proyecto:

```powershell
.\configurar-vscode-mcp.ps1
```

El script:
- ✅ Crea la configuración MCP en VS Code
- ✅ Configura el token de acceso
- ✅ Crea archivos de configuración alternativos
- ✅ Genera un script de prueba

## 🔧 Configuración Manual

Si prefieres configurarlo manualmente:

### Opción 1: Archivo de Configuración MCP

Crea o edita: `%APPDATA%\Code\User\mcp-servers.json`

```json
{
  "mcpServers": {
    "sandra-mcp-render": {
      "url": "https://pwa-imbf.onrender.com/api/mcp",
      "transport": "http",
      "headers": {
        "Authorization": "Bearer sandra_mcp_ultra_secure_2025"
      }
    }
  }
}
```

### Opción 2: Settings.json de VS Code

Edita: `%APPDATA%\Code\User\settings.json`

```json
{
  "mcp.servers": {
    "sandra-mcp-render": {
      "url": "https://pwa-imbf.onrender.com/api/mcp",
      "token": "sandra_mcp_ultra_secure_2025"
    }
  }
}
```

## 🔌 Instalar Extensión MCP (si es necesario)

1. Abre VS Code
2. Ve a Extensiones (Ctrl+Shift+X)
3. Busca "Model Context Protocol"
4. Instala la extensión oficial de MCP

## ✅ Verificar Conexión

### Método 1: Script de Prueba

```powershell
.\test-mcp-connection.ps1
```

### Método 2: Desde VS Code

1. Abre la paleta de comandos (Ctrl+Shift+P)
2. Busca: `MCP: Connect to Server`
3. Selecciona: `sandra-mcp-render`
4. Verifica que aparezca como conectado

### Método 3: Llamada HTTP Directa

```powershell
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer sandra_mcp_ultra_secure_2025"
}

$body = @{
    method = "initialize"
    params = @{}
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://pwa-imbf.onrender.com/api/mcp" -Method Post -Headers $headers -Body $body
```

## 🛠️ Herramientas Disponibles

Una vez conectado, tendrás acceso a:

- ✅ `execute_command` - Ejecuta comandos del sistema
- ✅ `read_file` - Lee archivos del sistema
- ✅ `write_file` - Escribe archivos
- ✅ `search_web` - Busca en la web
- ✅ `call_api` - Llama a APIs externas

## 🎯 Uso con Modelos Qwen/Groq

Cuando uses modelos Qwen a través de Groq en VS Code:

1. **Configura Groq API Key** en VS Code settings
2. **Selecciona modelo Qwen** (ej: `qwen/qwen-2.5-72b-instruct`)
3. **Las herramientas MCP** estarán disponibles automáticamente
4. El modelo podrá:
   - Navegar por archivos
   - Ejecutar comandos
   - Buscar en la web
   - Llamar a APIs

## 🔐 Seguridad

- **Token de acceso**: Cambia el token por defecto en producción
- **HTTPS**: El servidor MCP usa HTTPS (Render)
- **CORS**: Configurado para permitir conexiones desde VS Code

## 🐛 Troubleshooting

### Error: "Connection refused"
- Verifica que el servidor MCP esté activo: `https://pwa-imbf.onrender.com/health`
- Verifica el token de acceso

### Error: "Unauthorized"
- Verifica que el token sea correcto
- Verifica que `REQUIRE_AUTH` esté configurado correctamente en Render

### Las herramientas no aparecen
- Reinicia VS Code
- Verifica que la extensión MCP esté instalada
- Revisa la consola de VS Code (Help → Toggle Developer Tools)

## 📝 Notas

- El servidor MCP debe estar desplegado y activo en Render
- Las herramientas se ejecutan en el servidor, no localmente
- Para herramientas locales, necesitarías un servidor MCP local

## 🔗 Referencias

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [VS Code MCP Extension](https://marketplace.visualstudio.com/items?itemName=modelcontextprotocol)

