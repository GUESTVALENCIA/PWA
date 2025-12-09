# Configuración de Claude Code (Anthropic) en Visual Studio Code

## Pasos para configurar Claude Code en VS Code:

### 1. Instalar la extensión de Claude en VS Code
- Abre Visual Studio Code
- Ve a Extensions (Ctrl+Shift+X o Cmd+Shift+X en Mac)
- Busca "Claude" o "Anthropic Claude"
- Instala la extensión oficial de Anthropic

### 2. Obtener tu API Key de Anthropic
- Ve a https://console.anthropic.com/
- Inicia sesión o crea una cuenta
- Ve a la sección "API Keys"
- Crea una nueva API key o copia una existente

### 3. Agregar la API Key al archivo .env
- Abre el archivo `.env` en la raíz del proyecto
- Agrega la siguiente línea (reemplaza `tu_api_key_aqui` con tu API key real):
  ```
  ANTHROPIC_API_KEY=tu_api_key_aqui
  ```

### 4. Configurar la extensión en VS Code
- Abre Settings en VS Code (Ctrl+, o Cmd+, en Mac)
- Busca "Claude" o "Anthropic"
- En el campo "API Key", pega tu API key de Anthropic
- O configura la variable de entorno `ANTHROPIC_API_KEY` en tu sistema

### 5. Usar Claude Code
- Una vez configurado, podrás usar Claude Code desde VS Code
- Abre el panel de Claude (normalmente con Ctrl+Shift+P y busca "Claude")
- Comienza a usar Claude Code para ayudarte con el código

## Nota importante:
- El archivo `.env` ya está configurado para cargar variables de entorno
- Asegúrate de que el archivo `.env` esté en `.gitignore` para no subir tus API keys a Git
- VS Code leerá automáticamente las variables del archivo `.env` si usas extensiones compatibles

