/**
 * Script para verificar estado del deploy en Vercel
 */

const https = require('https');

const VERCEL_TOKEN = '56zab4D9ovbL8Sj63n4WdA3b';
const PROJECT_ID = 'i1lM2Keza4869FscLnkWquYi';

function vercelRequest(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.vercel.com',
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: json });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: data });
        }
      });
    }).on('error', reject);
  });
}

async function checkDeployments() {
  console.log('\n🔍 Verificando deployments en Vercel...\n');
  
  try {
    // Obtener información del proyecto
    const project = await vercelRequest(`/v9/projects/${PROJECT_ID}`);
    if (project.statusCode === 200) {
      console.log('✅ Proyecto encontrado:');
      console.log(`   Nombre: ${project.data.name}`);
      console.log(`   Framework: ${project.data.framework || 'N/A'}`);
      console.log('');
    } else {
      console.log(`❌ Error obteniendo proyecto: ${project.statusCode}`);
      console.log(project.data);
      return;
    }

    // Obtener deployments
    const deployments = await vercelRequest(`/v6/deployments?projectId=${PROJECT_ID}&limit=5`);
    if (deployments.statusCode === 200 && deployments.data.deployments) {
      console.log('📦 Últimos deployments:');
      console.log('');
      
      deployments.data.deployments.forEach((deploy, index) => {
        const date = new Date(deploy.createdAt);
        const state = deploy.readyState === 'READY' ? '✅ READY' : 
                     deploy.readyState === 'ERROR' ? '❌ ERROR' : 
                     deploy.readyState === 'BUILDING' ? '🔄 BUILDING' :
                     `⚠️ ${deploy.readyState}`;
        
        console.log(`${index + 1}. ${state} - ${date.toLocaleString()}`);
        console.log(`   URL: ${deploy.url}`);
        console.log(`   Estado: ${deploy.readyState}`);
        if (deploy.readyState === 'ERROR') {
          console.log(`   ⚠️  ERROR detectado - revisar logs`);
        }
        console.log('');
      });

      // Verificar el último deployment
      const lastDeploy = deployments.data.deployments[0];
      if (lastDeploy) {
        console.log('🔍 Verificando archivo del widget en el último deployment...');
        
        // Intentar verificar si el archivo existe
        const widgetUrl = `https://${lastDeploy.url}/assets/js/sandra-widget.js`;
        console.log(`   URL del widget: ${widgetUrl}`);
        
        // Verificar que el HTML incluya el script
        const htmlUrl = `https://${lastDeploy.url}/`;
        console.log(`   URL de producción: ${htmlUrl}`);
        console.log('\n💡 Para verificar manualmente:');
        console.log(`   1. Abre: ${htmlUrl}`);
        console.log(`   2. Inspecciona la consola del navegador`);
        console.log(`   3. Busca: ✅ SandraWidget cargado correctamente`);
        console.log(`   4. Verifica que el botón del widget aparece en la esquina inferior derecha`);
      }
    } else {
      console.log(`❌ Error obteniendo deployments: ${deployments.statusCode}`);
      console.log(deployments.data);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkDeployments();

