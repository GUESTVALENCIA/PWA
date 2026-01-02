# Plan: Configuración Voice Agent API usando JSON

## Situación Actual

1. **Error STT persiste** después de cambiar a `nova-3`
2. **Usuario proporcionó JSON** de configuración del Voice Agent
3. **Usuario quiere usar API** para configurar todo
4. **ChatGPT 5.2 recomienda Nova 2** para llamadas reales

## JSON Proporcionado vs Nuestra Configuración

### Diferencias Clave:

1. **Sample Rate Input:**
   - JSON: `48000 Hz`
   - Actual: `16000 Hz` (cliente)
   - **Decisión necesaria:** ¿Cambiar a 48000?

2. **Voz TTS:**
   - JSON: `aura-2-alvaro-es` (masculino)
   - Requerido: `aura-2-agustina-es` (femenino - Sandra)
   - **Acción:** Mantener agustina

3. **Modelo STT:**
   - JSON: `nova-3`
   - ChatGPT 5.2: Recomienda `nova-2` para llamadas reales
   - Actual: `nova-3`
   - **Decisión necesaria:** ¿Nova 2 o Nova 3?

4. **LLM:**
   - JSON: `gpt-4o-mini` ✅
   - Actual: `gpt-4o-mini` ✅
   - **Correcto**

## Opciones

### Opción 1: Volver a Voice Agent API (recomendado)
- Usar el JSON proporcionado como base
- Ajustar voz a `aura-2-agustina-es`
- Decidir entre Nova 2 o Nova 3
- Configurar sample rate apropiado

### Opción 2: Mantener sistema legacy pero corregir
- Mantener STT legacy
- Corregir error que persiste
- Ajustar configuración según JSON

## Recomendación

**Usar Voice Agent API** porque:
- El JSON proporcionado es la configuración oficial de Deepgram
- Integra STT + LLM + TTS en un solo pipeline
- Menor latencia
- Mejor calidad

## Próximos Pasos

1. Decidir modelo STT: Nova 2 (recomendado por ChatGPT) vs Nova 3 (en JSON)
2. Decidir sample rate: 16000 (telefonía) vs 48000 (calidad)
3. Configurar Voice Agent API con JSON ajustado
4. Mantener voz femenina (agustina)
