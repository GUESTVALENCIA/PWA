#  Sandra-Live: Implementación Completa

##  Sistema Implementado

Se ha implementado completamente el sistema conversacional avanzado **Sandra-Live** adaptado al contexto de hospedaje y turismo de GuestsValencia, basado en el PDF proporcionado.

---

##  Componentes Creados

### 1. **Estado Global de Sesión** (`lib/sessionState.js`)
- Estado de reserva actual (propiedad, fechas, huéspedes)
- Historial de propiedades vistas
- Wishlist de favoritos
- Criterios de búsqueda
- Historial de acciones

### 2. **Herramientas del Cliente** (`lib/clientTools.js`)
Funciones que la IA puede invocar automáticamente:
- `bookAccommodation()` - Iniciar reserva
- `checkAvailability()` - Verificar disponibilidad
- `highlightProperty()` - Resaltar propiedad en interfaz
- `showPropertyDetails()` - Mostrar detalles
- `addToWishlist()` - Añadir a favoritos
- `getRecommendations()` - Obtener recomendaciones

### 3. **Ejecutor de Herramientas** (`lib/callFunctions.js`)
- Mapeo de herramientas
- Ejecución segura desde el cliente
- Manejo de errores

### 4. **Prompt del Sistema** (`lib/systemPrompt.js`)
- Contexto de Sandra como asistente de hospedaje
- Definiciones de herramientas para OpenAI Function Calling
- Reglas conversacionales adaptadas

### 5. **API Endpoint** (`api/sandra/assistant.js`)
- Endpoint `/api/sandra/assistant` con function calling
- Integración STT (Deepgram)
- Integración LLM (OpenAI/Gemini) con function calling
- Integración TTS (Cartesia) opcional
- Manejo completo del flujo conversacional

---

##  Flujo de Conversación

```
Usuario escribe/habla
    ↓
Transcripción (STT con Deepgram)
    ↓
LLM con Function Calling (GPT-4/Gemini)
    ↓
¿Invoca herramienta?
    /              \
  SÍ               NO
    ↓                ↓
Ejecuta acción    Respuesta directa
(en cliente)         ↓
    ↓            TTS (Cartesia)
Resultado → LLM      ↓
    ↓           Audio respuesta
Respuesta final      ↓
    ↓            └─────┘
Usuario ve/escucha respuesta
```

---

##  Integración en el Widget

### Métodos Añadidos a `SandraWidget`:
- `initSessionState()` - Inicializa estado global
- `handleToolAction()` - Ejecuta acciones invocadas por la IA
- Historial de conversación para context-aware responses

### Métodos Añadidos a `SandraGateway`:
- `sendMessageWithTools()` - Nuevo método para usar el endpoint `/api/sandra/assistant`

### Cambios en `sendMessage`:
- Ahora usa el nuevo endpoint con function calling cuando está activado
- Maneja acciones retornadas por la IA
- Fallback al método legacy si falla

---

##  Características Clave

### Function Calling Automático:
- La IA puede invocar acciones sin explicarlo al usuario
- Respuestas naturales: "He encontrado la propiedad perfecta..." (después de `checkAvailability`)
- Flujo conversacional fluido y natural

### Estado Persistente:
- Mantiene contexto de reserva durante la conversación
- Sincroniza con la interfaz web
- Permite continuar conversaciones anteriores

### Compatibilidad:
- No rompe funcionalidad existente
- Compatible con llamadas conversacionales actuales
- Activable/desactivable con flag `useFunctionCalling`

---

##  Configuración

### Variables de Entorno Necesarias (ya configuradas):
- `OPENAI_API_KEY` o `GEMINI_API_KEY` - Para LLM
- `DEEPGRAM_API_KEY` - Para STT
- `CARTESIA_API_KEY` - Para TTS (opcional)
- `CARTESIA_VOICE_ID` - ID de voz (opcional)

### Rutas Configuradas:
- `/api/sandra/assistant` - Endpoint principal (en `vercel.json`)

---

##  Uso

### Activación Automática:
El sistema está activado por defecto (`useFunctionCalling: true` en el widget).

### Ejemplo de Conversación:

**Usuario**: "Busco un apartamento en Ruzafa del 15 al 20 de marzo para 2 personas"

**Sandra** (invoca `getRecommendations` automáticamente):
"¡Perfecto! Te busco alojamientos disponibles en esas fechas en Ruzafa..."

**Usuario**: "Quiero reservar el apartamento en la calle X"

**Sandra** (invoca `checkAvailability` y luego `bookAccommodation`):
"Déjame verificar la disponibilidad... ¡Perfecto! He iniciado tu reserva..."

---

##  Estado de Implementación

- [x] Estado global de sesión
- [x] Herramientas del cliente
- [x] Ejecutor de herramientas
- [x] Prompt del sistema
- [x] API endpoint con function calling
- [x] Integración en widget
- [x] Configuración de rutas
- [x] Compatibilidad con sistema existente

---

##  Archivos Modificados/Creados

### Nuevos:
- `lib/sessionState.js`
- `lib/clientTools.js`
- `lib/callFunctions.js`
- `lib/systemPrompt.js`
- `api/sandra/assistant.js`
- `SANDRA_LIVE_IMPLEMENTATION_PLAN.md`

### Modificados:
- `index.html` - Integración en widget
- `vercel.json` - Nueva ruta `/api/sandra/assistant`

---

##  Referencias

- PDF Original: `Sandra-Live_ Sistema Conversacional Avanzado (Producción).pdf`
- Plan de Implementación: `SANDRA_LIVE_IMPLEMENTATION_PLAN.md`

---

##  ¡Sistema Completo e Implementado!

El sistema Sandra-Live está completamente integrado y listo para usar. La IA ahora puede:
-  Verificar disponibilidad automáticamente
-  Iniciar reservas cuando el usuario lo solicita
-  Resaltar propiedades en la interfaz
-  Proporcionar recomendaciones personalizadas
-  Gestionar favoritos y detalles de propiedades

Todo funciona de forma natural y conversacional, sin que el usuario note que se están ejecutando herramientas en segundo plano.

