# 🔧 CONFIGURACIÓN: Unificación IA-SANDRA + PWA

## 📋 Requisitos Previos

### 1. Clonar Repositorio IA-SANDRA

El orquestador necesita acceso al repositorio IA-SANDRA. Tienes dos opciones:

#### Opción A: Git Submodule (Recomendado)

```bash
# Desde la raíz del proyecto PWA
cd C:\Users\clayt\OneDrive\GUESTVALENCIAPWA
git submodule add https://github.com/GUESTVALENCIA/IA-SANDRA.git IA-SANDRA
```

#### Opción B: Clonar Manualmente

```bash
# Clonar en una ubicación accesible
cd C:\Users\clayt\OneDrive
git clone https://github.com/GUESTVALENCIA/IA-SANDRA.git IA-SANDRA
```

### 2. Configurar Variable de Entorno

Agregar a tu archivo `.env`:

```env
# Ruta al repositorio IA-SANDRA
SANDRA_REPO_PATH=C:\Users\clayt\OneDrive\IA-SANDRA

# O si usas submodule:
# SANDRA_REPO_PATH=./IA-SANDRA
```

### 3. Verificar Estructura del Repo IA-SANDRA

El orquestador busca las siguientes carpetas en IA-SANDRA:

```
IA-SANDRA/
├── services/              # Servicios de IA
├── neon-db-adapter/       # Adaptador Neon (opcional)
├── negotiation/          # Pipeline de negociación
└── context/              # Orquestador de contexto
```

---

## 🚀 Inicialización

El orquestador se inicializa automáticamente al arrancar el servidor (`server.js`).

### Verificar Estado

El servidor mostrará logs como:

```
🚀 Inicializando Sandra Orchestrator...
[SANDRA ORCHESTRATOR] 🔌 Inicializado - Ruta IA-SANDRA: C:\Users\clayt\OneDrive\IA-SANDRA
[SANDRA ORCHESTRATOR] 🚀 Iniciando unificación con IA-SANDRA...
[SANDRA ORCHESTRATOR] 📦 Encontrados X servicios en IA-SANDRA
[SANDRA ORCHESTRATOR] ✅ Servicio cargado: [nombre]
[SANDRA ORCHESTRATOR] ✅ Unificación completada exitosamente
✅ Sandra Orchestrator inicializado correctamente
```

### Estado de Fallback

Si el repo IA-SANDRA no está disponible, el sistema continuará usando los servicios del PWA:

```
⚠️ Repo IA-SANDRA no encontrado en: [ruta]
⚠️ Continuando sin servicios de IA-SANDRA (usando servicios del PWA)
```

---

## 📊 Uso en el Código

### Acceder a Servicios de IA-SANDRA

```javascript
// En cualquier ruta o servicio
app.get('/api/test-sandra', (req, res) => {
  const sandraOrchestrator = req.services.sandra;
  
  if (sandraOrchestrator && sandraOrchestrator.isInitialized()) {
    const status = sandraOrchestrator.getStatus();
    res.json({ status, message: 'IA-SANDRA conectado' });
  } else {
    res.json({ message: 'IA-SANDRA no disponible' });
  }
});
```

### Usar Pipeline de Negociación

```javascript
// En el WebSocket server o servicios de voz
const negotiationBridge = req.services.negotiation;

if (negotiationBridge) {
  const offer = await negotiationBridge.calculateOffer({
    propertyId: 'prop_123',
    startPrice: 100,
    season: 'high',
    channel: 'phone',
    guests: 2,
    nights: 3
  });
  
  console.log('Oferta calculada:', offer);
}
```

### Usar Orquestador de Contexto

```javascript
// En el WebSocket server
const contextBridge = req.services.contextBridge;

if (contextBridge) {
  const context = await contextBridge.getContext({
    ipAddress: '192.168.1.1',
    country: 'ES',
    city: 'Valencia',
    timezone: 'Europe/Madrid'
  });
  
  console.log('Contexto personalizado:', context);
}
```

---

## 🔍 Troubleshooting

### Error: "Repo IA-SANDRA no encontrado"

**Solución:**
1. Verificar que la ruta en `SANDRA_REPO_PATH` es correcta
2. Verificar que el repo existe en esa ubicación
3. Verificar permisos de lectura

### Error: "No se encontraron servicios"

**Solución:**
1. Verificar que la carpeta `services/` existe en IA-SANDRA
2. Verificar que los archivos son `.js` o `.mjs`
3. Revisar logs para errores de carga específicos

### Error: "Pipeline de negociación no disponible"

**Solución:**
1. Verificar que la carpeta `negotiation/` existe
2. Verificar que tiene un archivo principal (`index.js`, `pipeline.js`, etc.)
3. El sistema usará lógica de fallback si no está disponible

---

## 📝 Notas Importantes

1. **Sin Modificaciones**: El orquestador NO modifica ninguno de los dos repos
2. **Carga Dinámica**: Los servicios se cargan dinámicamente al iniciar
3. **Fallback Automático**: Si IA-SANDRA no está disponible, usa servicios del PWA
4. **Compatibilidad**: Mantiene compatibilidad con código existente

---

## 🎯 Próximos Pasos

1. ✅ Clonar repo IA-SANDRA
2. ✅ Configurar `SANDRA_REPO_PATH` en `.env`
3. ✅ Reiniciar servidor
4. ✅ Verificar logs de inicialización
5. ✅ Probar servicios de IA-SANDRA

---

**Estado**: 🚀 Listo para usar
