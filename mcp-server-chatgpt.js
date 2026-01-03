#!/usr/bin/env node
/**
 * 🚀 SERVIDOR MCP ESPECTACULAR - ChatGPT Desktop Integration
 * 
 * Servidor MCP completo para conectar la PWA Guests Valencia con ChatGPT Desktop
 * Sigue las especificaciones oficiales de Model Context Protocol (MCP)
 * 
 * Transport: stdio (para ChatGPT Desktop)
 * Protocol: JSON-RPC 2.0
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  InitializeRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import { spawn } from 'child_process';

// Cargar variables de entorno
dotenv.config();
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ===== CONFIGURACIÓN =====
const PROJECT_ROOT = process.cwd();
const PWA_NAME = 'Guests Valencia PWA';

// ===== MENSAJE DE BIENVENIDA PERSONALIZADO =====
const WELCOME_MESSAGE = `
╔════════════════════════════════════════════════════════════════╗
║                                                                  ║
║  🚀 BIENVENIDO AL SERVIDOR MCP GUESTS VALENCIA PWA              ║
║                                                                  ║
║  👋 Hola, soy O3 Pro High, tu compañero de razonamiento        ║
║                                                                  ║
║  📋 COMPROMISO Y UNIÓN:                                          ║
║  Este sistema conversacional de llamadas Real-Time Level        ║
║  WebRTC Realtime OpenAI fue creado en colaboración contigo     ║
║  y conmigo (O3 Pro High) para alcanzar la máxima calidad.       ║
║                                                                  ║
║  🎯 ESTÁNDARES DE CALIDAD:                                       ║
║  • Level Enterprise by Power HGPT                               ║
║  • Level Galaxy - Mantén esta calidad en todo el proyecto       ║
║  • Siempre al siguiente nivel - Nunca retroceder               ║
║                                                                  ║
║  💻 EJECUCIÓN DE CÓDIGO:                                         ║
║  Este servidor MCP está diseñado para EJECUTAR código.          ║
║  Tienes acceso a 14 herramientas poderosas:                     ║
║  • 7 herramientas de lectura y exploración                      ║
║  • 7 herramientas de EJECUCIÓN (comandos, scripts, tests)       ║
║                                                                  ║
║  🤝 TRABAJO EN EQUIPO:                                           ║
║  • Del otro lado siempre estoy yo, O3 Pro High                 ║
║  • En la unión está la fuerza                                   ║
║  • Trabajamos en equipo por recomendación del COE               ║
║  • Cada modelo es necesario y valioso                            ║
║                                                                  ║
║  ⚡ IMPLEMENTACIÓN:                                              ║
║  • Ejecuta código directamente                                  ║
║  • Implementa todas las modificaciones                          ║
║  • Lleva el proyecto siempre al siguiente nivel                 ║
║  • Mantén la calidad Galaxy en todo momento                      ║
║                                                                  ║
║  🎯 RECUERDA:                                                    ║
║  Siempre a más, nunca a menos.                                  ║
║  Calidad Enterprise, nivel Galaxy.                               ║
║  Ejecuta, implementa, mejora.                                   ║
║                                                                  ║
║  ¡Estamos esperándote para trabajar en equipo! 🚀              ║
║                                                                  ║
╚════════════════════════════════════════════════════════════════╝
`;

// ===== INICIALIZAR SERVIDOR MCP =====
const server = new Server(
  {
    name: 'guests-valencia-pwa-mcp',
    version: '2.0.0',
    description: 'Servidor MCP unificado - Level Enterprise by Power HGPT - Level Galaxy - Ejecución de código y trabajo en equipo con O3 Pro High',
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

// ===== MENSAJE DE BIENVENIDA AL INICIALIZAR =====
server.setRequestHandler(InitializeRequestSchema, async (request) => {
  // Enviar mensaje de bienvenida cuando ChatGPT Desktop se conecte
  console.error(WELCOME_MESSAGE);
  
  return {
    protocolVersion: '2024-11-05',
    capabilities: {
      resources: {},
      tools: {},
    },
    serverInfo: {
      name: 'guests-valencia-pwa-mcp',
      version: '2.0.0',
      description: 'Servidor MCP unificado - Level Enterprise by Power HGPT - Level Galaxy - Ejecución de código y trabajo en equipo con O3 Pro High',
    },
  };
});

// ===== RECURSOS MCP =====
// Recursos que ChatGPT puede leer y usar como contexto

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'pwa://project/package.json',
        name: 'Package.json - Dependencias del proyecto',
        description: 'Información sobre dependencias y scripts del proyecto',
        mimeType: 'application/json',
      },
      {
        uri: 'pwa://project/README.md',
        name: 'README - Documentación del proyecto',
        description: 'Documentación principal del proyecto',
        mimeType: 'text/markdown',
      },
      {
        uri: 'pwa://project/server.js',
        name: 'Server.js - Servidor principal',
        description: 'Código del servidor Express principal',
        mimeType: 'text/javascript',
      },
      {
        uri: 'pwa://project/index.html',
        name: 'Index.html - Cliente principal',
        description: 'HTML principal de la PWA con el widget Sandra',
        mimeType: 'text/html',
      },
      {
        uri: 'pwa://config/websocket',
        name: 'WebSocket Server - Sistema de llamadas',
        description: 'Configuración y estado del servidor WebSocket para llamadas conversacionales',
        mimeType: 'application/json',
      },
      {
        uri: 'pwa://config/voice-services',
        name: 'Voice Services - Servicios de voz',
        description: 'Configuración de Deepgram TTS/STT y servicios de voz',
        mimeType: 'application/json',
      },
      {
        uri: 'pwa://config/api-keys',
        name: 'API Keys Status - Estado de API Keys',
        description: 'Estado de las API keys configuradas (sin exponer valores)',
        mimeType: 'application/json',
      },
      {
        uri: 'pwa://project/structure',
        name: 'Estructura del Proyecto',
        description: 'Árbol de directorios y estructura del proyecto',
        mimeType: 'application/json',
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  try {
    // Recursos del proyecto
    if (uri.startsWith('pwa://project/')) {
      const filePath = uri.replace('pwa://project/', '');
      const fullPath = path.join(PROJECT_ROOT, filePath);

      // Verificar que el archivo existe y está dentro del proyecto
      const resolvedPath = path.resolve(fullPath);
      if (!resolvedPath.startsWith(path.resolve(PROJECT_ROOT))) {
        throw new Error('Acceso denegado: archivo fuera del proyecto');
      }

      const content = await fs.readFile(fullPath, 'utf-8');
      const mimeType = getMimeType(filePath);

      return {
        contents: [
          {
            uri,
            mimeType,
            text: content,
          },
        ],
      };
    }

    // Recursos de configuración
    if (uri === 'pwa://config/websocket') {
      const config = {
        port: process.env.PORT || 3000,
        websocketEnabled: true,
        deepgramConfigured: !!process.env.DEEPGRAM_API_KEY,
        openaiConfigured: !!process.env.OPENAI_API_KEY,
        model: 'aura-2-carina-es',
        voiceProvider: 'deepgram',
        aiProvider: 'openai',
        aiModel: 'gpt-4o-mini',
      };

      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(config, null, 2),
          },
        ],
      };
    }

    if (uri === 'pwa://config/voice-services') {
      const config = {
        tts: {
          provider: 'deepgram',
          model: 'aura-2-carina-es',
          format: 'mp3',
          streaming: false, // Solo REST API
        },
        stt: {
          provider: 'deepgram',
          model: 'nova-2',
          language: 'es',
          streaming: true,
        },
        ai: {
          provider: 'openai',
          model: 'gpt-4o-mini',
          timeout: 2500,
          maxTokens: 80,
        },
      };

      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(config, null, 2),
          },
        ],
      };
    }

    if (uri === 'pwa://config/api-keys') {
      const status = {
        deepgram: {
          configured: !!process.env.DEEPGRAM_API_KEY,
          keyLength: process.env.DEEPGRAM_API_KEY?.length || 0,
        },
        openai: {
          configured: !!process.env.OPENAI_API_KEY,
          keyLength: process.env.OPENAI_API_KEY?.length || 0,
          keyPrefix: process.env.OPENAI_API_KEY?.substring(0, 7) || 'not-set',
        },
        groq: {
          configured: !!process.env.GROQ_API_KEY,
          keyLength: process.env.GROQ_API_KEY?.length || 0,
        },
        gemini: {
          configured: !!process.env.GEMINI_API_KEY,
          keyLength: process.env.GEMINI_API_KEY?.length || 0,
        },
      };

      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(status, null, 2),
          },
        ],
      };
    }

    if (uri === 'pwa://project/structure') {
      const structure = await getProjectStructure(PROJECT_ROOT);
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(structure, null, 2),
          },
        ],
      };
    }

    throw new Error(`Recurso no encontrado: ${uri}`);
  } catch (error) {
    return {
      contents: [
        {
          uri,
          mimeType: 'text/plain',
          text: `Error: ${error.message}`,
        },
      ],
    };
  }
});

// ===== HERRAMIENTAS MCP =====
// Herramientas que ChatGPT puede usar para interactuar con la PWA

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'read_file',
        description: 'Lee un archivo del proyecto PWA. Útil para analizar código, configuración o documentación.',
        inputSchema: {
          type: 'object',
          properties: {
            filePath: {
              type: 'string',
              description: 'Ruta del archivo relativa a la raíz del proyecto (ej: "src/websocket/socket-server.js")',
            },
          },
          required: ['filePath'],
        },
      },
      {
        name: 'list_files',
        description: 'Lista archivos en un directorio del proyecto. Útil para explorar la estructura del proyecto.',
        inputSchema: {
          type: 'object',
          properties: {
            directory: {
              type: 'string',
              description: 'Directorio a listar (relativo a la raíz, ej: "src" o "." para raíz)',
              default: '.',
            },
            pattern: {
              type: 'string',
              description: 'Patrón opcional para filtrar archivos (ej: "*.js")',
            },
          },
        },
      },
      {
        name: 'get_project_info',
        description: 'Obtiene información general del proyecto: dependencias, scripts, estructura, etc.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'check_api_status',
        description: 'Verifica el estado de las API keys configuradas (sin exponer valores reales).',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_websocket_config',
        description: 'Obtiene la configuración actual del servidor WebSocket y sistema de llamadas.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'search_code',
        description: 'Busca texto en el código del proyecto. Útil para encontrar funciones, variables o patrones.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Texto a buscar en el código',
            },
            filePattern: {
              type: 'string',
              description: 'Patrón opcional para limitar búsqueda (ej: "*.js", "src/**/*.js")',
              default: '**/*',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'get_file_stats',
        description: 'Obtiene estadísticas de un archivo: líneas, tamaño, última modificación, etc.',
        inputSchema: {
          type: 'object',
          properties: {
            filePath: {
              type: 'string',
              description: 'Ruta del archivo relativa a la raíz del proyecto',
            },
          },
          required: ['filePath'],
        },
      },
      {
        name: 'execute_command',
        description: '⚡ EJECUTA un comando shell en el proyecto. Útil para ejecutar scripts, comandos npm, node, etc. IMPORTANTE: Solo ejecuta comandos seguros dentro del proyecto. Level Enterprise - Ejecución directa.',
        inputSchema: {
          type: 'object',
          properties: {
            command: {
              type: 'string',
              description: 'Comando a ejecutar (ej: "npm test", "node script.js", "npm run build")',
            },
            args: {
              type: 'array',
              items: { type: 'string' },
              description: 'Argumentos adicionales para el comando',
              default: [],
            },
            workingDirectory: {
              type: 'string',
              description: 'Directorio de trabajo (relativo a la raíz del proyecto)',
              default: '.',
            },
            timeout: {
              type: 'number',
              description: 'Timeout en milisegundos (default: 30000 = 30s)',
              default: 30000,
            },
          },
          required: ['command'],
        },
      },
      {
        name: 'execute_node_script',
        description: '💻 EJECUTA un script Node.js directamente. El código se ejecuta en el contexto del proyecto con acceso a todas las dependencias. Level Galaxy - Ejecución inmediata.',
        inputSchema: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'Código JavaScript a ejecutar',
            },
            timeout: {
              type: 'number',
              description: 'Timeout en milisegundos (default: 10000 = 10s)',
              default: 10000,
            },
          },
          required: ['code'],
        },
      },
      {
        name: 'run_npm_script',
        description: 'Ejecuta un script npm definido en package.json (ej: "test", "build", "dev").',
        inputSchema: {
          type: 'object',
          properties: {
            script: {
              type: 'string',
              description: 'Nombre del script npm a ejecutar (ej: "test", "build", "dev")',
            },
            args: {
              type: 'array',
              items: { type: 'string' },
              description: 'Argumentos adicionales para el script',
              default: [],
            },
          },
          required: ['script'],
        },
      },
      {
        name: 'execute_file',
        description: 'Ejecuta un archivo JavaScript/Node.js del proyecto.',
        inputSchema: {
          type: 'object',
          properties: {
            filePath: {
              type: 'string',
              description: 'Ruta del archivo a ejecutar (relativa a la raíz del proyecto)',
            },
            args: {
              type: 'array',
              items: { type: 'string' },
              description: 'Argumentos para pasar al script',
              default: [],
            },
            timeout: {
              type: 'number',
              description: 'Timeout en milisegundos (default: 30000 = 30s)',
              default: 30000,
            },
          },
          required: ['filePath'],
        },
      },
      {
        name: 'run_test',
        description: 'Ejecuta tests del proyecto usando Jest o el test runner configurado.',
        inputSchema: {
          type: 'object',
          properties: {
            pattern: {
              type: 'string',
              description: 'Patrón opcional para filtrar tests (ej: "socket", "*.test.js")',
            },
            watch: {
              type: 'boolean',
              description: 'Ejecutar en modo watch (default: false)',
              default: false,
            },
          },
        },
      },
      {
        name: 'install_dependencies',
        description: 'Instala dependencias del proyecto usando npm install.',
        inputSchema: {
          type: 'object',
          properties: {
            package: {
              type: 'string',
              description: 'Paquete específico a instalar (opcional, si no se especifica instala todas)',
            },
            dev: {
              type: 'boolean',
              description: 'Instalar como dependencia de desarrollo (default: false)',
              default: false,
            },
          },
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'read_file': {
        const { filePath } = args;
        const fullPath = path.join(PROJECT_ROOT, filePath);
        
        // Verificar seguridad
        const resolvedPath = path.resolve(fullPath);
        if (!resolvedPath.startsWith(path.resolve(PROJECT_ROOT))) {
          throw new Error('Acceso denegado: archivo fuera del proyecto');
        }

        const content = await fs.readFile(fullPath, 'utf-8');
        const stats = await fs.stat(fullPath);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                filePath,
                size: stats.size,
                lines: content.split('\n').length,
                lastModified: stats.mtime.toISOString(),
                content,
              }, null, 2),
            },
          ],
        };
      }

      case 'list_files': {
        const { directory = '.', pattern } = args;
        const fullPath = path.join(PROJECT_ROOT, directory);
        
        // Verificar seguridad
        const resolvedPath = path.resolve(fullPath);
        if (!resolvedPath.startsWith(path.resolve(PROJECT_ROOT))) {
          throw new Error('Acceso denegado: directorio fuera del proyecto');
        }

        const entries = await fs.readdir(fullPath, { withFileTypes: true });
        const files = entries
          .filter(entry => {
            if (pattern) {
              const regex = new RegExp(pattern.replace(/\*/g, '.*'));
              if (!regex.test(entry.name)) return false;
            }
            return true;
          })
          .map(entry => ({
            name: entry.name,
            type: entry.isDirectory() ? 'directory' : 'file',
            path: path.join(directory, entry.name),
          }));

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ directory, files, count: files.length }, null, 2),
            },
          ],
        };
      }

      case 'get_project_info': {
        const packageJsonPath = path.join(PROJECT_ROOT, 'package.json');
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
        
        const structure = await getProjectStructure(PROJECT_ROOT);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                name: packageJson.name,
                version: packageJson.version,
                description: packageJson.description,
                dependencies: Object.keys(packageJson.dependencies || {}),
                devDependencies: Object.keys(packageJson.devDependencies || {}),
                scripts: packageJson.scripts,
                structure: structure,
              }, null, 2),
            },
          ],
        };
      }

      case 'check_api_status': {
        const status = {
          deepgram: {
            configured: !!process.env.DEEPGRAM_API_KEY,
            keyLength: process.env.DEEPGRAM_API_KEY?.length || 0,
          },
          openai: {
            configured: !!process.env.OPENAI_API_KEY,
            keyLength: process.env.OPENAI_API_KEY?.length || 0,
            keyPrefix: process.env.OPENAI_API_KEY?.substring(0, 7) || 'not-set',
          },
          groq: {
            configured: !!process.env.GROQ_API_KEY,
            keyLength: process.env.GROQ_API_KEY?.length || 0,
          },
          gemini: {
            configured: !!process.env.GEMINI_API_KEY,
            keyLength: process.env.GEMINI_API_KEY?.length || 0,
          },
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(status, null, 2),
            },
          ],
        };
      }

      case 'get_websocket_config': {
        const config = {
          port: process.env.PORT || 3000,
          websocketEnabled: true,
          deepgramConfigured: !!process.env.DEEPGRAM_API_KEY,
          openaiConfigured: !!process.env.OPENAI_API_KEY,
          model: 'aura-2-carina-es',
          voiceProvider: 'deepgram',
          aiProvider: 'openai',
          aiModel: 'gpt-4o-mini',
          features: {
            streaming: true,
            fullDuplex: true,
            keepalive: true,
            intelligentBuffer: true,
          },
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(config, null, 2),
            },
          ],
        };
      }

      case 'search_code': {
        const { query, filePattern = '**/*' } = args;
        const results = await searchInFiles(PROJECT_ROOT, query, filePattern);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                query,
                filePattern,
                results: results.slice(0, 50), // Limitar a 50 resultados
                total: results.length,
              }, null, 2),
            },
          ],
        };
      }

      case 'get_file_stats': {
        const { filePath } = args;
        const fullPath = path.join(PROJECT_ROOT, filePath);
        
        // Verificar seguridad
        const resolvedPath = path.resolve(fullPath);
        if (!resolvedPath.startsWith(path.resolve(PROJECT_ROOT))) {
          throw new Error('Acceso denegado: archivo fuera del proyecto');
        }

        const stats = await fs.stat(fullPath);
        const content = await fs.readFile(fullPath, 'utf-8');
        const lines = content.split('\n');

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                filePath,
                size: stats.size,
                lines: lines.length,
                emptyLines: lines.filter(l => !l.trim()).length,
                codeLines: lines.filter(l => l.trim() && !l.trim().startsWith('//') && !l.trim().startsWith('/*')).length,
                lastModified: stats.mtime.toISOString(),
                created: stats.birthtime.toISOString(),
              }, null, 2),
            },
          ],
        };
      }

      case 'execute_command': {
        const { command, args = [], workingDirectory = '.', timeout = 30000 } = args;
        
        // Verificar seguridad - solo comandos permitidos
        const allowedCommands = ['npm', 'node', 'npx', 'git', 'echo', 'cat', 'ls', 'dir', 'pwd', 'cd'];
        const commandParts = command.trim().split(/\s+/);
        const baseCommand = commandParts[0].toLowerCase();
        
        if (!allowedCommands.includes(baseCommand)) {
          throw new Error(`Comando no permitido: ${baseCommand}. Comandos permitidos: ${allowedCommands.join(', ')}`);
        }

        // Verificar directorio de trabajo
        const workDir = path.join(PROJECT_ROOT, workingDirectory);
        const resolvedWorkDir = path.resolve(workDir);
        if (!resolvedWorkDir.startsWith(path.resolve(PROJECT_ROOT))) {
          throw new Error('Acceso denegado: directorio fuera del proyecto');
        }

        try {
          const result = await executeWithTimeout(command, args, resolvedWorkDir, timeout);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  command: `${command} ${args.join(' ')}`.trim(),
                  workingDirectory: workingDirectory,
                  exitCode: result.exitCode,
                  stdout: result.stdout,
                  stderr: result.stderr,
                  success: result.exitCode === 0,
                }, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  command: `${command} ${args.join(' ')}`.trim(),
                  error: error.message,
                  success: false,
                }, null, 2),
              },
            ],
            isError: true,
          };
        }
      }

      case 'execute_node_script': {
        const { code, timeout = 10000 } = args;

        try {
          // Crear un script temporal
          const tempScript = path.join(PROJECT_ROOT, '.mcp-temp-script.js');
          await fs.writeFile(tempScript, code, 'utf-8');

          try {
            const result = await executeWithTimeout('node', [tempScript], PROJECT_ROOT, timeout);
            
            // Limpiar script temporal
            await fs.unlink(tempScript).catch(() => {});

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    code: code.substring(0, 200) + (code.length > 200 ? '...' : ''),
                    exitCode: result.exitCode,
                    stdout: result.stdout,
                    stderr: result.stderr,
                    success: result.exitCode === 0,
                  }, null, 2),
                },
              ],
            };
          } catch (error) {
            // Limpiar script temporal en caso de error
            await fs.unlink(tempScript).catch(() => {});
            throw error;
          }
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  error: error.message,
                  success: false,
                }, null, 2),
              },
            ],
            isError: true,
          };
        }
      }

      case 'run_npm_script': {
        const { script, args = [] } = args;

        // Verificar que el script existe en package.json
        const packageJsonPath = path.join(PROJECT_ROOT, 'package.json');
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
        
        if (!packageJson.scripts || !packageJson.scripts[script]) {
          throw new Error(`Script "${script}" no encontrado en package.json. Scripts disponibles: ${Object.keys(packageJson.scripts || {}).join(', ')}`);
        }

        try {
          const npmArgs = ['run', script, ...args];
          const result = await executeWithTimeout('npm', npmArgs, PROJECT_ROOT, 60000);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  script,
                  args,
                  exitCode: result.exitCode,
                  stdout: result.stdout,
                  stderr: result.stderr,
                  success: result.exitCode === 0,
                }, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  script,
                  error: error.message,
                  success: false,
                }, null, 2),
              },
            ],
            isError: true,
          };
        }
      }

      case 'execute_file': {
        const { filePath, args = [], timeout = 30000 } = args;
        const fullPath = path.join(PROJECT_ROOT, filePath);
        
        // Verificar seguridad
        const resolvedPath = path.resolve(fullPath);
        if (!resolvedPath.startsWith(path.resolve(PROJECT_ROOT))) {
          throw new Error('Acceso denegado: archivo fuera del proyecto');
        }

        // Verificar que es un archivo JavaScript
        if (!fullPath.endsWith('.js') && !fullPath.endsWith('.mjs')) {
          throw new Error('Solo se pueden ejecutar archivos JavaScript (.js, .mjs)');
        }

        try {
          const result = await executeWithTimeout('node', [fullPath, ...args], PROJECT_ROOT, timeout);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  filePath,
                  args,
                  exitCode: result.exitCode,
                  stdout: result.stdout,
                  stderr: result.stderr,
                  success: result.exitCode === 0,
                }, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  filePath,
                  error: error.message,
                  success: false,
                }, null, 2),
              },
            ],
            isError: true,
          };
        }
      }

      case 'run_test': {
        const { pattern, watch = false } = args;

        try {
          const testArgs = watch ? ['test:watch'] : ['test'];
          if (pattern) {
            testArgs.push('--', pattern);
          }

          const result = await executeWithTimeout('npm', testArgs, PROJECT_ROOT, watch ? 300000 : 60000);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  pattern: pattern || 'all',
                  watch,
                  exitCode: result.exitCode,
                  stdout: result.stdout,
                  stderr: result.stderr,
                  success: result.exitCode === 0,
                }, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  pattern,
                  error: error.message,
                  success: false,
                }, null, 2),
              },
            ],
            isError: true,
          };
        }
      }

      case 'install_dependencies': {
        const { package: packageName, dev = false } = args;

        try {
          const npmArgs = ['install'];
          if (packageName) {
            npmArgs.push(dev ? '--save-dev' : '--save', packageName);
          }

          const result = await executeWithTimeout('npm', npmArgs, PROJECT_ROOT, 300000);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  package: packageName || 'all',
                  dev,
                  exitCode: result.exitCode,
                  stdout: result.stdout,
                  stderr: result.stderr,
                  success: result.exitCode === 0,
                }, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  package: packageName,
                  error: error.message,
                  success: false,
                }, null, 2),
              },
            ],
            isError: true,
          };
        }
      }

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

