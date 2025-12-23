#  Plan de Implementación: Sandra-Live para GuestsValencia

##  Objetivo
Implementar el sistema conversacional avanzado Sandra-Live adaptado al contexto de hospedaje y turismo de GuestsValencia, integrando function calling para acciones automatizadas (reservas, consultas de disponibilidad, etc.)

---

##  Componentes a Implementar

### 1. Estado Global de Sesión/Reserva (`lib/sessionState.js`)
**Similar a `orderState.ts` del PDF pero adaptado:**
- Estado de reserva actual (propiedad, fechas, huéspedes)
- Carrito/reserva temporal
- Información del cliente
- Historial de acciones

### 2. Herramientas del Cliente (`lib/clientTools.js`)
**Funciones que la IA puede invocar:**
- `bookAccommodation(propertyId, checkIn, checkOut, guests)` - Procesar reserva
- `checkAvailability(propertyId, checkIn, checkOut)` - Verificar disponibilidad
- `highlightProperty(propertyId)` - Resaltar propiedad en interfaz
- `showPropertyDetails(propertyId)` - Mostrar detalles de propiedad
- `addToWishlist(propertyId)` - Añadir a favoritos
- `getRecommendations(criteria)` - Obtener recomendaciones

### 3. Sistema de Ejecución (`lib/callFunctions.js`)
**Mapeo y ejecución de herramientas:**
- Registro de herramientas disponibles
- Invocación segura desde el cliente
- Manejo de errores

### 4. Prompt del Sistema (`lib/systemPrompt.js`)
**Contexto y personalidad de Sandra:**
- Rol: Asistente de hospedaje experta
- Reglas conversacionales
- Descripción de herramientas disponibles
- Ejemplos de uso

### 5. API Mejorada (`api/sandra/assistant.js`)
**Endpoint con function calling:**
- STT mejorado (Deepgram)
- LLM con function calling (OpenAI/Gemini)
- TTS mejorado (Cartesia)
- Manejo de herramientas en backend
- Respuestas con acciones

### 6. Integración en Widget (`index.html`)
**Actualizar SandraWidget:**
- Cargar herramientas y estado global
- Ejecutar acciones cuando la IA las invoca
- Mostrar feedback visual
- Sincronizar con interfaz

---

##  Flujo de Conversación Mejorado

```
Usuario habla → STT (Deepgram) → Transcripción
                                    ↓
                    LLM (GPT-4/Gemini) con Function Calling
                                    ↓
                    ¿Quiere invocar herramienta?
                    /                    \
                  SÍ                      NO
                  ↓                        ↓
        Ejecutar herramienta        Respuesta directa
        (bookAccommodation, etc.)   (texto)
                  ↓                        ↓
        Resultado → LLM          TTS (Cartesia)
                  ↓                        ↓
        Respuesta final          Audio de respuesta
                  ↓                        ↓
        └─────────────────────────────────┘
                    ↓
            Usuario escucha respuesta
```

---

##  Archivos a Crear/Modificar

### Nuevos Archivos:
1. `lib/sessionState.js` - Estado global
2. `lib/clientTools.js` - Herramientas del cliente
3. `lib/callFunctions.js` - Ejecutor de herramientas
4. `lib/systemPrompt.js` - Prompt del sistema
5. `api/sandra/assistant.js` - API con function calling

### Archivos a Modificar:
1. `index.html` - Integrar herramientas en widget
2. `api/api-gateway.js` - Añadir endpoint `/sandra/assistant`
3. `vercel.json` - Configurar ruta nueva

---

##  Orden de Implementación

1.  Crear estado global (`sessionState.js`)
2.  Crear herramientas (`clientTools.js`)
3.  Crear ejecutor (`callFunctions.js`)
4.  Crear prompt (`systemPrompt.js`)
5.  Crear API endpoint (`api/sandra/assistant.js`)
6.  Integrar en widget (`index.html`)
7.  Actualizar API gateway
8.  Probar flujo completo

---

##  Adaptaciones del Sistema Original

### Del PDF (Taquería) → GuestsValencia:

| Original (PDF) | Adaptado (GuestsValencia) |
|----------------|---------------------------|
| `updateOrder(productId, cantidad)` | `bookAccommodation(propertyId, checkIn, checkOut, guests)` |
| `highlightProduct(productId)` | `highlightProperty(propertyId)` |
| `processPayment()` | `confirmBooking()` |
| `orderState` (tacos, bebidas) | `sessionState` (propiedades, fechas, huéspedes) |

---

##  Características Clave

### Function Calling:
- La IA puede invocar acciones automáticamente
- Sin necesidad de explicar al usuario que está ejecutando código
- Respuestas naturales: "He encontrado la propiedad perfecta..." (después de ejecutar `checkAvailability`)

### Estado Persistente:
- Mantiene contexto de la reserva durante la conversación
- Sincroniza con la interfaz web
- Permite continuar conversaciones anteriores

### Integración Seamless:
- No rompe funcionalidad existente
- Compatible con llamadas conversacionales actuales
- Mejora gradual del sistema

---

##  Criterios de Éxito

- [ ] La IA puede verificar disponibilidad automáticamente
- [ ] La IA puede iniciar reservas cuando el usuario lo solicita
- [ ] Las propiedades se resaltan automáticamente en la interfaz
- [ ] El flujo conversacional es natural y fluido
- [ ] No se rompe funcionalidad existente
- [ ] Todo funciona en producción con MCP server

---

##  Referencias

- PDF Original: `Sandra-Live_ Sistema Conversacional Avanzado (Producción).pdf`
- Sistema Actual: `index.html` (SandraWidget class)
- API Gateway: `api/api-gateway.js`

