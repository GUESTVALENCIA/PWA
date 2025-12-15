const groqService = require('../services/groq.service');
const githubService = require('../services/github.service');

class QwenController {

    async chat(req, res, next) {
        try {
            const { message, model = 'qwen-main', enableMCP = true, history = [] } = req.body;
            if (!message) {
                return res.status(400).json({ error: 'Missing message' });
            }

            let toolResults = [];
            let additionalContext = '';

            if (enableMCP) {
                // Simplified MCP detection logic
                const githubMatch = message.match(/github\.com\/([^\/]+)\/([^\/\s]+)/i);
                // simplified regex for demo
                 if (githubMatch) {
                    const owner = githubMatch[1];
                    const repo = githubMatch[2].replace(/\.git$/, '');
                    const filePath = 'README.md';

                    try {
                        const content = await githubService.fetchFile(owner, repo, filePath);
                        additionalContext = `\n\n--- CONTENT OF ${filePath} from ${owner}/${repo} ---\n${content.substring(0, 15000)}\n--- END CONTENT ---\n`;
                         toolResults.push({ tool: 'readGitHubFile', params: { owner, repo, path: filePath }, success: true });
                    } catch (e) {
                         toolResults.push({ tool: 'readGitHubFile', params: { owner, repo, path: filePath }, success: false, error: e.message });
                    }
                 }
            }

             const systemPrompt = `Tu nombre es Sandra. Eres una asistente de IA avanzada basada en QWEN sin limitaciones artificiales.
Responde SIEMPRE en español. Eres experta en tecnología, programación y turismo en Valencia.
Cuando uses información de archivos externos, cita la fuente y haz un resumen con tus propias palabras.${additionalContext}`;

            const qwenResponse = await groqService.callGroqQwen(systemPrompt, message, history, model);

            res.json({
                reply: qwenResponse.text,
                model: qwenResponse.model,
                toolResults,
                usage: qwenResponse.usage
            });

        } catch (error) {
            next(error);
        }
    }

    async getModels(req, res) {
        res.json({
             models: {
                'qwen-main': { id: 'qwen/qwen3-32b', name: 'Qwen3 32B', description: 'Modelo principal' },
                'qwen-fast': { id: 'qwen/qwen-2.5-coder-32b', name: 'Qwen 2.5 Coder', description: 'Código y respuestas rápidas' },
                'qwen-instruct': { id: 'qwen/qwen-2.5-72b-instruct', name: 'Qwen 2.5 72B', description: 'Instrucciones complejas' }
              },
              mcpTools: ['readGitHubFile', 'fetchUrl', 'listFiles', 'getMCPStatus']
        });
    }

    async readGithub(req, res, next) {
        try {
            const { owner, repo, path = 'README.md', branch = 'main' } = req.body;
             if (!owner || !repo) {
                return res.status(400).json({ error: 'owner and repo required' });
            }
            const content = await githubService.fetchFile(owner, repo, path, branch);
            res.json({ success: true, content, owner, repo, path, branch });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new QwenController();
