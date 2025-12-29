#!/usr/bin/env node

import https from 'https';

const VERCEL_TOKEN = 'i1lM2Keza4869FscLnkWquYi';

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

async function inspectRedirects() {
  console.log('🔍 Inspeccionando configuración de redirects en Vercel...\n');

  // Obtener proyectos
  const projectsResp = await makeRequest('/v4/projects');
  const projects = Array.isArray(projectsResp.data) ? projectsResp.data : projectsResp.data.projects || [];
  
  const guestProject = projects.find(p => p.name === 'guestsvalencia-site');
  
  if (!guestProject) {
    console.log('❌ Proyecto no encontrado');
    return;
  }

  console.log(`📋 Proyecto: ${guestProject.name}\n`);

  // Intentar endpoint v8 que trae más información
  console.log('📊 Intentando endpoint v8/projects para ver configuración completa...\n');
  
  const v8Resp = await makeRequest(`/v8/projects/${guestProject.id}`);
  
  if (v8Resp.status === 200) {
    const projectData = v8Resp.data;
    
    console.log('🔗 Dominios y Redirects encontrados:\n');
    
    if (projectData.alias) {
      console.log('Alias (dominios):');
      projectData.alias.forEach(domain => {
        console.log(`  - ${domain}`);
      });
      console.log();
    }

    if (projectData.targets?.production?.alias) {
      console.log('Production Alias:');
      projectData.targets.production.alias.forEach(domain => {
        console.log(`  - ${domain}`);
      });
      console.log();
    }

    // Ver estructura completa
    console.log('\n📄 Estructura completa del proyecto:\n');
    console.log(JSON.stringify(projectData, null, 2));
  }

  // Intentar v9 también
  console.log('\n\n📊 Intentando endpoint v9/projects para versión más reciente...\n');
  
  const v9Resp = await makeRequest(`/v9/projects/${guestProject.id}`);
  
  if (v9Resp.status === 200) {
    console.log('Información v9:');
    console.log(JSON.stringify(v9Resp.data, null, 2));
  }
}

inspectRedirects().catch(console.error);