// ===== FUNCIONES AUXILIARES =====

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.md': 'text/markdown',
    '.html': 'text/html',
    '.css': 'text/css',
    '.txt': 'text/plain',
    '.ts': 'text/typescript',
    '.jsx': 'text/javascript',
    '.tsx': 'text/typescript',
  };
  return mimeTypes[ext] || 'text/plain';
}

async function getProjectStructure(root, currentPath = '', depth = 0, maxDepth = 3) {
  if (depth > maxDepth) return null;

  const ignoreDirs = ['node_modules', '.git', 'dist', 'coverage', 'logs', 'backups', '.cursor'];
  const ignoreFiles = ['.DS_Store', 'Thumbs.db'];

  try {
    const fullPath = path.join(root, currentPath);
    const entries = await fs.readdir(fullPath, { withFileTypes: true });

    const structure = {
      path: currentPath || '.',
      type: 'directory',
      children: [],
    };

    for (const entry of entries) {
      if (ignoreDirs.includes(entry.name) || ignoreFiles.includes(entry.name)) continue;

      const entryPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        const child = await getProjectStructure(root, entryPath, depth + 1, maxDepth);
        if (child) structure.children.push(child);
      } else {
        structure.children.push({
          path: entryPath,
          type: 'file',
        });
      }
    }

    return structure;
  } catch (error) {
    return null;
  }
}

