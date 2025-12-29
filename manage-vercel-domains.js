#!/usr/bin/env node

/**
 * GESTOR DE DOMINIOS VERCEL
 * Centraliza GetValencia.es desde Guest Valencia Site al proyecto PWA
 * Integra todo con el servidor MCP Universal en Render
 */

import https from 'https';

// Credenciales de Vercel (desde VARIABLESFULL)
const VERCEL_TOKEN = 'i1lM2Keza4869FscLnkWquYi';
const VERCEL_API_BASE = 'api.vercel.com';

// Configuración
const MCP_SERVER_URL = 'https://pwa-imbf.onrender.com';
const TARGET_DOMAIN = 'guestsvalencia.es'; // Dominio a reasignar

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║         🌐 GESTOR DE DOMINIOS VERCEL - CENTRALIZACIÓN       ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: VERCEL_API_BASE,
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
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
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function listProjects() {
  console.log('📋 [1/4] Listando proyectos en Vercel...\n');

  const response = await makeRequest('/v2/projects');

  if (response.status === 200 && response.data.projects) {
    response.data.projects.forEach((project, index) => {
      console.log(`${index + 1}. ${project.name}`);
      console.log(`   ID: ${project.id}`);
      console.log(`   URL: ${project.link?.production || 'N/A'}\n`);
    });
    return response.data.projects;
  } else {
    console.log('❌ Error listando proyectos:', response.status);
    console.log(JSON.stringify(response.data, null, 2));
    return [];
  }
}

async function getProjectDomains(projectId) {
  console.log(`\n🔍 [2/4] Obteniendo dominios del proyecto ${projectId}...\n`);

  const response = await makeRequest(`/v5/projects/${projectId}/domains`);

  if (response.status === 200 && response.data.domains) {
    response.data.domains.forEach((domain, index) => {
      console.log(`${index + 1}. ${domain.name}`);
      console.log(`   Verificado: ${domain.verified ? 'Sí' : 'No'}`);
      console.log(`   Principal: ${domain.isDefault ? 'Sí' : 'No'}\n`);
    });
    return response.data.domains;
  } else {
    console.log('❌ Error obteniendo dominios:', response.status);
    return [];
  }
}

async function removeDomainFromProject(projectId, domainName) {
  console.log(`\n🗑️  [3/4] Removiendo ${domainName} de proyecto ${projectId}...\n`);

  const response = await makeRequest(
    `/v5/projects/${projectId}/domains/${domainName}`,
    'DELETE'
  );

  if (response.status === 200) {
    console.log(`✅ Dominio removido exitosamente\n`);
    return true;
  } else {
    console.log(`⚠️  Status: ${response.status}`);
    console.log(`Respuesta: ${JSON.stringify(response.data)}\n`);
    return false;
  }
}

async function addDomainToProject(projectId, domainName) {
  console.log(`\n➕ [4/4] Agregando ${domainName} al proyecto PWA...\n`);

  const requestData = {
    domain: domainName,
    redirect: null,
    redirectStatusCode: null
  };

  const response = await makeRequest(
    `/v5/projects/${projectId}/domains`,
    'POST',
    requestData
  );

  if (response.status === 201 || response.status === 200) {
    console.log(`✅ Dominio agregado exitosamente\n`);
    return true;
  } else {
    console.log(`❌ Error: ${response.status}`);
    console.log(`Respuesta: ${JSON.stringify(response.data)}\n`);
    return false;
  }
}

async function main() {
  try {
    // Paso 1: Listar proyectos
    const projects = await listProjects();

    if (projects.length === 0) {
      console.log('❌ No hay proyectos disponibles\n');
      process.exit(1);
    }

    // Encontrar proyecto PWA y Guest Valencia
    const pwaProject = projects.find(p => p.name.toLowerCase().includes('pwa'));
    const guestProject = projects.find(p =>
      p.name.toLowerCase().includes('guest') ||
      p.name.toLowerCase().includes('valencia')
    );

    if (!pwaProject) {
      console.log('❌ Proyecto PWA no encontrado\n');
      process.exit(1);
    }

    console.log(`\n✅ Proyectos identificados:`);
    console.log(`   PWA: ${pwaProject.name} (${pwaProject.id})`);
    if (guestProject) {
      console.log(`   Guest Valencia: ${guestProject.name} (${guestProject.id})`);
    }
    console.log('');

    // Paso 2: Obtener dominios del proyecto Guest Valencia
    if (guestProject) {
      const guestDomains = await getProjectDomains(guestProject.id);

      // Buscar el dominio a mover
      const domainToMove = guestDomains.find(d =>
        d.name.includes('guestsvalencia') || d.name.includes('GetValencia')
      );

      if (domainToMove) {
        const domainName = domainToMove.name;

        console.log(`\n🎯 Dominio a mover: ${domainName}\n`);

        // Paso 3: Remover del proyecto antiguo
        const removed = await removeDomainFromProject(guestProject.id, domainName);

        if (removed) {
          // Paso 4: Agregar al proyecto PWA
          const added = await addDomainToProject(pwaProject.id, domainName);

          if (added) {
            console.log('╔════════════════════════════════════════════════════════════════╗');
            console.log('║                  ✅ DOMINIO REASIGNADO CON ÉXITO             ║');
            console.log('╚════════════════════════════════════════════════════════════════╝\n');
            console.log(`Dominio: ${domainName}`);
            console.log(`De: ${guestProject.name}`);
            console.log(`A: ${pwaProject.name}`);
            console.log(`\nServidor MCP Central: ${MCP_SERVER_URL}\n`);
          }
        }
      } else {
        console.log('❌ No se encontró el dominio a mover en el proyecto Guest Valencia\n');
      }
    }

    // Mostrar siguiente paso
    console.log('📋 Próximos pasos:\n');
    console.log('1. Configurar DNS: Apunta tu registrador a Vercel');
    console.log('2. Esperar validación: DNS puede tomar 24-48 horas');
    console.log('3. Actualizar servidor: Todos los endpoints pasan por MCP');
    console.log('4. Verificar: curl https://pwa-imbf.onrender.com/health\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
