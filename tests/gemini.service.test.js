const geminiService = require('../src/services/gemini.service');
const { handleRequest, AppError } = require('../src/utils/apiClient');

// Mock the API Client
jest.mock('../src/utils/apiClient', () => ({
  handleRequest: jest.fn(),
  AppError: class extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
  }
}));

describe('GeminiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate content successfully', async () => {
    // Setup Mock
    const mockResponse = {
      candidates: [{
        content: {
          parts: [{ text: 'Hello, I am Sandra.' }]
        }
      }]
    };
    handleRequest.mockResolvedValue(mockResponse);

    // Run Test
    const result = await geminiService.generateContent('Hi', 'You are an AI');

    // Verify
    expect(result).toBe('Hello, I am Sandra.');
  });

  it('should throw error on invalid response', async () => {
    // Setup Mock for failure (empty response, simulating invalid payload from API)
    handleRequest.mockResolvedValue({});

    // Run Test & Verify
    await expect(geminiService.generateContent('Hi', 'Sys')).rejects.toThrow('Invalid response from Gemini');
  });
});
