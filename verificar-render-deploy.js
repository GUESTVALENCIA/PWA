#!/usr/bin/env node
/**
 * Script para verificar el estado del deploy en Render usando la API
 */

const https = require('https');

const RENDER_API_KEY = 'rnd_Uay2uwmu5q75kbh8kmDegPCQw8wR';
const SERVICE_ID = 'srv-d4sqhoeuk2gs73f1ba8g'; // ID del servicio PWA en Render

async function getServiceLogs() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.render.com',
      path: `/v1/services/${SERVICE_ID}/logs`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${RENDER_API_KEY}`,
        'Accept': 'application/json'
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve({ raw: data });
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    }).on('error', reject);
  });
}

async function getServiceDetails() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.render.com',
      path: `/v1/services/${SERVICE_ID}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${RENDER_API_KEY}`,
        'Accept': 'application/json'
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve({ raw: data });
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('🔍 Verificando estado del servicio en Render...\n');
  
  try {
    // Obtener detalles del servicio
    console.log('📋 Obteniendo detalles del servicio...');
    const serviceDetails = await getServiceDetails();
    console.log('✅ Estado del servicio:', serviceDetails.service?.serviceDetails?.name || 'N/A');
    console.log('   Estado:', serviceDetails.service?.serviceDetails?.suspendedInactiveAt ? 'Suspended' : 'Active');
    console.log('   Último deploy:', serviceDetails.service?.serviceDetails?.updatedAt || 'N/A');
    console.log('');
    
    // Obtener logs recientes
    console.log('📜 Obteniendo logs recientes...');
    const logs = await getServiceLogs();
    
    if (logs.cursor) {
      console.log('✅ Logs obtenidos (usando cursor para obtener más)');
    } else if (logs.raw) {
      console.log('📄 Logs (formato raw):');
      console.log(logs.raw.substring(0, 1000));
    } else {
      console.log('📄 Logs:', JSON.stringify(logs, null, 2).substring(0, 500));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('401')) {
      console.error('   La API key puede ser inválida o no tener permisos');
    }
  }
}

main();
