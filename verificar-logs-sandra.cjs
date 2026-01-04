#!/usr/bin/env node

/**
 * Verificar logs de inicialización de IA-SANDRA en Render
 */

const https = require('https');

const RENDER_API_KEY = 'rnd_Uay2uwmu5q75kbh8kmDegPCQw8wR';
const SERVICE_ID = 'srv-d4sqhoeuk2gs73f1ba8g';
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
 * Obtener logs del servicio
 */
async function getServiceLogs() {
  console.log('📋 Obteniendo logs del servicio...\n');
  
  // Intentar diferentes endpoints de logs
  const endpoints = [
    `/v1/services/${SERVICE_ID}/logs`,
    `/v1/services/${SERVICE_ID}/logs?tail=500`,
    `/v1/services/${SERVICE_ID}/logs?tail=1000`
  ];
  
  for (const endpoint of endpoints) {
    const response = await makeRequest(endpoint);
    
    if (response.status === 200) {
      // La respuesta puede venir en diferentes formatos
      if (response.data.logs) {
        return response.data;
      } else if (typeof response.data === 'string') {
        return { logs: response.data };
      } else if (Array.isArray(response.data)) {
        return { logs: response.data.join('\n') };
      } else {
        return response.data;
      }
    }
  }
  
  console.log('⚠️  No se pudieron obtener logs desde la API');
  console.log('   Esto puede ser normal si el servicio acaba de iniciar');
  console.log('   Verifica manualmente en: https://dashboard.render.com/web/' + SERVICE_ID);
  
  return null;
}

/**
 * Analizar logs para verificar IA-SANDRA
 */
function analyzeLogs(logText) {
  console.log('='.repeat(70));
  console.log('🔍 ANÁLISIS DE LOGS - IA-SANDRA');
  console.log('='.repeat(70));
  
  const indicators = {
    'Submodule clonado': /Submodule|IA-SANDRA.*registered|Cloning into.*IA-SANDRA/i,
    'Negotiation Service': /negotiation.*service|NegotiationService|Pipeline de negociación/i,
    'Neon Adapter': /neon.*adapter|NeonDB|Adaptador Neon/i,
    'Context Orchestrator': /context.*orchestrator|Orquestador de contexto/i,
    'Unificación completa': /Unificación completada|initialized successfully/i,
    'Servicios cargados': /servicios cargados|services loaded/i,
    'Error IA-SANDRA': /IA-SANDRA.*no encontrado|Repo.*no encontrado/i
  };
  
  const results = {};
  
  Object.keys(indicators).forEach(key => {
    const regex = indicators[key];
    const matches = logText.match(regex);
    results[key] = {
      found: !!matches,
      count: matches ? matches.length : 0
    };
  });
  
  // Mostrar resultados
  console.log('\n📊 Resultados:\n');
  Object.keys(results).forEach(key => {
    const result = results[key];
    const icon = result.found ? '✅' : '❌';
    console.log(`${icon} ${key}: ${result.found ? `Encontrado (${result.count} veces)` : 'No encontrado'}`);
  });
  
  // Buscar líneas específicas de éxito
  console.log('\n📋 Líneas clave encontradas:\n');
  
  const successPatterns = [
    /\[SANDRA ORCHESTRATOR\].*✅.*Pipeline de negociación/i,
    /\[SANDRA ORCHESTRATOR\].*✅.*Adaptador Neon/i,
    /\[SANDRA ORCHESTRATOR\].*✅.*Orquestador de contexto/i,
    /\[SANDRA ORCHESTRATOR\].*✅.*Unificación completada/i,
    /Submodule.*IA-SANDRA.*registered/i,
    /Cloning into.*IA-SANDRA/i
  ];
  
  const lines = logText.split('\n');
  let foundLines = 0;
  
  successPatterns.forEach(pattern => {
    const matchingLines = lines.filter(line => pattern.test(line));
    if (matchingLines.length > 0) {
      matchingLines.slice(0, 3).forEach(line => {
        if (line.trim() && foundLines < 10) {
          console.log(`   ${line.substring(0, 120)}${line.length > 120 ? '...' : ''}`);
          foundLines++;
        }
      });
    }
  });
  
  // Verificar si hay errores
  const errorPatterns = [
    /\[SANDRA ORCHESTRATOR\].*❌/i,
    /\[SANDRA ORCHESTRATOR\].*Error/i,
    /IA-SANDRA.*no encontrado/i,
    /Repo.*no encontrado/i
  ];
  
  const errors = [];
  errorPatterns.forEach(pattern => {
    const matchingLines = lines.filter(line => pattern.test(line));
    errors.push(...matchingLines);
  });
  
  if (errors.length > 0) {
    console.log('\n⚠️  Errores encontrados:\n');
    errors.slice(0, 5).forEach(line => {
      if (line.trim()) {
        console.log(`   ${line.substring(0, 120)}${line.length > 120 ? '...' : ''}`);
      }
    });
  }
  
  // Resumen final
  console.log('\n' + '='.repeat(70));
  const allSuccess = results['Submodule clonado'].found && 
                     results['Negotiation Service'].found &&
                     results['Unificación completa'].found;
  
  if (allSuccess) {
    console.log('✅ IA-SANDRA CONECTADO CORRECTAMENTE');
  } else {
    console.log('⚠️  IA-SANDRA: Verificación incompleta');
    if (!results['Submodule clonado'].found) {
      console.log('   - Submodule no se clonó (verificar Build Command)');
    }
    if (!results['Negotiation Service'].found) {
      console.log('   - Negotiation Service no se cargó');
    }
  }
  console.log('='.repeat(70));
}

/**
 * Función principal
 */
async function main() {
  console.log('='.repeat(70));
  console.log('🔍 VERIFICACIÓN DE LOGS - IA-SANDRA');
  console.log('='.repeat(70));
  console.log(`\n🔗 Servicio: ${SERVICE_ID}\n`);
  
  const logs = await getServiceLogs();
  
  if (!logs) {
    console.error('❌ No se pudieron obtener los logs');
    process.exit(1);
  }
  
  if (logs.logs) {
    analyzeLogs(logs.logs);
  } else {
    console.log('⚠️  No hay logs disponibles aún');
    console.log('   Espera unos minutos y vuelve a ejecutar el script');
  }
  
  console.log(`\n🔗 Dashboard: https://dashboard.render.com/web/${SERVICE_ID}\n`);
}

main().catch(error => {
  console.error('\n❌ Error:', error);
  process.exit(1);
});
