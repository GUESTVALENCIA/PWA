#!/usr/bin/env node
/**
 * Script para verificar el error de ToolVerifier en Render
 * Busca específicamente el error de getToolsSchema
 */

const https = require('https');

const RENDER_API_KEY = 'rnd_Uay2uwmu5q75kbh8kmDegPCQw8wR';
const SERVICE_ID = 'srv-d4sqhoeuk2gs73f1ba8g';

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.render.com',
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

async function getServiceLogs() {
  console.log('📋 Obteniendo logs del servicio...\n');
  
  try {
    // Intentar obtener logs recientes (últimas 2000 líneas)
    const response = await makeRequest(`/v1/services/${SERVICE_ID}/logs?tail=2000`);
    
    if (response.status === 200) {
      // La respuesta puede venir en diferentes formatos
      if (response.data.logs) {
        return response.data.logs;
      } else if (typeof response.data === 'string') {
        return response.data;
      } else if (Array.isArray(response.data)) {
        return response.data.join('\n');
      } else if (response.data.cursor) {
        // Si hay cursor, obtener más logs
        const moreLogs = await makeRequest(`/v1/services/${SERVICE_ID}/logs?cursor=${response.data.cursor}&tail=2000`);
        return moreLogs.data.logs || moreLogs.data;
      } else {
        return JSON.stringify(response.data, null, 2);
      }
    } else {
      console.error(`⚠️  Error HTTP ${response.status}`);
      return null;
    }
  } catch (error) {
    console.error('❌ Error obteniendo logs:', error.message);
    return null;
  }
}

function analyzeToolVerifierError(logText) {
  console.log('='.repeat(80));
  console.log('🔍 ANÁLISIS DE ERROR: ToolVerifier - getToolsSchema');
  console.log('='.repeat(80));
  
  const lines = logText.split('\n');
  
  // Buscar el error específico
  const errorPatterns = [
    /getToolsSchema.*not.*function/i,
    /getToolParameters.*not.*function/i,
    /TOOL VERIFIER.*Error/i,
    /Error obteniendo schema/i,
    /ToolHandler.*getTool/i
  ];
  
  const relevantLines = [];
  const errorContext = [];
  
  lines.forEach((line, index) => {
    // Buscar líneas con el error
    if (errorPatterns.some(pattern => pattern.test(line))) {
      relevantLines.push({ line: index + 1, content: line });
      
      // Obtener contexto (5 líneas antes y después)
      const start = Math.max(0, index - 5);
      const end = Math.min(lines.length, index + 6);
      errorContext.push({
        errorLine: index + 1,
        context: lines.slice(start, end)
      });
    }
  });
  
  // Mostrar errores encontrados
  if (relevantLines.length > 0) {
    console.log(`\n❌ Se encontraron ${relevantLines.length} errores relacionados:\n`);
    
    relevantLines.forEach(({ line, content }) => {
      console.log(`Línea ${line}: ${content.substring(0, 120)}${content.length > 120 ? '...' : ''}`);
    });
    
    // Mostrar contexto del primer error
    if (errorContext.length > 0) {
      console.log('\n📋 Contexto del primer error:\n');
      errorContext[0].context.forEach((ctxLine, idx) => {
        const lineNum = errorContext[0].errorLine - 5 + idx;
        const marker = lineNum === errorContext[0].errorLine ? '>>> ' : '    ';
        console.log(`${marker}${lineNum}: ${ctxLine}`);
      });
    }
  } else {
    console.log('\n✅ No se encontraron errores de getToolsSchema/getToolParameters');
  }
  
  // Buscar líneas de éxito del ToolVerifier
  console.log('\n📊 Verificación de ToolVerifier:\n');
  
  const successPatterns = [
    /TOOL VERIFIER.*✅.*Todas las tools verificadas/i,
    /TOOL VERIFIER.*✅.*tools.*handlers.*schemas/i,
    /TOOL VERIFIER.*📊.*Resumen/i
  ];
  
  const successLines = lines.filter(line => 
    successPatterns.some(pattern => pattern.test(line))
  );
  
  if (successLines.length > 0) {
    console.log('✅ Líneas de éxito encontradas:');
    successLines.slice(0, 5).forEach(line => {
      console.log(`   ${line.substring(0, 120)}${line.length > 120 ? '...' : ''}`);
    });
  } else {
    console.log('⚠️  No se encontraron líneas de éxito del ToolVerifier');
  }
  
  // Buscar warnings
  const warningPatterns = [
    /TOOL VERIFIER.*⚠️/i,
    /TOOL VERIFIER.*WARN/i
  ];
  
  const warnings = lines.filter(line => 
    warningPatterns.some(pattern => pattern.test(line))
  );
  
  if (warnings.length > 0) {
    console.log(`\n⚠️  Se encontraron ${warnings.length} warnings:\n`);
    warnings.slice(0, 10).forEach(line => {
      console.log(`   ${line.substring(0, 120)}${line.length > 120 ? '...' : ''}`);
    });
  }
  
  // Verificar si el método getToolParameters está siendo usado
  console.log('\n🔍 Verificación de métodos:\n');
  
  const hasGetToolParameters = /getToolParameters/.test(logText);
  const hasGetToolsSchema = /getToolsSchema/.test(logText);
  
  console.log(`   getToolParameters mencionado: ${hasGetToolParameters ? '✅' : '❌'}`);
  console.log(`   getToolsSchema mencionado: ${hasGetToolsSchema ? '⚠️  (ERROR - método antiguo)' : '✅'}`);
  
  // Resumen final
  console.log('\n' + '='.repeat(80));
  if (relevantLines.length === 0 && !hasGetToolsSchema) {
    console.log('✅ ERROR CORREGIDO: No se encontraron errores de getToolsSchema');
    console.log('   El fix está funcionando correctamente');
  } else if (hasGetToolsSchema) {
    console.log('❌ ERROR PERSISTE: El código antiguo (getToolsSchema) aún está en uso');
    console.log('   El fix no se ha desplegado o hay código en caché');
  } else {
    console.log('⚠️  ERROR PARCIAL: Se encontraron errores pero no relacionados con getToolsSchema');
  }
  console.log('='.repeat(80));
}

async function main() {
  console.log('='.repeat(80));
  console.log('🔍 VERIFICACIÓN DE ERROR: ToolVerifier - getToolsSchema');
  console.log('='.repeat(80));
  console.log(`\n🔗 Servicio ID: ${SERVICE_ID}\n`);
  
  const logs = await getServiceLogs();
  
  if (!logs) {
    console.error('❌ No se pudieron obtener los logs');
    console.log('\n💡 Intenta verificar manualmente en:');
    console.log(`   https://dashboard.render.com/web/${SERVICE_ID}`);
    process.exit(1);
  }
  
  if (typeof logs === 'string' && logs.length > 0) {
    analyzeToolVerifierError(logs);
  } else {
    console.log('⚠️  No hay logs disponibles o están vacíos');
    console.log('   Espera unos minutos y vuelve a ejecutar el script');
  }
  
  console.log(`\n🔗 Dashboard: https://dashboard.render.com/web/${SERVICE_ID}\n`);
}

main().catch(error => {
  console.error('\n❌ Error:', error);
  process.exit(1);
});
