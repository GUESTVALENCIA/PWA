const { GoogleGenerativeAI } = require('@google/generative-ai');
const Anthropic = require('@anthropic-ai/sdk');

class LLMStreamingService {
    constructor(config = {}) {
        this.provider = config.provider || 'gemini'; // 'gemini' | 'claude'
        this.geminiConfig = config.gemini || {};
        this.claudeConfig = config.claude || {};

        // Initialize clients
        if (process.env.GEMINI_API_KEY) {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            this.geminiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        }

        if (process.env.ANTHROPIC_API_KEY) {
            this.claudeClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        }
    }

    async *streamResponse(prompt, systemInstruction = "Eres Sandra, una asistente de alquileres turísticos de lujo. Responde brevemente.") {
        if (this.provider === 'claude') {
            if (!this.claudeClient) throw new Error('Claude Key missing');

            const stream = await this.claudeClient.messages.create({
                model: "claude-3-5-sonnet-20240620",
                max_tokens: 150,
                temperature: 0.9,
                system: systemInstruction,
                messages: [{ role: "user", content: prompt }],
                stream: true,
            });

            for await (const chunk of stream) {
                if (chunk.type === 'content_block_delta' && chunk.delta.text) {
                    yield chunk.delta.text;
                }
            }
        } else {
            // Default: Gemini 2.0 Flash (Fastest)
            if (!this.geminiModel) throw new Error('Gemini Key missing');

            const result = await this.geminiModel.generateContentStream({
                contents: [{ role: 'user', parts: [{ text: systemInstruction + "\n\nUser: " + prompt }] }], // System prompt hack for Gem 1.5/2.0 generic
                generationConfig: {
                    maxOutputTokens: 150,
                    temperature: 0.9,
                    topP: 0.95,
                }
            });

            for await (const chunk of result.stream) {
                const chunkText = chunk.text();
                if (chunkText) yield chunkText;
            }
        }
    }
}

module.exports = LLMStreamingService;
