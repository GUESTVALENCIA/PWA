# 📋 PLAN: Configuración Deepgram Management API

## Objetivo

Configurar el sistema completo usando Deepgram Management API para aprovechar todas las capacidades:
- Voice Agent Pipeline (Escuchar/Pensar/Hablar)
- Todas las voces españolas peninsular disponibles
- Configuración optimizada via API

## Fase 1: Investigación y Preparación

1. **Obtener lista completa de voces:**
   - Voces femeninas españolas peninsular
   - Voces masculinas españolas peninsular
   - Características de cada voz

2. **Revisar Management API:**
   - Endpoints disponibles
   - Permisos necesarios
   - Configuración de Voice Agent

3. **Revisar Voice Agent Settings:**
   - Formato de mensaje Settings
   - Configuración de Listen/Think/Speak
   - Integración con nuestro LLM actual

## Fase 2: Creación de API Key

1. Crear API Key con permisos:
   - `keys:write`
   - `project:write`
   - (otros necesarios)

2. Configurar en variables de entorno

## Fase 3: Implementación

1. Implementar cliente Management API
2. Configurar Voice Agent pipeline
3. Integrar todas las voces disponibles
4. Testing completo

## Estado Actual

- ✅ Investigando Management API
- ⏳ Esperando logs del servidor para corregir error STT
- ⏳ Necesito lista completa de voces oficial
