# 🚀 ACTIVACIÓN DE SUBAGENTES CON GROQ API - VOLTAGENT

## ⚠️ IMPORTANTE

Los subagentes deben activarse a través de la consola de VoltAgent usando la API de GROQ, NO manualmente.

## 📋 PASOS PARA ACTIVAR LOS SUBAGENTES

### 1. Abrir la Consola de VoltAgent
- Accede a la consola donde se activan los subagentes
- Ubicación: Debe estar en el repositorio de Sandra IA o en GuestsValencia-Site

### 2. Configurar API Key de GROQ
```bash
export GROQ_API_KEY="tu_api_key_aqui"
```

O en Windows PowerShell:
```powershell
$env:GROQ_API_KEY="tu_api_key_aqui"
```

### 3. Activar Subagente para Corrección de Código

**Comando para activar:**
```
@repository-cleanup-agent corrige los 41 errores de linting en index.html:
- CSS inline styles (líneas: 72, 96, 99, 108, 109, 242, 277, 278, 329, 330, 350, 351, 680, 681, 730, 731, 801)
- Compatibilidad video[playsinline] (líneas: 96, 272, 284, 329, 350, 680, 730)
- Accesibilidad: botones sin title/aria-label (líneas: 298, 305, 308)
- Input file sin label accesible (línea: 262)
- Link sin rel="noopener" (línea: 701)
- iframe referrerpolicy (línea: 801)
- CSS backdrop-filter orden incorrecto (líneas: 45, 46, 55)
```

### 4. Alternativa: Usar Script Node.js

He creado `activar-subagentes-groq.js` que puede activar los subagentes si tienes GROQ_API_KEY configurada.

**Ejecutar:**
```bash
node activar-subagentes-groq.js
```

## 🎯 SUBAGENTES DISPONIBLES

Según `subagents/config.json`:

1. **repository-cleanup-agent** - ✅ Para limpiar código y corregir errores
2. **github-repository-agent** - Para gestión de repositorios
3. **vercel-deploy-agent** - Para deploy en Vercel
4. **github-deploy-agent** - Para deploy desde GitHub

## 📝 NOTA

**El usuario especificó que los subagentes se activan con VoltAgent usando GROQ API**, no manualmente. Este documento es una guía de referencia.

## 🔗 Referencias

- Repositorio VoltAgent: https://github.com/VoltAgent/awesome-claude-code-subagents
- Documentación subagentes: `mcp-server/README_SUBAGENTES.md`
- Configuración subagentes: `subagents/config.json`

