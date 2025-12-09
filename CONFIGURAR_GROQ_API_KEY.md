# 🔑 Configurar GROQ_API_KEY para VoltAgent

## 📋 Pasos Rápidos

### 1. Obtener API Key de GROQ

1. Ve a: **https://console.groq.com/**
2. Crea una cuenta o inicia sesión (es **gratis**)
3. Ve a **"API Keys"** en el menú
4. Haz clic en **"Create API Key"**
5. Copia la nueva key (empieza con `gsk_`)
6. **¡GUÁRDALA!** Solo se muestra una vez

### 2. Configurar en PowerShell

#### Opción A: Para esta sesión solamente
```powershell
$env:GROQ_API_KEY = "gsk-tu-api-key-aqui"
```

#### Opción B: Permanente (recomendado)
```powershell
[System.Environment]::SetEnvironmentVariable('GROQ_API_KEY', 'gsk-tu-api-key-aqui', 'User')
```

Después de configurarla permanentemente, **cierra y vuelve a abrir PowerShell** para que surta efecto.

### 3. Verificar que está configurada

```powershell
$env:GROQ_API_KEY
```

Deberías ver tu API key.

---

## 🚀 Ejecutar Corrección Automática

Una vez configurada la API key, ejecuta:

```powershell
.\configurar-y-corregir-todo.ps1
```

O directamente:

```powershell
node corregir-todos-errores-proyecto-voltagent.js
```

---

## ✅ Ventajas de GROQ

- ✅ **Gratis** - Plan gratuito disponible
- ✅ **Rápido** - Respuestas muy rápidas
- ✅ **Potente** - Modelos 70B disponibles
- ✅ **Sin límites estrictos** - Límites generosos

---

## ⚠️ Notas de Seguridad

- ⚠️ **NUNCA** compartas tu API key públicamente
- ✅ Guarda la key de forma segura
- ✅ Si se expone, revócala y crea una nueva en la consola de GROQ

---

## 🆘 Solución de Problemas

### La API key no funciona
1. Verifica que empiece con `gsk_`
2. Verifica que no tenga espacios antes o después
3. Crea una nueva key en la consola de GROQ
4. Asegúrate de haber cerrado y abierto PowerShell después de configurarla permanentemente

### "GROQ_API_KEY no configurada"
- Verifica que la variable esté configurada: `$env:GROQ_API_KEY`
- Si usaste la Opción B (permanente), cierra y abre PowerShell de nuevo
- O usa la Opción A (sesión) antes de ejecutar el script

---

**✨ Una vez configurada, los subagentes de VoltAgent funcionarán automáticamente con GROQ.**

