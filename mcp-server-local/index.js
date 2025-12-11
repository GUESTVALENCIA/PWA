/**
 * MCP Server Local para VS Code
 * Ejecuta en tu PC local para acceder a archivos locales
 * Compatible con Model Context Protocol
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

class LocalMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'sandra-local-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  setupHandlers() {
    // Listar herramientas disponibles
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'read_file',
          description: 'Lee archivos del sistema de archivos local',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'Ruta completa del archivo a leer',
              },
            },
            required: ['path'],
          },
        },
        {
          name: 'write_file',
          description: 'Escribe contenido en un archivo local',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'Ruta completa del archivo a escribir',
              },
              content: {
                type: 'string',
                description: 'Contenido a escribir en el archivo',
              },
            },
            required: ['path', 'content'],
          },
        },
        {
          name: 'list_directory',
          description: 'Lista el contenido de un directorio local',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'Ruta del directorio a listar',
              },
            },
            required: ['path'],
          },
        },
        {
          name: 'execute_command',
          description: 'Ejecuta un comando del sistema local',
          inputSchema: {
            type: 'object',
            properties: {
              command: {
                type: 'string',
                description: 'Comando a ejecutar',
              },
            },
            required: ['command'],
          },
        },
      ],
    }));

    // Manejar llamadas a herramientas
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'read_file':
            return await this.readFile(args.path);
          
          case 'write_file':
            return await this.writeFile(args.path, args.content);
          
          case 'list_directory':
            return await this.listDirectory(args.path);
          
          case 'execute_command':
            return await this.executeCommand(args.command);
          
          default:
            throw new Error(`Herramienta desconocida: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async readFile(filePath) {
    try {
      // Normalizar ruta y validar seguridad
      const normalizedPath = path.resolve(filePath);
      
      // Validar que no salga del sistema (seguridad básica)
      if (!normalizedPath.startsWith(process.cwd()) && 
          !normalizedPath.startsWith(process.env.USERPROFILE || process.env.HOME)) {
        throw new Error('Ruta no permitida por seguridad');
      }

      const content = fs.readFileSync(normalizedPath, 'utf8');
      
      return {
        content: [
          {
            type: 'text',
            text: content,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Error leyendo archivo: ${error.message}`);
    }
  }

  async writeFile(filePath, content) {
    try {
      const normalizedPath = path.resolve(filePath);
      const dir = path.dirname(normalizedPath);
      
      // Crear directorio si no existe
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(normalizedPath, content, 'utf8');
      
      return {
        content: [
          {
            type: 'text',
            text: `Archivo escrito exitosamente: ${normalizedPath}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Error escribiendo archivo: ${error.message}`);
    }
  }

  async listDirectory(dirPath) {
    try {
      const normalizedPath = path.resolve(dirPath);
      const items = fs.readdirSync(normalizedPath, { withFileTypes: true });
      
      const result = items.map(item => ({
        name: item.name,
        type: item.isDirectory() ? 'directory' : 'file',
        path: path.join(normalizedPath, item.name),
      }));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Error listando directorio: ${error.message}`);
    }
  }

  async executeCommand(command) {
    try {
      const { stdout, stderr } = await execPromise(command, {
        cwd: process.cwd(),
        maxBuffer: 1024 * 1024 * 10, // 10MB
      });

      return {
        content: [
          {
            type: 'text',
            text: stdout || stderr || 'Comando ejecutado',
          },
        ],
      };
    } catch (error) {
      throw new Error(`Error ejecutando comando: ${error.message}`);
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('🚀 Servidor MCP Local iniciado y listo');
  }
}

// Iniciar servidor
const server = new LocalMCPServer();
server.run().catch(console.error);

