# Guía Rápida: Configuración de ngrok para MCP

## Paso 1: Completar registro en ngrok

En el formulario que estás viendo:

1. **"How would you describe yourself?"**
   - Selecciona: **"Developer"** o **"Software Engineer"**

2. **"What are you interested in using ngrok for?"**
   - Selecciona: **"Sharing local apps without deploying"**
   - Esta es la opción perfecta para exponer tu servidor MCP local

3. **"Are you using ngrok for..."**
   - Selecciona: **"Personal projects"** o **"Work/Company"** (según corresponda)

4. Completa cualquier otro campo requerido y haz clic en **"Continue"** o **"Sign Up"**

---

## Paso 2: Obtener tu Authtoken

Una vez que completes el registro:

1. Te redirigirá al dashboard de ngrok
2. Ve directamente a: **https://dashboard.ngrok.com/get-started/your-authtoken**
3. Verás un token que se ve así:
   ```
   2abc123def456ghi789jkl012mno345pqr678stu
   ```
4. **Copia ese token completo**

---

## Paso 3: Configurar ngrok en tu máquina

Abre PowerShell y ejecuta:

```powershell
.\start-ngrok.ps1 -AuthToken TU_TOKEN_AQUI
```

Reemplaza `TU_TOKEN_AQUI` con el token que copiaste.

**O manualmente:**
```powershell
ngrok config add-authtoken TU_TOKEN_AQUI
```

Verás:
```
Authtoken saved to configuration file: C:\Users\TU_USUARIO\AppData\Local\ngrok\ngrok.yml
```

✅ **¡Listo!** Ngrok ya está configurado.

---

## Paso 4: Iniciar el túnel

Con el servidor MCP corriendo (`npm run mcp` en otra ventana):

```powershell
.\start-ngrok.ps1
```

O simplemente:
```powershell
ngrok http 4042
```

Verás algo como:
```
Forwarding  https://abc123xyz.ngrok-free.app -> http://localhost:4042
```

Tu endpoint MCP será: `https://abc123xyz.ngrok-free.app/mcp`

---

## Paso 5: Obtener la URL (opcional)

En otra ventana PowerShell:
```powershell
.\get-ngrok-url.ps1
```

Esto te mostrará la URL pública completa para usar en ChatGPT.

