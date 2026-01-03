# 🚀 Herramientas de Ejecución MCP - ChatGPT Desktop

## 📋 Resumen

El servidor MCP ahora incluye **7 herramientas de ejecución** que permiten a ChatGPT Desktop ejecutar código, comandos y scripts directamente en tu proyecto PWA.

## 🛠️ Herramientas de Ejecución Disponibles

### 1. `execute_command` ⚡
**Ejecuta comandos shell en el proyecto**

**Ejemplos de uso en ChatGPT:**
```
Ejecuta el comando "npm test" en el proyecto
```

```
Ejecuta "node test-script.js" con argumentos ["--verbose"]
```

**Parámetros:**
- `command` (requerido): Comando a ejecutar (ej: "npm", "node", "git")
- `args` (opcional): Array de argumentos
- `workingDirectory` (opcional): Directorio de trabajo (default: ".")
- `timeout` (opcional): Timeout en ms (default: 30000)

**Comandos permitidos:** npm, node, npx, git, echo, cat, ls, dir, pwd, cd

---

### 2. `execute_node_script` 💻
**Ejecuta código JavaScript directamente**

**Ejemplos de uso:**
```
Ejecuta este código JavaScript: console.log("Hola desde MCP"); const pkg = require('./package.json'); console.log(pkg.name);
```

**Parámetros:**
- `code` (requerido): Código JavaScript a ejecutar
- `timeout` (opcional): Timeout en ms (default: 10000)

**Nota:** El código se ejecuta en el contexto del proyecto con acceso a todas las dependencias.

---

### 3. `run_npm_script` 📦
**Ejecuta scripts npm definidos en package.json**

**Ejemplos de uso:**
```
Ejecuta el script npm "test"
```

```
Ejecuta el script "build" con argumentos ["--production"]
```

**Parámetros:**
- `script` (requerido): Nombre del script (ej: "test", "build", "dev")
- `args` (opcional): Argumentos adicionales

**Scripts disponibles en tu proyecto:**
- `start` - Inicia el servidor
- `dev` - Modo desarrollo con nodemon
- `test` - Ejecuta tests
- `build:tailwind` - Compila Tailwind CSS

---

### 4. `execute_file` 📄
**Ejecuta un archivo JavaScript del proyecto**

**Ejemplos de uso:**
```
Ejecuta el archivo test-mcp-server.js
```

```
Ejecuta src/scripts/verify-config.js con argumentos ["--check-all"]
```

**Parámetros:**
- `filePath` (requerido): Ruta del archivo (relativa a la raíz)
- `args` (opcional): Argumentos para pasar al script
- `timeout` (opcional): Timeout en ms (default: 30000)

**Nota:** Solo archivos `.js` y `.mjs`

---

### 5. `run_test` 🧪
**Ejecuta tests del proyecto**

**Ejemplos de uso:**
```
Ejecuta todos los tests del proyecto
```

```
Ejecuta tests que coincidan con el patrón "socket"
```

**Parámetros:**
- `pattern` (opcional): Patrón para filtrar tests
- `watch` (opcional): Modo watch (default: false)

---

### 6. `install_dependencies` 📥
**Instala dependencias del proyecto**

**Ejemplos de uso:**
```
Instala todas las dependencias del proyecto
```

```
Instala el paquete "express" como dependencia de desarrollo
```

**Parámetros:**
- `package` (opcional): Paquete específico a instalar
- `dev` (opcional): Instalar como dev dependency (default: false)

---

## 🔒 Seguridad

- ✅ Solo comandos permitidos (npm, node, npx, git, etc.)
- ✅ Solo ejecución dentro del directorio del proyecto
- ✅ Validación de rutas de archivos
- ✅ Timeouts configurables
- ✅ Limpieza automática de scripts temporales

## 📚 Ejemplos Completos de Uso

### Ejecutar Tests
```
Ejecuta los tests del proyecto usando run_test
```

### Ejecutar Script Personalizado
```
Ejecuta el archivo scripts/verify-apis.js
```

### Instalar Nueva Dependencia
```
Instala el paquete "lodash" como dependencia de producción
```

### Ejecutar Código JavaScript
```
Ejecuta este código: const fs = require('fs'); console.log(fs.readdirSync('.').slice(0, 5));
```

### Ejecutar Comando Git
```
Ejecuta "git status" para ver el estado del repositorio
```

## 🎯 Casos de Uso Reales

### 1. Verificar Estado del Proyecto
```
Ejecuta "npm run test" para verificar que todo funciona
```

### 2. Instalar Dependencias Faltantes
```
Instala todas las dependencias del proyecto
```

### 3. Ejecutar Scripts de Verificación
```
Ejecuta el archivo scripts/verify-config.js
```

### 4. Probar Código Rápido
```
Ejecuta este código JavaScript: console.log(process.env.NODE_ENV || 'development');
```

## ⚠️ Notas Importantes

1. **Timeouts:** Los comandos tienen timeouts por defecto. Ajusta según necesidad.
2. **Scripts Temporales:** `execute_node_script` crea scripts temporales que se limpian automáticamente.
3. **Salida:** Toda la salida (stdout y stderr) se captura y retorna.
4. **Errores:** Los errores se retornan con `isError: true` pero no detienen el servidor.

## 🚀 ¡Listo!

Ahora ChatGPT Desktop puede:
- ✅ Ejecutar cualquier comando permitido
- ✅ Ejecutar código JavaScript directamente
- ✅ Ejecutar scripts npm
- ✅ Ejecutar archivos del proyecto
- ✅ Ejecutar tests
- ✅ Instalar dependencias

¡Trabaja en equipo con ChatGPT Desktop ejecutando código directamente! 🎉
