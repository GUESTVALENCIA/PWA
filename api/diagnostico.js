/**
 * Endpoint de diagnóstico para verificar variables de entorno en runtime
 * Solo para desarrollo/debugging - NO usar en producción final
 */

export default async function handler(req, res) {
  // Solo permitir en desarrollo o con token de seguridad
  if (process.env.VERCEL_ENV === 'production' && req.query.token !== process.env.DIAGNOSTIC_TOKEN) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasGroq = !!process.env.GROQ_API_KEY;
  const hasGemini = !!process.env.GEMINI_API_KEY;
  const preferredProvider = (process.env.PREFERRED_AI_PROVIDER || 'gemini').toLowerCase();

  // No exponer las keys completas, solo indicar si existen
  const info = {
    environment: process.env.VERCEL_ENV || 'unknown',
    nodeEnv: process.env.NODE_ENV || 'unknown',
    vercelUrl: process.env.VERCEL_URL || 'unknown',
    variables: {
      OPENAI_API_KEY: {
        exists: hasOpenAI,
        length: hasOpenAI ? process.env.OPENAI_API_KEY.length : 0,
        startsWith: hasOpenAI ? process.env.OPENAI_API_KEY.substring(0, 7) + '...' : 'N/A'
      },
      GROQ_API_KEY: {
        exists: hasGroq,
        length: hasGroq ? process.env.GROQ_API_KEY.length : 0,
        startsWith: hasGroq ? process.env.GROQ_API_KEY.substring(0, 7) + '...' : 'N/A'
      },
      GEMINI_API_KEY: {
        exists: hasGemini,
        length: hasGemini ? process.env.GEMINI_API_KEY.length : 0,
        startsWith: hasGemini ? process.env.GEMINI_API_KEY.substring(0, 7) + '...' : 'N/A'
      }
    },
    preferredProvider: preferredProvider,
    expectedModel: preferredProvider === 'gemini' ? 'gemini-2.5-flash-lite' : (process.env.VERCEL_ENV === 'production' ? 'gpt-4o' : 'gemini-2.5-flash-lite')
  };

  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.status(200).json(info);
}

