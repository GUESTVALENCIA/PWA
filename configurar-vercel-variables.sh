#!/bin/bash
# Script para configurar variables de entorno en Vercel usando CLI

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🔧 Configurando variables de entorno en Vercel..."
echo ""

# URL del servidor MCP en Render
MCP_SERVER_URL="https://pwa-imbf.onrender.com"

echo "📋 Variables a configurar:"
echo "  - MCP_SERVER_URL: $MCP_SERVER_URL"
echo ""

# Verificar que Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI no está instalado${NC}"
    echo "Instala con: npm i -g vercel"
    exit 1
fi

# Configurar MCP_SERVER_URL
echo -e "${YELLOW}Configurando MCP_SERVER_URL...${NC}"
vercel env add MCP_SERVER_URL production <<< "$MCP_SERVER_URL" || {
    echo -e "${YELLOW}Variable ya existe, actualizando...${NC}"
    vercel env rm MCP_SERVER_URL production --yes
    vercel env add MCP_SERVER_URL production <<< "$MCP_SERVER_URL"
}

echo ""
echo -e "${GREEN}✅ Variable MCP_SERVER_URL configurada${NC}"
echo ""

# Preguntar sobre MCP_TOKEN (opcional)
read -p "¿Quieres configurar MCP_TOKEN? (s/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    read -p "Ingresa el MCP_TOKEN: " MCP_TOKEN
    if [ ! -z "$MCP_TOKEN" ]; then
        echo -e "${YELLOW}Configurando MCP_TOKEN...${NC}"
        vercel env add MCP_TOKEN production <<< "$MCP_TOKEN" || {
            echo -e "${YELLOW}Variable ya existe, actualizando...${NC}"
            vercel env rm MCP_TOKEN production --yes
            vercel env add MCP_TOKEN production <<< "$MCP_TOKEN"
        }
        echo -e "${GREEN}✅ Variable MCP_TOKEN configurada${NC}"
    fi
fi

echo ""
echo -e "${GREEN}✅ Configuración completada${NC}"
echo ""
echo "📝 Próximos pasos:"
echo "  1. Haz un nuevo deploy en Vercel"
echo "  2. Verifica la configuración con: curl https://guestsvalencia.es/api/config"
echo "  3. Prueba la conexión WebSocket iniciando una llamada"
echo ""

