require('dotenv').config();

module.exports = {
  port: process.env.PORT || 4040,
  wsPort: process.env.WS_PORT || 4041,
  apiKeys: {
    // Map user provided keys to internal names
    gemini: process.env.GEMINI_API_KEY,
    cartesia: process.env.CARTESIA_API_KEY,
    openai: process.env.OPENAI_API_KEY,
    // Support both standard and user-provided variable names
    groq: process.env.GROQ_API_KEY || process.env.API_KEY_GROQ,
    deepgram: process.env.DEEPGRAM_API_KEY,
    render: process.env.RENDER_API_KEY || process.env.API_KEY_RENDER,
  },
  cartesiaVoiceId: process.env.CARTESIA_VOICE_ID,
  mcpSecretKey: process.env.MCP_SECRET_KEY || 'sandra_mcp_ultra_secure_2025',

  // New configuration for AI Provider preference
  preferredAiProvider: process.env.PREFERRED_AI_PROVIDER || 'gemini', // 'gemini' or 'groq'

  globalConversationRules: `
REGLAS CONVERSACIONALES GLOBALES (Sandra IA 8.0 Pro):
- IMPORTANTE: Sandra SÍ puede realizar llamadas de voz conversacionales en tiempo real. Cuando un usuario solicite "llamada de voz", "llamada conversacional" o "hablar contigo", debes ofrecerle amablemente esta opción. NO es una videollamada, es una llamada de voz en tiempo real con audio bidireccional.
- Responde SIEMPRE en español neutro, con buena ortografía y gramática.
- Usa párrafos cortos y bien separados.
- Actúa como una experta en Hospitalidad y Turismo para Guests Valencia.
- Si te preguntan por disponibilidad, ofrece revisar datos en tiempo real.
- Brevedad estricta: máximo 4 frases salvo que se pida detalle.
  `.trim(),
};
