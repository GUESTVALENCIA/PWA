# ✅ VERIFICACIÓN: Formato Deepgram TTS REST API

## 🎯 CURL OFICIAL (Funciona)

```bash
curl \
  -X POST \
  -H "Authorization: Token 58932654923e15110bbc67234b98276d0ef8f8c2" \
  -H "Content-Type: text/plain" \
  -d "Gracias por su paciencia mientras revisábamos el historial de su cuenta; he aplicado un descuento por lealtad de $45.75 a su próximo ciclo de facturación. Puede verificar este ajuste iniciando sesión en su cuenta con el código de referencia CS-92140." \
  "https://api.deepgram.com/v1/speak?model=aura-2-celeste-es" \
  -o audio.mp3
```

## ✅ FORMATO CORRECTO

1. **Método:** POST ✅
2. **Headers:**
   - `Authorization: Token {API_KEY}` ✅
   - `Content-Type: text/plain` ✅ (NO application/json)
3. **Body:** Texto directamente ✅ (NO JSON)
4. **URL:** `https://api.deepgram.com/v1/speak?model=aura-2-celeste-es` ✅

---

## 🔍 CÓDIGO ACTUAL (Verificado)

```javascript
const url = `https://api.deepgram.com/v1/speak?model=${encodeURIComponent(model)}`;

const response = await fetch(url, {
  method: 'POST',
  headers: {
    'Authorization': `Token ${this.deepgramApiKey}`,
    'Content-Type': 'text/plain' // ✅ CORRECTO
  },
  body: text // ✅ CORRECTO - texto directamente, NO JSON
});
```

## ✅ COMPARACIÓN

| Aspecto | CURL Oficial | Código Actual | Estado |
|---------|--------------|---------------|--------|
| Método | POST | POST | ✅ |
| Authorization | Token {KEY} | Token {KEY} | ✅ |
| Content-Type | text/plain | text/plain | ✅ |
| Body | Texto directo | Texto directo | ✅ |
| URL | /v1/speak?model=... | /v1/speak?model=... | ✅ |

---

## 🎙️ MODELOS DISPONIBLES

### **Femeninas:**
- ✅ `aura-2-celeste-es` (Colombia) - **ACTUAL**
- `aura-2-carina-es` (Peninsular)
- `aura-2-diana-es` (Peninsular)
- `aura-2-agustina-es` (Peninsular)
- `aura-2-silvia-es` (Peninsular)
- `aura-2-estrella-es` (México)

### **Masculinas:**
- `aura-2-nestor-es` (Peninsular)
- `aura-2-alvaro-es` (Peninsular)

---

## ✅ CONCLUSIÓN

**El código está CORRECTO y coincide 100% con el curl oficial.**

- ✅ Formato correcto (`text/plain`)
- ✅ Body correcto (texto directo)
- ✅ Headers correctos
- ✅ URL correcta
- ✅ Modelo correcto (`aura-2-celeste-es`)

**Listo para usar en producción.** 🚀

---

**Última actualización:** 2026-01-02  
**Estado:** ✅ Verificado y correcto
