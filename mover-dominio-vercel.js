#!/usr/bin/env node
/**
 * Script para mover dominio de un proyecto a otro en Vercel
 * SOLO EJECUTAR SI EL USUARIO LO APRUEBA EXPLÍCITAMENTE
 */

const https = require('https');

const VERCEL_API_TOKEN = 'i1lM2Keza4869FscLnkWquYi';
const VERCEL_API_URL = 'api.vercel.com';
const DOMINIO_OFICIAL = 'guestsvalencia.es';

// Proyecto ACTUAL (donde está el dominio)
const PROYECTO_ORIGEN = 'prj_HNCaiegvbQcqBHrV8kZwttlKrDPe'; // guestsvalencia-site

// Proyecto DESTINO (donde queremos el dominio)
const PROYECTO_DESTINO = 'prj_xXv3QbfvVdW18VTNijbaxOlv2wI2'; // pwa

console.log('⚠️  MOVER DOMINIO ENTRE PROYECTOS EN VERCEL');
console.log('='.repeat(60));
console.log(`Dominio: ${DOMINIO_OFICIAL}`);
console.log(`Desde: guestsvalencia-site (${PROYECTO_ORIGEN})`);
console.log(`Hacia: pwa (${PROYECTO_DESTINO})`);
console.log('='.repeat(60));
console.log('\n⚠️  ADVERTENCIA: Este script moverá el dominio.');
console.log('⚠️  Asegúrate de que esto es lo que quieres hacer.\n');

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
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const result = { status: res.statusCode, data: JSON.parse(body) };
          resolve(result);
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Vercel API timeout'));
    });
    
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function moverDominio() {
  console.log('📋 PASOS NECESARIOS (NO AUTOMATIZADO POR SEGURIDAD):\n');
  console.log('1. Eliminar dominio del proyecto origen:');
  console.log(`   DELETE /v9/projects/${PROYECTO_ORIGEN}/domains/${DOMINIO_OFICIAL}`);
  console.log(`   DELETE /v9/projects/${PROYECTO_ORIGEN}/domains/www.${DOMINIO_OFICIAL}\n`);
  
  console.log('2. Agregar dominio al proyecto destino:');
  console.log(`   POST /v10/projects/${PROYECTO_DESTINO}/domains`);
  console.log(`   Body: { "name": "${DOMINIO_OFICIAL}" }`);
  console.log(`   POST /v10/projects/${PROYECTO_DESTINO}/domains`);
  console.log(`   Body: { "name": "www.${DOMINIO_OFICIAL}" }\n`);
  
  console.log('⚠️  NOTA: Esto debe hacerse manualmente desde Vercel Dashboard');
  console.log('   porque mover dominios puede causar downtime.\n');
  
  console.log('📝 INSTRUCCIONES MANUALES:');
  console.log('1. Ve a https://vercel.com/dashboard');
  console.log('2. Abre el proyecto "guestsvalencia-site"');
  console.log('3. Settings → Domains');
  console.log('4. Elimina guestsvalencia.es y www.guestsvalencia.es');
  console.log('5. Abre el proyecto "pwa"');
  console.log('6. Settings → Domains');
  console.log('7. Agrega guestsvalencia.es y www.guestsvalencia.es');
  console.log('8. Verifica la configuración DNS\n');
}

moverDominio();

