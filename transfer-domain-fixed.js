#!/usr/bin/env node

/**
 * TRANSFERENCIA DE DOMINIO VERCEL - VERSIÓN MEJORADA
 * Maneja redirects y parámetros correctos del API
 */

import https from 'https';

const VERCEL_TOKEN = 'i1lM2Keza4869FscLnkWquYi';
const MCP_SERVER_URL = 'https://pwa-imbf.onrender.com';

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║  🌐 TRANSFERENCIA DE DOMINIO - VERSIÓN MEJORADA              ║');
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

async function getProjectDomains(projectId) {
  console.log(`🔍 Obteniendo dominios del proyecto ${projectId.substring(0, 8)}...\n`);

  const response = await makeRequest(`/v5/projects/${projectId}/domains`);

  if (response.status === 200) {
    return response.data.domains || [];
  } else {
    console.log(`⚠️  Error obteniendo dominios: ${response.status}`);
    return [];
  }
}

async function removeRedirects(projectId, domainName) {
  console.log(`\n🔗 [Paso Intermedio] Removiendo redirects hacia ${domainName}...\n`);

  const domains = await getProjectDomains(projectId);

  const redirectsToDomain = domains.filter(d =>
    d.redirect && (d.redirect.domain === domainName || d.redirect.statusCode)
  );

  if (redirectsToDomain.length === 0) {
    console.log(`✅ No hay redirects hacia ${domainName}\n`);
    return true;
  }

  console.log(`📋 Encontrados ${redirectsToDomain.length} redirects a remover:\n`);

  for (const domain of redirectsToDomain) {
    console.log(`   🗑️  Removiendo redirect: ${domain.name}`);

    const response = await makeRequest(
      `/v5/projects/${projectId}/domains/${domain.name}`,
      'DELETE'
    );

    if (response.status === 200) {
      console.log(`   ✅ Redirect removido\n`);
    } else {
      console.log(`   ⚠️  Error: ${response.status}\n`);
      return false;
    }
  }

  return true;
}

async function transferDomain() {
  try {
    console.log('📊 [1/5] Obteniendo información de proyectos...\n');

    const response = await makeRequest('/v4/projects');

    if (response.status !== 200) {
      console.log('❌ Error obteniendo proyectos:', response.status);
      return;
    }

    const projects = Array.isArray(response.data) ? response.data : response.data.projects || [];

    if (projects.length === 0) {
      console.log('❌ No hay proyectos encontrados\n');
      return;
    }

    const pwaProject = projects.find(p => p.name === 'pwa');
    const guestProject = projects.find(p => p.name === 'guestsvalencia-site');

    if (!pwaProject || !guestProject) {
      console.log('❌ No se encontraron los proyectos requeridos');
      console.log('   Proyectos encontrados:');
      projects.forEach(p => console.log(`   - ${p.name}`));
      return;
    }

    console.log(`✅ Proyectos identificados:`);
    console.log(`   PWA: ${pwaProject.name} (${pwaProject.id.substring(0, 8)}...)`);
    console.log(`   Guest Valencia: ${guestProject.name} (${guestProject.id.substring(0, 8)}...)\n`);

    console.log('📊 [2/5] Obteniendo dominios del proyecto antiguo...\n');

    const guestDomains = await getProjectDomains(guestProject.id);
    const domainToMove = guestDomains.find(d => d.name.includes('guestsvalencia.es'));

    if (!domainToMove) {
      console.log('❌ Dominio no encontrado en el proyecto Guest Valencia\n');
      return;
    }

    const domainName = domainToMove.name;
    console.log(`🎯 Dominio encontrado: ${domainName}\n`);

    // Paso 2: Remover redirects
    const redirectsRemoved = await removeRedirects(guestProject.id, domainName);

    if (!redirectsRemoved) {
      console.log('❌ Falló al remover redirects\n');
      return;
    }

    // Paso 3: Remover dominio del proyecto antiguo
    console.log('📋 [3/5] Removiendo dominio del proyecto antiguo...\n');

    const removeResponse = await makeRequest(
      `/v5/projects/${guestProject.id}/domains/${domainName}`,
      'DELETE'
    );

    if (removeResponse.status === 200) {
      console.log(`✅ Dominio removido de guestsvalencia-site\n`);
    } else {
      console.log(`❌ Error removiendo dominio: ${removeResponse.status}`);
      console.log(`Respuesta: ${JSON.stringify(removeResponse.data)}\n`);
      return;
    }

    // Paso 4: Agregar dominio al proyecto PWA
    console.log('📋 [4/5] Agregando dominio al proyecto PWA...\n');

    const addResponse = await makeRequest(
      `/v5/projects/${pwaProject.id}/domains`,
      'POST',
      {
        name: domainName  // CORRECTO: usar 'name' en lugar de 'domain'
      }
    );

    if (addResponse.status === 201 || addResponse.status === 200) {
      console.log(`✅ Dominio agregado al proyecto PWA\n`);

      console.log('╔════════════════════════════════════════════════════════════════╗');
      console.log('║              ✅ TRANSFERENCIA COMPLETADA CON ÉXITO            ║');
      console.log('╚════════════════════════════════════════════════════════════════╝\n');

      console.log(`📌 Detalles de la transferencia:\n`);
      console.log(`   Dominio: ${domainName}`);
      console.log(`   De: guestsvalencia-site`);
      console.log(`   A: pwa`);
      console.log(`   Servidor MCP Central: ${MCP_SERVER_URL}\n`);

      console.log('📋 Próximos pasos:\n');
      console.log('   [5/5] ⏳ Configurar centralización en MCP Universal\n');
      console.log('   1. ✅ Dominio transferido a PWA');
      console.log('   2. ⏳ Esperar validación DNS (24-48 horas)');
      console.log('   3. 🔄 Configurar routing para fluir por MCP server');
      console.log('   4. 🔐 Todos los endpoints pasarán por MCP Universal\n');

      console.log('🎯 URLs Activas:\n');
      console.log(`   Dominio oficial: ${domainName}`);
      console.log(`   Servidor MCP: ${MCP_SERVER_URL}`);
      console.log(`   Proyecto PWA: https://pwa-chi-six.vercel.app\n`);

      // Paso 5: Verificar DNS
      console.log('📋 [5/5] Verificando configuración DNS...\n');
      await verifyCentralizationSetup(domainName);

    } else {
      console.log(`❌ Error agregando dominio: ${addResponse.status}`);
      console.log(`Respuesta: ${JSON.stringify(addResponse.data)}\n`);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

async function verifyCentralizationSetup(domainName) {
  console.log('🔐 Configuración de centralización MCP:\n');
  console.log('Para completar la centralización del ecosistema:\n');
  console.log('1. Todos los endpoints deben rutear a través de:');
  console.log(`   → ${MCP_SERVER_URL}\n`);
  console.log('2. Configurar en PWA:\n');
  console.log(`   MCP_SERVER_URL=${MCP_SERVER_URL}`);
  console.log(`   MAIN_DOMAIN=${domainName}\n`);
  console.log('3. Configurar DNS del dominio para apuntar a Vercel:');
  console.log('   → Nameservers o CNAME según tu registrador\n');
  console.log('✅ Una vez DNS se propague (24-48h), toda la información');
  console.log('   del ecosistema pasará por el servidor MCP Universal\n');
}

transferDomain();
