#!/usr/bin/env node

/**
 * Monitorear deploy de Render en tiempo real usando la API
 */

const https = require('https');

const RENDER_API_KEY = 'rnd_Uay2uwmu5q75kbh8kmDegPCQw8wR';
const SERVICE_ID = 'srv-d4sqhoeuk2gs73f1ba8g';
const DEPLOY_ID = process.argv[2] || 'dep-d5cs393e5dus738sd870'; // Último deploy iniciado
const RENDER_API_BASE = 'api.render.com';

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: RENDER_API_BASE,
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${RENDER_API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Obtener estado del deploy
 */
async function getDeployStatus(deployId) {
  const response = await makeRequest(`/v1/services/${SERVICE_ID}/deploys/${deployId}`);
  
  if (response.status === 200) {
    return response.data.deploy || response.data;
  }
  
  return null;
}

/**
 * Obtener logs del deploy
 */
async function getDeployLogs(deployId) {
  const response = await makeRequest(`/v1/services/${SERVICE_ID}/deploys/${deployId}/logs`);
  
  if (response.status === 200) {
    return response.data;
  }
  
  return null;
}

/**
 * Obtener logs del servicio (runtime)
 */
async function getServiceLogs() {
  const response = await makeRequest(`/v1/services/${SERVICE_ID}/logs`);
  
  if (response.status === 200) {
    return response.data;
  }
  
  return null;
}

/**
 * Monitorear deploy en tiempo real
 */
async function monitorDeploy() {
  console.log('='.repeat(70));
  console.log('📊 MONITOREANDO DEPLOY DE RENDER');
  console.log('='.repeat(70));
  console.log(`\n🔗 Servicio: ${SERVICE_ID}`);
  console.log(`📦 Deploy: ${DEPLOY_ID}`);
  console.log(`\n⏳ Monitoreando... (Ctrl+C para salir)\n`);

  let lastLogPosition = 0;
  let deployCompleted = false;

  const checkInterval = setInterval(async () => {
    try {
      // 1. Verificar estado del deploy
      const deployStatus = await getDeployStatus(DEPLOY_ID);
      
      if (deployStatus) {
        const status = deployStatus.status;
        const createdAt = new Date(deployStatus.createdAt).toLocaleTimeString('es-ES');
        
        // Mostrar estado actual
        process.stdout.write(`\r📊 Estado: ${status.toUpperCase()} | Creado: ${createdAt} | `);
        
        // Verificar si el deploy terminó
        if (status === 'live' || status === 'deactivated' || status === 'build_failed') {
          deployCompleted = true;
          clearInterval(checkInterval);
          
          console.log('\n\n' + '='.repeat(70));
          
          if (status === 'live') {
            console.log('✅ DEPLOY COMPLETADO EXITOSAMENTE');
            console.log('='.repeat(70));
            
            // Obtener logs finales
            console.log('\n📋 Verificando logs de inicialización...\n');
            await checkInitializationLogs();
            
          } else if (status === 'build_failed') {
            console.log('❌ DEPLOY FALLIDO');
            console.log('='.repeat(70));
            console.log('\n📋 Obteniendo logs del error...\n');
            await showErrorLogs();
          } else {
            console.log(`⚠️  DEPLOY ${status.toUpperCase()}`);
            console.log('='.repeat(70));
          }
          
          console.log(`\n🔗 Dashboard: https://dashboard.render.com/web/${SERVICE_ID}`);
          process.exit(0);
        }
      }

      // 2. Obtener logs del build (solo si está en progreso)
      if (!deployCompleted) {
        const logs = await getDeployLogs(DEPLOY_ID);
        if (logs && logs.logs) {
          const logText = logs.logs;
          
          // Mostrar solo logs nuevos
          if (logText.length > lastLogPosition) {
            const newLogs = logText.substring(lastLogPosition);
            process.stdout.write('\n' + newLogs);
            lastLogPosition = logText.length;
          }
        }
      }
      
    } catch (error) {
      console.error('\n❌ Error monitoreando:', error.message);
    }
  }, 3000); // Verificar cada 3 segundos

  // Manejar Ctrl+C
  process.on('SIGINT', () => {
    clearInterval(checkInterval);
    console.log('\n\n⏸️  Monitoreo detenido por el usuario');
    process.exit(0);
  });
}

/**
 * Verificar logs de inicialización de IA-SANDRA
 */
async function checkInitializationLogs() {
  const logs = await getServiceLogs();
  
  if (logs && logs.logs) {
    const logText = logs.logs;
    
    // Buscar indicadores clave
    const indicators = [
      'SANDRA ORCHESTRATOR',
      'Pipeline de negociación cargado',
      'Adaptador Neon de IA-SANDRA cargado',
      'Orquestador de contexto cargado',
      'Unificación completada exitosamente',
      'Submodule',
      'IA-SANDRA',
      'negotiation-service',
      'neon-db-adapter'
    ];
    
    const foundIndicators = [];
    indicators.forEach(indicator => {
      if (logText.includes(indicator)) {
        foundIndicators.push(indicator);
      }
    });
    
    if (foundIndicators.length > 0) {
      console.log('✅ Indicadores encontrados en logs:');
      foundIndicators.forEach(ind => console.log(`   - ${ind}`));
    }
    
    // Mostrar últimas líneas relevantes
    const lines = logText.split('\n');
    const relevantLines = lines.filter(line => 
      indicators.some(ind => line.includes(ind))
    ).slice(-10);
    
    if (relevantLines.length > 0) {
      console.log('\n📋 Últimas líneas relevantes:');
      relevantLines.forEach(line => {
        if (line.trim()) {
          console.log(`   ${line.substring(0, 100)}${line.length > 100 ? '...' : ''}`);
        }
      });
    }
  }
}

/**
 * Mostrar logs de error
 */
async function showErrorLogs() {
  const logs = await getDeployLogs(DEPLOY_ID);
  
  if (logs && logs.logs) {
    const logText = logs.logs;
    const lines = logText.split('\n');
    
    // Buscar líneas de error
    const errorLines = lines.filter(line => 
      line.toLowerCase().includes('error') || 
      line.toLowerCase().includes('failed') ||
      line.toLowerCase().includes('❌')
    );
    
    if (errorLines.length > 0) {
      console.log('❌ Errores encontrados:');
      errorLines.slice(-20).forEach(line => {
        if (line.trim()) {
          console.log(`   ${line}`);
        }
      });
    } else {
      console.log('📋 Últimas 30 líneas de logs:');
      lines.slice(-30).forEach(line => {
        if (line.trim()) {
          console.log(`   ${line}`);
        }
      });
    }
  }
}

/**
 * Función principal
 */
async function main() {
  await monitorDeploy();
}

main().catch(error => {
  console.error('\n❌ Error:', error);
  process.exit(1);
});
