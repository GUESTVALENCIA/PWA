const request = require('supertest');
const app = require('../src/app');

describe('API Integration Tests', () => {
  it('GET /health should return status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body.services).toHaveProperty('chat', true);
  });

  it('GET /api/mcp/status should return status active', async () => {
    const res = await request(app).get('/api/mcp/status');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'active');
  });

  it('POST /api/mcp/execute_command should fail without auth', async () => {
    const res = await request(app)
        .post('/api/mcp/execute_command')
        .send({ command: 'ls' });

    expect(res.statusCode).toBe(401);
  });

  it('POST /api/mcp/execute_command should work with correct auth', async () => {
    // Note: We are mocking the execution in a real integration test usually,
    // but here we trust the command 'echo test' is safe to run.
    const res = await request(app)
        .post('/api/mcp/execute_command')
        .set('mcp-secret', 'test-secret') // Defined in setup.js
        .send({ command: 'echo "integration test"' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.output).toContain('integration test');
  });
});
