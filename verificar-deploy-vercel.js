#!/usr/bin/env node
/**
 * Script de Verificación y Seguimiento Completo del Deploy en Vercel
 * Usa la API de Vercel para verificar el estado del despliegue
 * Hace seguimiento hasta que todo esté correcto
 */

const https = require('https');

const VERCEL_API_TOKEN = 'i1lM2Keza4869FscLnkWquYi';
const VERCEL_API_URL = 'api.vercel.com';
const PROJECT_NAME = 'pwa'; // Nombre del proyecto en Vercel
const MAX_RETRIES = 10; // Máximo de intentos de verificación
const RETRY_DELAY = 5000; // 5 segundos entre intentos

function vercelAPI(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: VERCEL_API_URL,
      path: endpoint,
      method: method,
      headers: {
        'Authorization': `Bearer ${VERCEL_API_TOKEN}`,
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

async function getProjectInfo() {
  console.log('🔍 Buscando proyecto en Vercel...\n');
  
  try {
    const response = await vercelAPI('/v9/projects');
    
    if (response.status !== 200) {
      console.error(`❌ Error obteniendo proyectos: ${response.status}`);
      return null;
    }
    
    const projects = response.data.projects || [];
    const project = projects.find(p => p.name === PROJECT_NAME);
    
    if (!project) {
      console.error(`❌ Proyecto "${PROJECT_NAME}" no encontrado`);
      console.log('📋 Proyectos disponibles:');
      projects.forEach(p => console.log(`   - ${p.name} (${p.id})`));
      return null;
    }
    
    console.log(`✅ Proyecto encontrado: ${project.name}`);
    console.log(`   ID: ${project.id}\n`);
    
    return project;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

async function getLatestDeployment(projectId) {
  try {
    // Intentar obtener deployments de producción primero
    let response = await vercelAPI(`/v6/deployments?projectId=${projectId}&limit=5&target=production`);
    
    if (response.status !== 200) {
      // Si falla, intentar sin filtro
      response = await vercelAPI(`/v6/deployments?projectId=${projectId}&limit=5`);
    }
    
    if (response.status !== 200) {
      console.error(`❌ Error obteniendo deployments: ${response.status}`);
      console.error(`   Respuesta: ${JSON.stringify(response.data).substring(0, 200)}`);
      return null;
    }
    
    const deployments = response.data.deployments || [];
    
    if (deployments.length === 0) {
      console.error('❌ No se encontraron deployments');
      return null;
    }
    
    // Priorizar deployments de producción
    const productionDeploy = deployments.find(d => d.target === 'production');
    const latestDeploy = productionDeploy || deployments[0];
    
    return latestDeploy;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

async function getDeploymentStatus(deploymentId) {
  try {
    // Intentar diferentes versiones de la API
    let response = await vercelAPI(`/v13/deployments/${deploymentId}`);
    
    if (response.status === 404) {
      // Intentar con v6
      response = await vercelAPI(`/v6/deployments/${deploymentId}`);
    }
    
    if (response.status !== 200) {
      // Si aún falla, retornar null pero no mostrar error (puede ser que el deployment ya esté listo)
      return null;
    }
    
    return response.data;
  } catch (error) {
    return null;
  }
}

async function getDeploymentLogs(deploymentId) {
  try {
    const response = await vercelAPI(`/v2/deployments/${deploymentId}/events`);
    
    if (response.status !== 200) {
      return [];
    }
    
    return response.data || [];
  } catch (error) {
    return [];
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getStatusIcon(state) {
  const icons = {
    'READY': '✅',
    'BUILDING': '🔨',
    'ERROR': '❌',
    'QUEUED': '⏳',
    'CANCELED': '🚫',
    'INITIALIZING': '🚀'
  };
  return icons[state] || '❓';
}

async function verifyWidgetInProduction(url) {
  console.log(`\n🔍 Verificando widget en producción: ${url}\n`);
  
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let html = '';
      
      res.on('data', (chunk) => html += chunk);
      res.on('end', () => {
        // Verificar que el widget esté presente
        const hasWidget = html.includes('SandraWidget') || 
                         html.includes('sandra-widget-root') ||
                         html.includes('ensureVisibility');
        
        const hasGateway = html.includes('SandraGateway');
        const hasInit = html.includes('initSandraWidget') || 
                       html.includes('new SandraWidget');
        
        const widgetComplete = hasWidget && hasGateway && hasInit;
        
        if (widgetComplete) {
          console.log('✅ Widget encontrado en producción:');
          console.log('   ✅ SandraWidget presente');
          console.log('   ✅ SandraGateway presente');
          console.log('   ✅ Inicialización presente\n');
          resolve(true);
        } else {
          console.log('❌ Widget NO encontrado o incompleto:');
          console.log(`   ${hasWidget ? '✅' : '❌'} SandraWidget: ${hasWidget}`);
          console.log(`   ${hasGateway ? '✅' : '❌'} SandraGateway: ${hasGateway}`);
          console.log(`   ${hasInit ? '✅' : '❌'} Inicialización: ${hasInit}\n`);
          resolve(false);
        }
      });
    }).on('error', (error) => {
      console.error(`❌ Error verificando producción: ${error.message}\n`);
      resolve(false);
    });
  });
}

async function monitorDeployment(projectId, deploymentId) {
  console.log('📊 Monitoreando despliegue...\n');
  
  let retries = 0;
  let lastState = null;
  
  while (retries < MAX_RETRIES) {
    const deployment = await getDeploymentStatus(deploymentId);
    
    if (!deployment) {
      console.log('⚠️  No se pudo obtener estado del deployment');
      retries++;
      await sleep(RETRY_DELAY);
      continue;
    }
    
    const state = deployment.readyState || deployment.state;
    const url = deployment.url ? `https://${deployment.url}` : null;
    
    if (state !== lastState) {
      console.log(`${getStatusIcon(state)} Estado: ${state}`);
      if (url) {
        console.log(`   URL: ${url}`);
      }
      lastState = state;
    }
    
    // Si está listo, verificar el widget
    if (state === 'READY' && url) {
      console.log('\n✅ Deployment completado!\n');
      
      // Esperar un momento para que el contenido se propague
      console.log('⏳ Esperando propagación del contenido (5 segundos)...\n');
      await sleep(5000);
      
      // Verificar widget
      const widgetOk = await verifyWidgetInProduction(url);
      
      if (widgetOk) {
        console.log('='.repeat(60));
        console.log('🎉 DEPLOYMENT COMPLETADO Y VERIFICADO');
        console.log('='.repeat(60));
        console.log(`\n✅ URL de Producción: ${url}`);
        console.log('✅ Widget verificado y funcionando\n');
        return { success: true, url };
      } else {
        console.log('⚠️  Deployment completado pero widget no verificado');
        console.log('   Esto puede ser por caché. Esperando 10 segundos más...\n');
        await sleep(10000);
        
        const widgetOkRetry = await verifyWidgetInProduction(url);
        if (widgetOkRetry) {
          console.log('✅ Widget verificado en segundo intento\n');
          return { success: true, url };
        } else {
          console.log('❌ Widget aún no disponible. Puede necesitar más tiempo.\n');
          return { success: false, url, widgetOk: false };
        }
      }
    }
    
    // Si hay error, mostrar logs
    if (state === 'ERROR') {
      console.log('\n❌ Deployment falló\n');
      const logs = await getDeploymentLogs(deploymentId);
      if (logs.length > 0) {
        console.log('📋 Últimos logs:');
        logs.slice(-5).forEach(log => {
          console.log(`   ${log.type}: ${log.payload?.text || JSON.stringify(log.payload)}`);
        });
      }
      return { success: false, url: null, error: true };
    }
    
    retries++;
    if (retries < MAX_RETRIES) {
      process.stdout.write('.');
      await sleep(RETRY_DELAY);
    }
  }
  
  console.log('\n⏱️  Tiempo máximo de espera alcanzado');
  return { success: false, url: null, timeout: true };
}

async function main() {
  console.log('='.repeat(60));
  console.log('🚀 VERIFICACIÓN Y SEGUIMIENTO DE DEPLOY EN VERCEL');
  console.log('='.repeat(60));
  console.log('');
  
  // 1. Obtener información del proyecto
  const project = await getProjectInfo();
  if (!project) {
    process.exit(1);
  }
  
  // 2. Obtener último deployment
  console.log('📦 Obteniendo último deployment...\n');
  const deployment = await getLatestDeployment(project.id);
  
  if (!deployment) {
    console.error('❌ No se pudo obtener el deployment');
    process.exit(1);
  }
  
  console.log(`📋 Deployment encontrado:`);
  const deploymentId = deployment.uid || deployment.id;
  console.log(`   ID: ${deploymentId}`);
  console.log(`   Estado: ${deployment.state || deployment.readyState || 'READY'}`);
  const deploymentUrl = deployment.url || deployment.alias?.[0] || null;
  console.log(`   URL: ${deploymentUrl ? `https://${deploymentUrl}` : 'N/A'}`);
  console.log(`   Creado: ${deployment.createdAt ? new Date(deployment.createdAt).toLocaleString() : 'N/A'}\n`);
  
  // Si el deployment está READY, verificar directamente
  const state = deployment.state || deployment.readyState || 'READY';
  if (state === 'READY' && deploymentUrl) {
    console.log('✅ Deployment ya está listo, verificando widget...\n');
    const widgetOk = await verifyWidgetInProduction(`https://${deploymentUrl}`);
    
    if (widgetOk) {
      console.log('='.repeat(60));
      console.log('🎉 DEPLOYMENT VERIFICADO');
      console.log('='.repeat(60));
      console.log(`\n✅ URL: https://${deploymentUrl}`);
      console.log('✅ Widget verificado y funcionando\n');
      
      // Guardar URL
      const fs = require('fs');
      fs.writeFileSync('PRODUCTION_URL.txt', `https://${deploymentUrl}\n${new Date().toISOString()}\n`);
      console.log('📄 URL guardada en PRODUCTION_URL.txt\n');
      process.exit(0);
    } else {
      console.log('⚠️  Widget no verificado. Verificando URL de producción...\n');
    }
  }
  
  // 3. Obtener URL de producción real
  console.log('🔍 Obteniendo URL de producción...\n');
  let productionUrl = null;
  
  // Intentar obtener el dominio de producción
  try {
    const domainsResponse = await vercelAPI(`/v9/projects/${project.id}/domains`);
    if (domainsResponse.status === 200 && domainsResponse.data.domains) {
      const productionDomain = domainsResponse.data.domains.find(d => d.verified);
      if (productionDomain) {
        productionUrl = `https://${productionDomain.name}`;
        console.log(`✅ URL de producción encontrada: ${productionUrl}\n`);
      }
    }
  } catch (error) {
    console.log('⚠️  No se pudo obtener dominio de producción, usando URL del deployment\n');
  }
  
  // Si no hay URL de producción, usar la del deployment
  if (!productionUrl && deploymentUrl) {
    productionUrl = `https://${deploymentUrl}`;
  }
  
  // 4. Verificar widget en producción
  if (productionUrl) {
    console.log('🔍 Verificando widget en URL de producción...\n');
    const widgetOk = await verifyWidgetInProduction(productionUrl);
    
    if (widgetOk) {
      console.log('='.repeat(60));
      console.log('🎉 DEPLOYMENT VERIFICADO');
      console.log('='.repeat(60));
      console.log(`\n✅ URL: ${productionUrl}`);
      console.log('✅ Widget verificado y funcionando\n');
      
      // Guardar URL
      const fs = require('fs');
      fs.writeFileSync('PRODUCTION_URL.txt', `${productionUrl}\n${new Date().toISOString()}\n`);
      console.log('📄 URL guardada en PRODUCTION_URL.txt\n');
      process.exit(0);
    } else {
      console.log('❌ Widget NO encontrado en producción\n');
      console.log('📋 Posibles causas:');
      console.log('   1. El código del widget no está en index.html');
      console.log('   2. Vercel está cacheando una versión antigua');
      console.log('   3. El despliegue no incluyó los cambios recientes\n');
      
      // Verificar qué commit está desplegado
      console.log('🔍 Verificando contenido del index.html en producción...\n');
      const fs = require('fs');
      const localIndex = fs.readFileSync('index.html', 'utf8');
      const hasWidgetLocal = localIndex.includes('SandraWidget') && localIndex.includes('ensureVisibility');
      
      if (hasWidgetLocal) {
        console.log('✅ Widget presente en index.html local');
        console.log('⚠️  El problema es que Vercel no ha desplegado la versión actual\n');
        console.log('📋 Solución:');
        console.log('   1. Verifica que el último commit está en GitHub');
        console.log('   2. Espera 2-3 minutos para que Vercel procese el deploy');
        console.log('   3. O fuerza un redeploy desde el dashboard de Vercel\n');
      } else {
        console.log('❌ Widget NO presente en index.html local');
        console.log('⚠️  Necesitas restaurar el widget primero\n');
      }
      
      process.exit(1);
    }
  } else {
    console.log('❌ No se pudo obtener URL de producción');
    process.exit(1);
  }
  
  // 4. Resumen final (código legacy, no se ejecutará)
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN FINAL');
  console.log('='.repeat(60));
  
  const result = { success: false };
  if (result.success) {
    console.log('\n✅ DEPLOYMENT EXITOSO');
    console.log(`🌐 URL: ${result.url}`);
    console.log('✅ Widget verificado y funcionando\n');
    
    // Guardar URL
    const fs = require('fs');
    fs.writeFileSync('PRODUCTION_URL.txt', `${result.url}\n${new Date().toISOString()}\n`);
    console.log('📄 URL guardada en PRODUCTION_URL.txt\n');
    
    process.exit(0);
  } else {
    console.log('\n❌ DEPLOYMENT CON PROBLEMAS');
    if (result.url) {
      console.log(`🌐 URL: ${result.url}`);
      console.log('⚠️  Widget no verificado (puede ser caché)\n');
    } else if (result.error) {
      console.log('❌ Deployment falló\n');
    } else if (result.timeout) {
      console.log('⏱️  Tiempo de espera agotado\n');
    }
    
    console.log('📋 Próximos pasos:');
    console.log('   1. Verifica el dashboard de Vercel');
    console.log('   2. Revisa los logs del deployment');
    console.log('   3. Espera unos minutos y vuelve a verificar\n');
    
    process.exit(1);
  }
}

main().catch(error => {
  console.error('\n❌ Error fatal:', error);
  process.exit(1);
});

