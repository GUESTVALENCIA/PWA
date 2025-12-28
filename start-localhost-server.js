#!/usr/bin/env node
/**
 * Script para iniciar el servidor MCP en localhost
 * Verifica puertos disponibles y procesos activos
 */

const { exec } = require('child_process');
const http = require('http');
const net = require('net');

const PORT = 4042;
const MCP_SERVER_PATH = './mcp-server';

function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.once('close', () => resolve(true));
      server.close();
    });
    server.on('error', () => resolve(false));
  });
}

function checkProcessOnPort(port) {
  return new Promise((resolve) => {
    exec(`netstat -ano | findstr ":${port}"`, (error, stdout) => {
      if (error || !stdout.trim()) {
        resolve(null);
      } else {
        const match = stdout.match(/\s+(\d+)\s*$/);
        resolve(match ? parseInt(match[1]) : null);
      }
    });
  });
}

function killProcess(pid) {
  return new Promise((resolve) => {
    exec(`taskkill /PID ${pid} /F`, (error) => {
      resolve(!error);
    });
  });
}

async function main() {
  console.log('🔍 Verificando configuración para localhost...\n');
  console.log('='.repeat(60));

  // Verificar puerto 4042
  const portAvailable = await checkPort(PORT);
  const processOnPort = await checkProcessOnPort(PORT);

  if (!portAvailable && processOnPort) {
    console.log(`⚠️  Puerto ${PORT} está ocupado por proceso ${processOnPort}`);
    console.log('   ¿Deseas terminar el proceso? (S/N)');
    // Por ahora, solo informamos
    console.log(`   Para terminar manualmente: taskkill /PID ${processOnPort} /F\n`);
  } else if (portAvailable) {
    console.log(`✅ Puerto ${PORT} está disponible\n`);
  }

  // Verificar si existe el directorio mcp-server
  const fs = require('fs');
  if (!fs.existsSync(MCP_SERVER_PATH)) {
    console.error(`❌ No se encuentra el directorio ${MCP_SERVER_PATH}`);
    process.exit(1);
  }

  // Verificar package.json
  if (!fs.existsSync(`${MCP_SERVER_PATH}/package.json`)) {
    console.error(`❌ No se encuentra package.json en ${MCP_SERVER_PATH}`);
    process.exit(1);
  }

  // Verificar node_modules
  if (!fs.existsSync(`${MCP_SERVER_PATH}/node_modules`)) {
    console.log('⚠️  node_modules no encontrado. Ejecutando npm install...\n');
    const { spawn } = require('child_process');
    const install = spawn('npm', ['install'], { 
      cwd: MCP_SERVER_PATH,
      shell: true,
      stdio: 'inherit'
    });
    
    install.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ Dependencias instaladas. Iniciando servidor...\n');
        startServer();
      } else {
        console.error('\n❌ Error instalando dependencias');
        process.exit(1);
      }
    });
  } else {
    startServer();
  }
}

function startServer() {
  console.log('🚀 Iniciando servidor MCP en localhost:4042...\n');
  console.log('='.repeat(60));
  console.log('📡 Servidor WebSocket: ws://localhost:4042');
  console.log('🌐 Servidor HTTP: http://localhost:4042');
  console.log('='.repeat(60) + '\n');

  const { spawn } = require('child_process');
  const server = spawn('npm', ['start'], {
    cwd: MCP_SERVER_PATH,
    shell: true,
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: '4042',
      NODE_ENV: 'development'
    }
  });

  server.on('close', (code) => {
    console.log(`\n⚠️  Servidor terminado con código ${code}`);
  });

  // Manejar Ctrl+C
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Deteniendo servidor...');
    server.kill();
    process.exit(0);
  });
}

main().catch(console.error);

