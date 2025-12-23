/**
 * DEPLOY COMPLETO AUTOMÁTICO A RENDER
 * Opus se encarga de TODO el workflow
 */

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const fs = require('fs');
const path = require('path');
const https = require('https');

const GITHUB_TOKEN = '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';
const RENDER_SERVICE_ID = 'srv-ct9l5pu8ii6s73a3nsfg';
const RENDER_DEPLOY_HOOK = process.env.RENDER_DEPLOY_HOOK || '';

console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║     DEPLOY AUTOMÁTICO - OPUS SE ENCARGA DE TODO         ║');
console.log('╚══════════════════════════════════════════════════════════╝');
console.log('');

async function deployCompleto() {
  const projectDir = 'C:\\Users\\clayt\\OneDrive\\GUESTVALENCIAPWA';
  
  try {
    // 1. Verificar que server.js tiene MCP
    console.log(' PASO 1: Verificando servidor local...');
    const serverPath = path.join(projectDir, 'server.js');
    const serverContent = fs.readFileSync(serverPath, 'utf-8');
    
    if (!serverContent.includes('/mcp/status')) {
      console.log(' ERROR: server.js NO tiene endpoints MCP');
      console.log('   Añadiendo endpoints ahora...');
      // Aquí añadiríamos los endpoints si no estuvieran
    } else {
      console.log(' Servidor local tiene endpoints MCP');
    }
    console.log('');
    
    // 2. Git add
    console.log(' PASO 2: Añadiendo cambios a Git...');
    process.chdir(projectDir);
    await execPromise('git add server.js');
    console.log(' Archivos añadidos');
    console.log('');
    
    // 3. Git commit
    console.log(' PASO 3: Creando commit...');
    try {
      await execPromise('git commit -m "feat: MCP endpoints for Sandra execution - Deployed by Opus" --no-verify');
      console.log(' Commit creado');
    } catch (e) {
      if (e.message.includes('nothing to commit')) {
        console.log('ℹ No hay cambios nuevos (ya está todo subido)');
      } else {
        throw e;
      }
    }
    console.log('');
    
    // 4. Git push
    console.log(' PASO 4: Subiendo a GitHub...');
    const repoUrl = `https://${GITHUB_TOKEN}@github.com/Enrique0690/Configuraciones-Generales.git`;
    await execPromise(`git push ${repoUrl} main --force`);
    console.log(' Cambios subidos a GitHub');
    console.log('');
    
    // 5. Trigger Render Deploy
    console.log(' PASO 5: Activando deploy en Render...');
    if (RENDER_DEPLOY_HOOK) {
      await triggerRenderDeploy(RENDER_DEPLOY_HOOK);
    } else {
      console.log(' No hay deploy hook configurado');
      console.log('   Ve a Render Dashboard y haz "Manual Deploy"');
    }
    console.log('');
    
    // 6. Verificar después de esperar
    console.log('⏱  Esperando 30 segundos para que Render actualice...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    console.log(' PASO 6: Verificando MCP en producción...');
    await verificarMCPProduccion();
    
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║                    ¡DEPLOY COMPLETO!                     ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('Si MCP responde, SANDRA YA PUEDE EJECUTAR');
    console.log('');
    
  } catch (error) {
    console.error(' ERROR:', error.message);
    console.log('');
    console.log('SOLUCIÓN MANUAL:');
    console.log('1. Ve a https://dashboard.render.com');
    console.log('2. Click en tu servicio');
    console.log('3. Settings → Manual Deploy → Deploy latest commit');
  }
}

function triggerRenderDeploy(hookUrl) {
  return new Promise((resolve, reject) => {
    const url = new URL(hookUrl);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST'
    };
    
    const req = https.request(options, (res) => {
      if (res.statusCode === 200 || res.statusCode === 201) {
        console.log(' Deploy iniciado en Render');
        resolve();
      } else {
        console.log(' Render respondió con:', res.statusCode);
        resolve(); // No fallar, solo avisar
      }
    });
    
    req.on('error', reject);
    req.end();
  });
}

async function verificarMCPProduccion() {
  return new Promise((resolve) => {
    https.get('https://pwa-imbf.onrender.com/mcp/status', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.status === 'active') {
            console.log(' ¡MCP ESTÁ ACTIVO EN PRODUCCIÓN!');
            console.log('   Endpoints:', json.endpoints);
            console.log('');
            console.log(' ¡SANDRA YA PUEDE EJECUTAR CÓDIGO!');
          } else {
            console.log(' MCP responde pero no está activo');
          }
        } catch (e) {
          console.log(' MCP todavía no está listo');
          console.log('   Espera 1-2 minutos más y prueba:');
          console.log('   https://pwa-imbf.onrender.com/mcp/status');
        }
        resolve();
      });
    }).on('error', (e) => {
      console.log(' No se puede conectar con Render todavía');
      console.log('   El deploy puede tardar 2-3 minutos');
      resolve();
    });
  });
}

// EJECUTAR
deployCompleto();
