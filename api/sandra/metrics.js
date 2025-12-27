/**
 * Endpoint para recopilar métricas de latencia y telemetría
 * Monitorea la salud del sistema Realtime
 */

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      type,
      sessionId,
      timestamp,
      metrics,
      rawMeasurements
    } = req.body;

    if (!type || !sessionId) {
      return res.status(400).json({ error: 'Missing required fields: type, sessionId' });
    }

    // Log de métricas (en producción: guardar en base de datos/analytics)
    const logEntry = {
      timestamp: new Date(),
      type,
      sessionId,
      metrics,
      measurementCount: rawMeasurements?.length || 0
    };

    console.log('[METRICS]', JSON.stringify(logEntry));

    // Análisis simple de salud
    if (metrics && metrics.p99 > 1000) {
      console.warn(`[METRICS] ⚠️ HIGH LATENCY ALERT: P99=${metrics.p99}ms for session ${sessionId}`);
    }

    if (metrics && metrics.avg > 500) {
      console.warn(`[METRICS] ⚠️ ELEVATED LATENCY: Avg=${metrics.avg}ms for session ${sessionId}`);
    }

    // TODO: En producción, guardar en:
    // - MongoDB: db.collection('realtime_metrics').insertOne(logEntry)
    // - ClickHouse: clickhouse.insert('realtime_metrics', [logEntry])
    // - Datadog: api.post('/api/v2/events', { metric: 'realtime.latency', ... })
    // - Prometheus: push to pushgateway

    return res.status(200).json({
      success: true,
      metricsReceived: true,
      sessionId
    });

  } catch (error) {
    console.error('[METRICS] Error:', error);
    return res.status(500).json({
      error: 'Failed to process metrics',
      details: error.message
    });
  }
}
