#!/usr/bin/env node
/**
 * Script de diagnóstico para verificar el estado de los proveedores de AI
 * Ejecuta pruebas directas contra el servidor MCP en Render
 */

import https from 'https';

const SERVER_URL = process.env.MCP_SERVER_URL || 'https://pwa-imbf.onrender.com';

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, SERVER_URL);
    
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'User-Agent': 'MCP-Diagnostic-Script/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data), raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, data: null, raw: data });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.end();
  });
}

async function main() {
  console.log('='.repeat(70));
  console.log(' DIAGNÓSTICO DE PROVEEDORES DE AI - SERVIDOR MCP');
  console.log('='.repeat(70));
  console.log(`\n Servidor: ${SERVER_URL}\n`);

  try {
    // 1. Health check
    console.log('1. Verificando health del servidor...');
    try {
      const health = await makeRequest('/health');
      if (health.status === 200) {
        console.log('   ✅ Servidor respondiendo correctamente');
      } else {
        console.log(`   ⚠️  Servidor responde con status ${health.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Error conectando al servidor: ${error.message}`);
      console.log('\n El servidor no está accesible. Verifica:');
      console.log('   - Que el servidor esté desplegado en Render');
      console.log('   - Que la URL sea correcta');
      console.log('   - Que no haya problemas de red\n');
      process.exit(1);
    }

    // 2. Diagnóstico de proveedores
    console.log('\n2. Verificando configuración de proveedores de AI...');
    try {
      const diagnosis = await makeRequest('/api/voice/diagnose');
      
      if (diagnosis.status === 200 && diagnosis.data) {
        const d = diagnosis.data;
        
        console.log(`\n   Entorno: ${d.environment}`);
        console.log(`   Proveedor preferido: ${d.preferredProvider}`);
        console.log(`\n   Resumen:`);
        console.log(`   - Proveedores configurados: ${d.summary.totalConfigured}`);
        console.log(`   - Proveedores funcionando: ${d.summary.totalWorking}`);
        console.log(`   - Estado: ${d.summary.hasWorkingProvider ? '✅ OK' : '❌ ERROR'}`);
        console.log(`   - Recomendación: ${d.summary.recommendation}`);

        console.log(`\n   Detalles por proveedor:\n`);
        
        // Groq
        console.log(`   GROQ:`);
        console.log(`   - Configurado: ${d.providers.groq.configured ? '✅' : '❌'}`);
        if (d.providers.groq.configured) {
          console.log(`   - Key: ${d.providers.groq.keyPrefix} (${d.providers.groq.keyLength} chars)`);
          if (d.providers.groq.tested) {
            console.log(`   - Estado: ${d.providers.groq.working ? '✅ Funcionando' : '❌ Fallando'}`);
            if (d.providers.groq.error) {
              console.log(`   - Error: ${d.providers.groq.error}`);
            }
          }
        }

        // OpenAI
        console.log(`\n   OPENAI:`);
        console.log(`   - Configurado: ${d.providers.openai.configured ? '✅' : '❌'}`);
        if (d.providers.openai.configured) {
          console.log(`   - Key: ${d.providers.openai.keyPrefix} (${d.providers.openai.keyLength} chars)`);
          if (d.providers.openai.tested) {
            console.log(`   - Estado: ${d.providers.openai.working ? '✅ Funcionando' : '❌ Fallando'}`);
            if (d.providers.openai.error) {
              console.log(`   - Error: ${d.providers.openai.error}`);
            }
          }
        }

        // Gemini
        console.log(`\n   GEMINI:`);
        console.log(`   - Configurado: ${d.providers.gemini.configured ? '✅' : '❌'}`);
        if (d.providers.gemini.configured) {
          console.log(`   - Key: ${d.providers.gemini.keyPrefix} (${d.providers.gemini.keyLength} chars)`);
          if (d.providers.gemini.tested) {
            console.log(`   - Estado: ${d.providers.gemini.working ? '✅ Funcionando' : '❌ Fallando'}`);
            if (d.providers.gemini.error) {
              console.log(`   - Error: ${d.providers.gemini.error}`);
            }
          }
        }

        // Deepgram
        console.log(`\n   DEEPGRAM (STT):`);
        console.log(`   - Configurado: ${d.deepgram.configured ? '✅' : '❌'}`);
        if (d.deepgram.configured) {
          console.log(`   - Key: ${d.deepgram.keyLength} chars`);
        }

        // Acción requerida
        console.log(`\n${'='.repeat(70)}`);
        if (!d.summary.hasWorkingProvider) {
          console.log(' ❌ PROBLEMA DETECTADO: No hay proveedores de AI funcionando');
          console.log('\n ACCIÓN REQUERIDA:');
          console.log(' 1. Ve a Render Dashboard: https://dashboard.render.com');
          console.log(' 2. Busca el servicio "pwa-imbf"');
          console.log(' 3. Ve a "Environment" > "Environment Variables"');
          console.log(' 4. Verifica que estas variables estén configuradas:');
          console.log('    - GROQ_API_KEY');
          console.log('    - OPENAI_API_KEY');
          console.log('    - GEMINI_API_KEY (opcional pero recomendado)');
          console.log(' 5. Si las variables están configuradas pero no funcionan:');
          console.log('    - Verifica que las API keys sean válidas');
          console.log('    - Verifica que no hayan expirado');
          console.log('    - Verifica que tengan créditos/saldo disponible');
          console.log(' 6. Reinicia el servicio después de configurar las variables');
        } else {
          console.log(' ✅ Sistema funcionando correctamente');
          console.log(`    ${d.summary.totalWorking} proveedor(es) de AI disponible(s)`);
        }
        console.log('='.repeat(70));
        
      } else {
        console.log(`   ❌ Error obteniendo diagnóstico: ${diagnosis.status}`);
        console.log(`   Respuesta: ${diagnosis.raw?.substring(0, 200)}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      console.log('\n El endpoint de diagnóstico no está disponible.');
      console.log(' Esto puede indicar que:');
      console.log(' - El código no está actualizado en Render');
      console.log(' - El servidor necesita un redeploy');
    }

  } catch (error) {
    console.error('\n❌ Error fatal:', error.message);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('\n❌ Error:', error);
  process.exit(1);
});
