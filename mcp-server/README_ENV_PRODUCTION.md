# 📖 Guía de Uso del Entorno `.env.production`

Esta guía proporciona la información necesaria para gestionar y utilizar correctamente el archivo `.env.production` en el despliegue del servidor MCP de Sandra IA. Asegura la correcta configuración del entorno de producción con las credenciales, claves de API y configuraciones necesarias para el funcionamiento completo del ecosistema.

---

## 📁 Archivos Incluidos

- **`.env.production`**: Archivo real con variables de entorno productivas. **⚠️ NO debe compartirse ni subirse a repositorios públicos.**

- **`.env.production.example`**: Plantilla sin datos sensibles para que el equipo sepa qué variables configurar.

---

## ✅ Uso Correcto

### 1. Copiar la Plantilla

```bash
cp .env.production.example .env.production
```

### 2. Rellenar con Valores Seguros

Solicita al administrador o al equipo DevOps los valores actualizados. Completa cada variable cuidadosamente. Algunos ejemplos:

```env
CARTESIA_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
GEMINI_API_KEY=ya29.xxxxxxxxxxxxxxxxxxxxxxxx
NEON_DATABASE_URL=postgres://user:pass@db.neon.tech/dbname
QWEN_GLOBAL_TOKEN=sk-qwen-xxxxxxxxxxxxxxxxxxxxxxxx
DEEPSEEK_TOKEN=sk-deepseek-xxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. Uso Local o en Desarrollo

Para entorno local, puedes cargarlo con herramientas como `dotenv-cli` o integrarlo en el `package.json`:

```bash
# Con dotenv-cli
dotenv -e .env.production -- node index.js

# O directamente con Node.js (dotenv ya está incluido)
node index.js
```

El servidor MCP ya carga automáticamente las variables de entorno usando `dotenv`.

### 4. Despliegue en Vercel

En **Vercel Dashboard**:

1. Ve a **Project Settings > Environment Variables**
2. Copia y pega los valores de `.env.production` uno por uno
3. Configura para: **Production**, **Preview**, y **Development** según corresponda
4. Guarda los cambios

**Importante**: Nunca subas el archivo `.env.production` completo a Vercel. Solo las variables individuales.

### 5. Despliegue en Railway

En **Railway Dashboard**:

1. Selecciona tu proyecto MCP-SANDRA
2. Ve a **Settings > Variables**
3. Añade cada variable manualmente o importa desde `.env.production`
4. Guarda los cambios

Railway también soporta `.env` files si se especifica en el Dockerfile.

### 6. Despliegue en Render

En **Render Dashboard**:

1. Ve a tu servicio **Web Service**
2. Selecciona **Environment**
3. Añade cada variable de entorno manualmente
4. Guarda y despliega

### 7. Despliegue en VPS (Docker)

Si usas Docker en un VPS:

```bash
# Opción 1: Usar --env-file
docker run -d -p 4042:4042 --env-file .env.production sandra-mcp-server

# Opción 2: Con docker-compose
docker-compose up -d
```

Asegúrate de que `docker-compose.yml` esté configurado para leer `.env.production`.

---

## 🔒 Seguridad

### ⚠️ Reglas de Seguridad Críticas

1. **❌ NO subir nunca `.env.production` a GitHub** o repositorios públicos
2. **✅ Asegurarse de tener `.gitignore` correctamente configurado** con:
   ```
   .env.production
   .env.*.local
   ```
3. **✅ Usar variables rotatorias** si se sospecha exposición
4. **✅ No compartir el archivo completo** por email, Slack, o mensajería
5. **✅ Usar gestores de secretos** (Vercel Secrets, Railway Secrets, etc.) cuando sea posible
6. **✅ Revisar permisos del archivo** en sistemas Unix:
   ```bash
   chmod 600 .env.production
   ```

### 🔐 Mejores Prácticas

- Rotar claves periódicamente (cada 90 días recomendado)
- Usar diferentes claves para desarrollo, staging y producción
- Monitorear el uso de APIs para detectar accesos no autorizados
- Limitar el acceso al archivo solo a personal autorizado
- Usar autenticación de dos factores en servicios que lo permitan

---

## 🤗 Tips de Organización

### Estructura Recomendada

Agrupa las variables por servicio para facilitar el mantenimiento:

```env
# === SERVIDOR MCP SANDRA ===
MCP_PORT=443
MCP_HOST=0.0.0.0

