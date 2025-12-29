#!/usr/bin/env node

/**
 * TRANSFERIR DOMINIO guestsvalencia.es AL PROYECTO PWA
 * Y CENTRALIZAR EN EL SERVIDOR MCP UNIVERSAL
 */

import https from 'https';

const VERCEL_TOKEN = 'i1lM2Keza4869FscLnkWquYi';
const MCP_SERVER_URL = 'https://pwa-imbf.onrender.com';

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║  🌐 TRANSFERENCIA DE DOMINIO - CENTRALIZACIÓN EN MCP UNIVERSAL ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.vercel.com',
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

async function transferDomain() {
  try {
    console.log('📊 [1/3] Obteniendo información de proyectos...\n');

    // Obtener proyectos
    const response = await makeRequest('/v4/projects');

    if (response.status !== 200) {
      console.log('❌ Error obteniendo proyectos:', response.status);
      return;
    }

    // El response de Vercel es un array de proyectos
    const projects = Array.isArray(response.data) ? response.data : response.data.projects || [];

    if (projects.length === 0) {
      console.log('❌ No hay proyectos encontrados\n');
      return;
    }

    // Identificar proyectos
    const pwaProject = projects.find(p => p.name === 'pwa');
    const guestProject = projects.find(p => p.name === 'guestsvalencia-site');

    if (!pwaProject || !guestProject) {
      console.log('❌ No se encontraron los proyectos requeridos');
      console.log('   Proyectos encontrados:');
      projects.forEach(p => console.log(`   - ${p.name}`));
      return;
    }

    console.log(`✅ Proyectos identificados:`);
    console.log(`   PWA: ${pwaProject.name} (${pwaProject.id})`);
    console.log(`   Guest Valencia: ${guestProject.name} (${guestProject.id})\n`);

    // Encontrar el dominio
    const guestDomains = guestProject.targets?.production?.alias || [];
    const domainToMove = guestDomains.find(d => d.includes('guestsvalencia.es'));

    if (!domainToMove) {
      console.log('❌ Dominio no encontrado en el proyecto Guest Valencia\n');
      console.log('Alias actuales:', guestDomains);
      return;
    }

    console.log(`🎯 Dominio encontrado: ${domainToMove}\n`);

    console.log('📋 [2/3] Removiendo dominio del proyecto antiguo...\n');

    // Remover dominio del proyecto antiguo
    const removeResponse = await makeRequest(
      `/v4/projects/${guestProject.id}/domains/${domainToMove}`,
      'DELETE'
    );

    if (removeResponse.status === 204 || removeResponse.status === 200) {
      console.log(`✅ Dominio removido de guestsvalencia-site\n`);
    } else {
      console.log(`⚠️  Status: ${removeResponse.status}`);
      console.log(`Respuesta: ${JSON.stringify(removeResponse.data)}\n`);
    }

    console.log('📋 [3/3] Agregando dominio al proyecto PWA...\n');

    // Agregar al proyecto PWA
    const addResponse = await makeRequest(
      `/v4/projects/${pwaProject.id}/domains`,
      'POST',
      {
        domain: domainToMove,
        redirect: null
      }
    );

    if (addResponse.status === 201 || addResponse.status === 200) {
      console.log(`✅ Dominio agregado al proyecto PWA\n`);

      console.log('╔════════════════════════════════════════════════════════════════╗');
      console.log('║              ✅ TRANSFERENCIA COMPLETADA CON ÉXITO            ║');
      console.log('╚════════════════════════════════════════════════════════════════╝\n');

      console.log(`📌 Detalles de la transferencia:\n`);
      console.log(`   Dominio: ${domainToMove}`);
      console.log(`   De: guestsvalencia-site`);
      console.log(`   A: pwa`);
      console.log(`   Servidor MCP Central: ${MCP_SERVER_URL}\n`);

      console.log('📋 Próximos pasos:\n');
      console.log('   1. ✅ Dominio transferido a PWA');
      console.log('   2. ⏳ Esperar validación DNS (24-48 horas)');
      console.log('   3. 🔄 Todos los endpoints pasarán por el servidor MCP');
      console.log('   4. 🔐 Centralización completa del sistema\n');

      console.log('🎯 URLs Activas:\n');
      console.log(`   Dominio oficial: ${domainToMove}`);
      console.log(`   Servidor MCP: ${MCP_SERVER_URL}`);
      console.log(`   Proyecto PWA: https://pwa-chi-six.vercel.app\n`);

    } else {
      console.log(`❌ Error agregando dominio: ${addResponse.status}`);
      console.log(`Respuesta: ${JSON.stringify(addResponse.data)}\n`);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

transferDomain();
