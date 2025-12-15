const request = require('supertest');
const app = require('../src/app');
const geminiService = require('../src/services/gemini.service');

// Mock Gemini Service to avoid external calls during controller tests
jest.mock('../src/services/gemini.service');

describe('Chat Controller', () => {
  it('should return 400 if message is missing', async () => {
    const res = await request(app)
      .post('/api/sandra/chat')
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error', 'Missing message in request body');
  });

  it('should return valid response on success', async () => {
    geminiService.generateContent.mockResolvedValue('Mocked response');

    const res = await request(app)
      .post('/api/sandra/chat')
      .send({ message: 'Hello' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('reply', 'Mocked response');
  });
});