# === QWEN MODELS ===
QWEN_GLOBAL_TOKEN=...
QWEN_EXECUTOR_MODEL=...
QWEN_AUDIO_MODEL=...

# === CARTESIA VOICE ===
CARTESIA_API_KEY=...
CARTESIA_VOICE_ID=...

# === TRANSCRIPCIÓN ===
DEEPGRAM_API_KEY=...
```

### Documentación Interna

- Comentar variables opcionales o futuras con `#`
- Agrupar por servicio (Cartesia, OpenAI, Deepgram, etc.)
- Documentar internamente el uso de cada clave
- Mantener un registro de quién tiene acceso a las claves

---

## ♻️ Ejemplo Limpio (Estructura del `.env.production.example`)

```env
# === SERVIDOR MCP SANDRA ===
MCP_PORT=443
MCP_HOST=0.0.0.0

# === QWEN MODELS ===
QWEN_GLOBAL_TOKEN=
QWEN_EXECUTOR_MODEL=qwen2.5-code-r1
QWEN_AUDIO_MODEL=qwen-audio-v1
QWEN_IMAGE_MODEL=qwen-vision-v1
QWEN_VIDEO_MODEL=qwen-video-v1

# === DEEPSEEK RAZONAMIENTO PROFUNDO ===
DEEPSEEK_MODEL=deepseek-r1
DEEPSEEK_TOKEN=

# === CARTESIA VOICE ===
CARTESIA_API_KEY=
CARTESIA_VOICE_ID=sandra-premium-espanol

# === TRANSCRIPCIÓN ===
DEEPGRAM_API_KEY=

# === MODELOS DE FALLBACK (Opcionales) ===
OPENAI_API_KEY=
GEMINI_API_KEY=

# === BASE DE DATOS ===
NEON_DATABASE_URL=

# === SEGURIDAD Y SNAPSHOTS ===
ENABLE_AUTORESTORE=true
SNAPSHOT_INTERVAL_MINUTES=60
```

---

## 🏠 Estado Actual

- ✅ **Sistema conectado a**: PWA + Server MCP
- ✅ **Producción**: Activa y operativa
- ✅ **Variables**: Organizadas, documentadas y funcionales
- ✅ **`.gitignore`**: Configurado correctamente
- ✅ **Plantilla disponible**: `.env.production.example`

---

## 📋 Checklist de Deployment

Antes de desplegar, verifica:

- [ ] `.env.production` tiene todas las variables necesarias
- [ ] Todas las claves API están actualizadas y válidas
- [ ] `.env.production` está en `.gitignore`
- [ ] Variables configuradas en la plataforma de deployment (Vercel/Railway/Render)
- [ ] Health check funciona: `curl https://tu-servidor/health`
- [ ] Servicios se inicializan correctamente
- [ ] Logs no muestran errores de variables faltantes

---

## ✏️ Pendientes (si aplica)

- [ ] Integrar rotación automatizada de claves
- [ ] Conexión con APIs secundarias (si se solicita)
- [ ] Confirmar entorno staging
- [ ] Configurar alertas para claves próximas a expirar
- [ ] Documentar proceso de recuperación de claves

---

## 🆘 Troubleshooting

### Error: "Variable no encontrada"

**Solución**: Verifica que la variable esté en `.env.production` y que el archivo se esté cargando correctamente.

### Error: "Invalid API Key"

**Solución**: 
1. Verifica que la clave sea correcta
2. Comprueba que no haya espacios extras
3. Confirma que la clave no haya expirado

### Variables no se cargan en producción

**Solución**:
1. Verifica que las variables estén configuradas en el panel de control (Vercel/Railway/Render)
2. Asegúrate de que el servicio se haya reiniciado después de añadir variables
3. Revisa los logs del servidor para ver errores específicos

---

## 📚 Referencias

- `DEPLOY_PRODUCCION.md` - Guía completa de deployment
- `WORKFLOW_MCP_SANDRA.md` - Plan maestro del servidor MCP
- `README.md` - Documentación general del servidor

---

## 📞 Contacto

Para dudas sobre el entorno `.env.production`, contactar con:
- **Equipo de orquestación**
- **Responsable del entorno de Sandra IA**
- **Equipo DevOps**

---

**Documentación generada por el sistema de onboarding técnico.**

**Última actualización**: 2025-01-15

