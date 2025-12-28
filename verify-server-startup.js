#!/usr/bin/env node

/**
 * Script de verificación pre-deployment
 * Verifica que todos los componentes están listos para iniciar
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('\n🔍 VERIFICACIÓN PRE-DEPLOYMENT - MCP ORCHESTRATOR\n');
console.log('=' .repeat(60));

const checks = [
  {
    name: 'server.js existe',
    test: () => fs.existsSync(path.join(__dirname, 'server.js'))
  },
  {
    name: 'package.json existe',
    test: () => fs.existsSync(path.join(__dirname, 'package.json'))
  },
  {
    name: 'package.json apunta a server.js',
    test: () => {
      const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
      return pkg.main === 'server.js';
    }
  },
  {
    name: 'src/core/ existe',
    test: () => fs.existsSync(path.join(__dirname, 'src/core'))
  },
  {
    name: 'src/services/ existe',
    test: () => fs.existsSync(path.join(__dirname, 'src/services'))
  },
  {
    name: 'src/routes/ existe',
    test: () => fs.existsSync(path.join(__dirname, 'src/routes'))
  },
  {
    name: 'src/middleware/ existe',
    test: () => fs.existsSync(path.join(__dirname, 'src/middleware'))
  },
  {
    name: 'src/websocket/ existe',
    test: () => fs.existsSync(path.join(__dirname, 'src/websocket'))
  },
  {
    name: 'voice-system/ existe',
    test: () => fs.existsSync(path.join(__dirname, 'voice-system'))
  },
  {
    name: 'database/schema.sql existe',
    test: () => fs.existsSync(path.join(__dirname, 'database/schema.sql'))
  },
  {
    name: 'config/ existe',
    test: () => fs.existsSync(path.join(__dirname, 'config'))
  },
  {
    name: 'No hay mcp-server/ (eliminado)',
    test: () => !fs.existsSync(path.join(__dirname, 'mcp-server'))
  },
  {
    name: 'No hay mcp-orchestrator/ (eliminado)',
    test: () => !fs.existsSync(path.join(__dirname, 'mcp-orchestrator'))
  },
  {
    name: 'No hay mcp-server-local/ (eliminado)',
    test: () => !fs.existsSync(path.join(__dirname, 'mcp-server-local'))
  },
  {
    name: 'Verificar sintaxis de server.js',
    test: () => {
      try {
        const content = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
        // Basic syntax checks
        return content.includes('import express') &&
               content.includes('function startup()') &&
               content.includes('server.listen(PORT');
      } catch {
        return false;
      }
    }
  },
  {
    name: 'Todas las rutas presentes',
    test: () => {
      const routes = [
        'projects.js', 'propose.js', 'review.js', 'unify.js',
        'implement.js', 'context.js', 'read.js', 'voice-integration.js'
      ];
      const routesDir = path.join(__dirname, 'src/routes');
      return routes.every(route => fs.existsSync(path.join(routesDir, route)));
    }
  },
  {
    name: 'Todos los servicios presentes',
    test: () => {
      const services = [
        'neon-service.js', 'proposal-service.js', 'review-service.js',
        'unification-service.js', 'implementation-service.js', 'context-builder.js'
      ];
      const servicesDir = path.join(__dirname, 'src/services');
      return services.every(service => fs.existsSync(path.join(servicesDir, service)));
    }
  },
  {
    name: 'Middleware stack completo',
    test: () => {
      const middleware = [
        'auth.js', 'project-detector.js', 'access-control.js',
        'rate-limiter.js', 'error-handler.js'
      ];
      const middlewareDir = path.join(__dirname, 'src/middleware');
      return middleware.every(m => fs.existsSync(path.join(middlewareDir, m)));
    }
  },
  {
    name: 'Core components completo',
    test: () => {
      const core = [
        'mcp-server.js', 'state-manager.js', 'project-manager.js', 'event-emitter.js'
      ];
      const coreDir = path.join(__dirname, 'src/core');
      return core.every(c => fs.existsSync(path.join(coreDir, c)));
    }
  },
  {
    name: 'WebSocket server presente',
    test: () => fs.existsSync(path.join(__dirname, 'src/websocket/socket-server.js'))
  }
];

let passed = 0;
let failed = 0;

for (const check of checks) {
  try {
    const result = check.test();
    if (result) {
      console.log(`✅ ${check.name}`);
      passed++;
    } else {
      console.log(`❌ ${check.name}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ ${check.name} - Error: ${error.message}`);
    failed++;
  }
}

console.log('\n' + '='.repeat(60));
console.log(`\n📊 RESULTADO: ${passed}/${passed + failed} verificaciones pasadas\n`);

if (failed === 0) {
  console.log('✅ SERVIDOR LISTO PARA DEPLOYMENT');
  console.log('\n🚀 El servidor universal está listo para iniciar en Render.');
  console.log('📡 Endpoints disponibles:');
  console.log('   - GET /health');
  console.log('   - GET /api/projects');
  console.log('   - POST /api/projects/:id/propose');
  console.log('   - GET /api/voice/status');
  console.log('   - WebSocket: wss://localhost:3000\n');
  process.exit(0);
} else {
  console.log(`❌ ${failed} VERIFICACIÓN(ES) FALLIDA(S)`);
  console.log('\n⚠️  El servidor NO está listo para deployment.\n');
  process.exit(1);
}
