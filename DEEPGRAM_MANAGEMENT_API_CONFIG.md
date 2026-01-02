# 🚀 DEEPGRAM MANAGEMENT API - Configuración Completa

## 📋 Información Recibida

Deepgram ofrece **Management API** para configurar pipelines y servicios de forma programática.

## 🔑 Autenticación y Permisos

### API Keys Requeridas

Para configurar pipelines y servicios, necesitas crear una API Key con permisos específicos:

**Permisos necesarios:**
- `keys:write` - Crear otras claves API
- `project:write` - Administrar configuraciones del proyecto
- `member:write` - Gestionar miembros del proyecto (si aplica)

### Autenticación

Cada solicitud debe incluir:
```
Authorization: Token <YOUR_DEEPGRAM_API_KEY>
```

## 🎙️ Voice Agent Pipeline

Deepgram Voice Agent usa un pipeline de 3 componentes:

1. **Escuchar (Listen)** - Configuración del modelo de transcripción (STT)
   - Modelo: `nova-2-phonecall` (actualmente usado)
   - Configuración: `language`, `encoding`, `sample_rate`, etc.

2. **Pensar (Think)** - Integración con LLM
   - Proveedores: OpenAI, Anthropic, Groq
   - Configuración del prompt y comportamiento

3. **Hablar (Speak)** - Configuración del modelo TTS (Aura)
   - Modelos: `aura-2-*` (Carina, Diana, Agustina, Silvia, Nestor, etc.)
   - Configuración de voz y características

### Configuración via WebSocket

El Voice Agent se configura enviando un mensaje `Settings` a través de WebSocket:
```json
{
  "type": "Settings",
  "listen": { /* STT config */ },
  "think": { /* LLM config */ },
  "speak": { /* TTS config */ }
}
```

## 📝 Voces Españolas Peninsular

### Femeninas (según información recibida):
1. **Carina** - Profesional, enérgica, segura
2. **Diana** - Profesional, confiada, expresiva
3. **Agustina** ⭐ (ACTUAL) - Calmada, clara, profesional
4. **Silvia** - Carismática, clara, natural

### Masculinas:
- **Nestor** - Calmado y profesional

**Nota:** Necesito obtener la lista completa oficial de Deepgram.

## 🔧 Management API Endpoints

Según documentación de Deepgram:

### Proyectos
- `GET /v1/projects` - Listar proyectos
- `GET /v1/projects/{project_id}` - Obtener proyecto
- `PATCH /v1/projects/{project_id}` - Actualizar proyecto

### API Keys
- `GET /v1/projects/{project_id}/keys` - Listar keys
- `POST /v1/projects/{project_id}/keys` - Crear key
- `DELETE /v1/projects/{project_id}/keys/{key_id}` - Eliminar key

### Membros
- `GET /v1/projects/{project_id}/members` - Listar miembros
- `POST /v1/projects/{project_id}/members` - Agregar miembro
- `DELETE /v1/projects/{project_id}/members/{member_id}` - Eliminar miembro

## 🎯 Próximos Pasos

1. Obtener lista completa de voces españolas peninsular
2. Crear API Key con permisos adecuados
3. Investigar configuración de Voice Agent pipeline
4. Planificar migración a Management API
5. Configurar todas las voces disponibles
