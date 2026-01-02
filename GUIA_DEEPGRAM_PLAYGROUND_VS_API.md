# 📚 GUÍA: Deepgram Playground vs API - Cómo Funciona

## 🔍 DIFERENCIA CRÍTICA: Playground vs API Real

### **Playground (Lo que ves en la web)**
- ✅ **Es una DEMO/SIMULACIÓN** para probar modelos
- ✅ **Muestra TODOS los modelos** (incluso los que no tienes acceso)
- ✅ **No refleja tu plan real** - es solo para testing
- ✅ **Puedes "tocar" cualquier modelo** pero no significa que funcione en tu API

### **API Real (Lo que usa tu código)**
- ⚠️ **Depende de TU PLAN** (Free, Pay As You Go, Growth, Enterprise)
- ⚠️ **Solo modelos disponibles en tu plan** funcionan
- ⚠️ **Si usas modelo no disponible → Error 1008** (Policy Violation)

---

## 🎯 CÓMO SABER QUÉ MODELOS TIENES DISPONIBLES

### **Método 1: Verificar en tu cuenta Deepgram**
1. Ve a: https://console.deepgram.com/
2. Dashboard → **Projects** → Tu proyecto
3. **Settings** → **API Keys** → Ver permisos
4. **Models** → Ver modelos disponibles según tu plan

### **Método 2: Consultar API directamente**
```bash
# Ver modelos disponibles en tu cuenta
curl -X GET "https://api.deepgram.com/v1/projects/{PROJECT_ID}/models" \
  -H "Authorization: Token TU_API_KEY"
```

### **Método 3: Script de verificación (lo voy a crear)**

---

## 📊 MODELOS POR PLAN

### **Plan FREE (Gratuito)**
- ✅ **STT:** `nova-2`, `nova` (limitado)
- ❌ **TTS:** Solo modelos básicos (si acaso)
- ❌ **Aura-2:** Generalmente NO disponible

### **Plan PAY AS YOU GO** (Tu plan actual)
- ✅ **STT:** `nova-2`, `nova`, `whisper`, `base`
- ✅ **TTS:** `aura-2-agustina-es` y otros modelos Aura-2
- ✅ **Streaming:** Disponible
- ⚠️ **Límites:** Por uso (pago por caracteres)

### **Plan GROWTH**
- ✅ **Todo lo de Pay As You Go**
- ✅ **Modelos premium adicionales**
- ✅ **Mejor soporte**

### **Plan ENTERPRISE**
- ✅ **Todos los modelos**
- ✅ **Modelos personalizados**
- ✅ **SLA garantizado**

---

## 🔧 POR QUÉ SE ROMPIÓ EL STREAMING

### **Antes (WebRTC)**
- ✅ Funcionaba con configuración diferente
- ✅ Protocolo más simple
- ✅ Menos estricto con modelos

### **Ahora (WebSocket Streaming)**
- ⚠️ **Más estricto** con validación de modelos
- ⚠️ **Requiere configuración exacta** (sample_rate, encoding)
- ⚠️ **Error 1008** = Modelo no disponible O configuración incorrecta

---

## ✅ SOLUCIÓN: Verificar Modelos Disponibles

Voy a crear un script que:
1. ✅ Consulta tu API Key de Deepgram
2. ✅ Verifica qué modelos TTS tienes disponibles
3. ✅ Lista modelos Aura-2 en español disponibles
4. ✅ Te dice exactamente qué puedes usar

---

## 🎯 PRÓXIMOS PASOS

1. **Crear script de verificación** → Ver modelos reales disponibles
2. **Verificar en tu cuenta** → Confirmar plan y modelos
3. **Ajustar código** → Usar solo modelos disponibles
4. **Probar streaming** → Con modelo confirmado

---

**IMPORTANTE:** El Playground es solo una DEMO. Lo que importa es lo que tu API Key puede hacer.
