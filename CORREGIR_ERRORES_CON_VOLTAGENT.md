# 🚀 CORREGIR 41 ERRORES CON VOLTAGENT

## Método 1: Usar Script de VoltAgent Directo (RECOMENDADO)

```bash
cd "C:\Users\clayt\Desktop\VoltAgent-Composer-Workflow"
node invocar-agente.js claude-code "Corrige TODOS los 41 errores de linting en index.html ubicado en C:\Users\clayt\OneDrive\GUESTVALENCIAPWA\index.html. Los errores son: CSS inline styles (mover a clases CSS cuando sea posible), compatibilidad video[playsinline] con Firefox, accesibilidad (agregar aria-labels y titles en botones), link sin rel='noopener', iframe referrerpolicy, orden de prefijos CSS. Lee el archivo completo, corrige TODOS los errores y genera el código HTML completo corregido listo para reemplazar."
```

## Método 2: Usar Script Local

```bash
cd "C:\Users\clayt\OneDrive\GUESTVALENCIAPWA"
node corregir-errores-index-voltagent.js
```

## Método 3: Desde la Consola Web de VoltAgent

1. Abre: https://console.voltagent.dev
2. Selecciona el agente: `claude-code`
3. Pega el siguiente prompt:

```
Corrige TODOS los 41 errores de linting en index.html.

Archivo: C:\Users\clayt\OneDrive\GUESTVALENCIAPWA\index.html

ERRORES:
- CSS inline styles (líneas: 72, 96, 99, 108, 109, 242, 277, 278, 329, 330, 350, 351, 680, 681, 730, 731, 801)
- Compatibilidad video[playsinline] (líneas: 96, 272, 284, 329, 350, 680, 730)
- Accesibilidad botones (líneas: 298, 305, 308)
- Input file sin aria-label (línea: 262)
- Link sin rel="noopener" (línea: 701)
- iframe referrerpolicy (línea: 801)
- CSS backdrop-filter orden (líneas: 45, 46, 55)

Lee el archivo completo y genera el HTML corregido completo.
```

## Agentes Disponibles en VoltAgent

Según `invocar-agente.js`:
- `claude-code` - Claude Code Assistant (Claude 3.5 Sonnet) ✅ RECOMENDADO
- `sandra-coo` - Sandra COO (Groq Llama 3.3 70B)
- `sandra-groq` - Sandra con Super Poderes MCP

## Referencias

- **VoltAgent:** https://voltagent.dev/
- **Consola:** https://console.voltagent.dev
- **Documentación:** https://docs.voltagent.dev
- **Repositorio:** https://github.com/VoltAgent/awesome-claude-code-subagents

