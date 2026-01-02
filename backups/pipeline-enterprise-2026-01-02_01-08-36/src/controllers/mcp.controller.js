const mcpService = require('../services/mcp.service');

class McpController {

    async executeCommand(req, res, next) {
        try {
            const { command } = req.body;
            if (!command) return res.status(400).json({ error: 'Command required' });

            const result = await mcpService.executeCommand(command);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async readFile(req, res, next) {
        try {
            const { filePath } = req.body;
            if (!filePath) return res.status(400).json({ error: 'File path required' });

            const result = await mcpService.readFile(filePath);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async writeFile(req, res, next) {
        try {
             const { filePath, content } = req.body;
             if (!filePath || content === undefined) return res.status(400).json({ error: 'File path and content required' });

             const result = await mcpService.writeFile(filePath, content);
             res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async listFiles(req, res, next) {
        try {
            const { dirPath } = req.body;
            const result = await mcpService.listFiles(dirPath);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async copyPath(req, res, next) {
        try {
             const { source, destination } = req.body;
             if (!source || !destination) return res.status(400).json({ error: 'Source and destination required' });

             const result = await mcpService.copyPath(source, destination);
             res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async status(req, res) {
        res.json({
          status: 'active',
          version: '2.0.0',
          endpoints: ['/mcp/execute_command', '/mcp/read_file', '/mcp/write_file', '/mcp/list_files', '/mcp/copy_path', '/mcp/status'],
          capabilities: {
            execute: true,
            fileSystem: true,
            copy: true
          }
        });
    }
}

module.exports = new McpController();
