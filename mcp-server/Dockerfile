FROM node:18-alpine

WORKDIR /app

# Instalar dependencias del sistema
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias de Node.js
RUN npm ci --only=production

# Copiar código de la aplicación
COPY . .

# Crear directorios necesarios
RUN mkdir -p /app/snapshots /app/data

# Exponer puerto
EXPOSE 4042

# Variables de entorno por defecto
ENV MCP_PORT=4042
ENV MCP_HOST=0.0.0.0
ENV NODE_ENV=production
ENV REQUIRE_AUTH=false

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4042/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Iniciar servidor
CMD ["node", "index.js"]
