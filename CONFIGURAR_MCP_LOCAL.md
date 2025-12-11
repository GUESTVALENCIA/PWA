# 🔧 Servidor MCP Local para VS Code

**PROBLEMA**: Los modelos en VS Code dicen que no pueden usar MCP para acceder a archivos locales.

**SOLUCIÓN**: Ejecutar un servidor MCP LOCAL en tu PC que sí puede acceder a tus archivos.

## 🚀 Configuración Rápida

### 1. Instalar dependencias

```powershell
cd mcp-server-local
npm install
```

### 2. Configurar VS Code

```powershell
.\configurar-vscode-mcp-local.ps1
```

### 3. Reiniciar VS Code

### 4. Conectar servidor MCP

- Abre paleta de comandos: `Ctrl+Shift+P`
- Busca: `MCP: Connect to Server`
- Selecciona: `sandra-local`

## ✅ Ahora los modelos pueden:

- ✅ Leer archivos de tu escritorio
- ✅ Leer archivos del proyecto
- ✅ Escribir archivos
- ✅ Listar directorios
- ✅ Ejecutar comandos locales

## 🔍 Ejemplo de uso

Cuando uses un modelo Qwen/Groq en VS Code, ahora puede hacer:

```
Usuario: "Lee el archivo VARIABLESFULL.txt de mi escritorio"

Modelo: [Usa MCP tool read_file]
        Lee: C:\Users\clayt\Desktop\VARIABLESFULL.txt
        Devuelve el contenido
```

## 🛡️ Seguridad

El servidor MCP local solo puede acceder a:
- Archivos dentro de tu proyecto
- Archivos en tu directorio de usuario (`%USERPROFILE%`)

No puede acceder fuera de estos límites por seguridad.

## 🐛 Troubleshooting

### Error: "Cannot find module @modelcontextprotocol/sdk"
```powershell
cd mcp-server-local
npm install
```

### El servidor no aparece en VS Code
1. Reinicia VS Code completamente
2. Verifica que `mcp-servers.json` existe en `%APPDATA%\Code\User\`
3. Verifica que la extensión MCP está instalada

### Los modelos siguen diciendo que no pueden usar MCP
1. Verifica que el servidor está conectado (debería aparecer en la barra de estado)
2. Prueba con otro modelo
3. Revisa la consola de VS Code (Help → Toggle Developer Tools)