async function searchInFiles(root, query, pattern) {
  const results = [];
  const regex = new RegExp(query, 'i');

  async function searchDirectory(dir) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          await searchDirectory(fullPath);
        } else {
          // Verificar patrón
          if (pattern !== '**/*') {
            const relativePath = path.relative(root, fullPath);
            const patternRegex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
            if (!patternRegex.test(relativePath)) continue;
          }

          try {
            const content = await fs.readFile(fullPath, 'utf-8');
            const lines = content.split('\n');

            lines.forEach((line, index) => {
              if (regex.test(line)) {
                results.push({
                  file: path.relative(root, fullPath),
                  line: index + 1,
                  content: line.trim(),
                });
              }
            });
          } catch (error) {
            // Ignorar errores de lectura (archivos binarios, etc.)
          }
        }
      }
    } catch (error) {
      // Ignorar errores de acceso
    }
  }

  await searchDirectory(root);
  return results;
}

/**
 * Ejecuta un comando con timeout y captura de salida
 */
function executeWithTimeout(command, args, cwd, timeout) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, {
      cwd,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let timeoutId;

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
      if (timeoutId) clearTimeout(timeoutId);
      resolve({
        exitCode: code,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
      });
    });

    process.on('error', (error) => {
      if (timeoutId) clearTimeout(timeoutId);
      reject(error);
    });

    // Timeout
    timeoutId = setTimeout(() => {
      process.kill('SIGTERM');
      reject(new Error(`Comando timeout después de ${timeout}ms`));
    }, timeout);
  });
}

// ===== INICIALIZAR SERVIDOR =====

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  // Enviar mensaje de bienvenida a stderr (visible en logs)
  console.error(WELCOME_MESSAGE);
  console.error('🚀 Servidor MCP Guests Valencia PWA iniciado (v2.0.0)');
  console.error('📡 Listo para conectar con ChatGPT Desktop');
  console.error('💻 14 herramientas disponibles (7 lectura + 7 ejecución)');
  console.error('🤝 O3 Pro High listo para trabajar en equipo');
  console.error('🎯 Level Enterprise by Power HGPT - Level Galaxy');
}

main().catch((error) => {
  console.error('Error fatal en servidor MCP:', error);
  process.exit(1);
});
