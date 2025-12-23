/* Simple QA runner for Sandra integrations (local or prod). */
'use strict';

const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

const fetchJson = async (path, body) => {
  const res = await fetch(`${baseUrl}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch (_) {}
  return { ok: res.ok, status: res.status, json, text };
};

const run = async () => {
  const checks = [];

  checks.push({ name: 'API /api/config', fn: () => fetchJson('/api/config') });
  checks.push({
    name: 'API /api/sandra/chat',
    fn: () => fetchJson('/api/sandra/chat', { message: 'QA ping', role: 'qa' })
  });

  for (const check of checks) {
    try {
      const result = await check.fn();
      const status = result.ok ? 'OK' : `FAIL (${result.status})`;
      console.log(`[${status}] ${check.name}`);
    } catch (err) {
      console.log(`[FAIL] ${check.name}: ${err.message}`);
    }
  }
};

run().catch((err) => {
  console.error('QA runner failed:', err);
  process.exit(1);
});
