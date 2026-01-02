/**
 * Script para verificar modelos Deepgram disponibles en tu cuenta
 * 
 * Uso: node scripts/verificar-modelos-deepgram.js
 * 
 * Requiere: DEEPGRAM_API_KEY en .env o como variable de entorno
 */

import dotenv from 'dotenv';
import https from 'https';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

if (!DEEPGRAM_API_KEY) {
  console.error('❌ Error: DEEPGRAM_API_KEY no encontrada');
  console.log('💡 Asegúrate de tener DEEPGRAM_API_KEY en tu .env o variables de entorno');
  process.exit(1);
}

/**
 * Hacer petición HTTPS a Deepgram API
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Authorization': `Token ${DEEPGRAM_API_KEY}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

/**
 * Obtener información del proyecto
 */
async function getProjectInfo() {
  try {
    console.log('🔍 Consultando información de tu proyecto Deepgram...\n');
    
    const response = await makeRequest('https://api.deepgram.com/v1/projects');
    
    if (response.status === 200 && response.data.projects) {
      const projects = response.data.projects;
      
      if (projects.length === 0) {
        console.log('⚠️  No se encontraron proyectos');
        return null;
      }

      console.log(`✅ Encontrados ${projects.length} proyecto(s):\n`);
      
      projects.forEach((project, index) => {
        console.log(`📁 Proyecto ${index + 1}:`);
        console.log(`   ID: ${project.project_id}`);
        console.log(`   Nombre: ${project.name || 'Sin nombre'}`);
        console.log(`   Creado: ${project.created || 'N/A'}\n`);
      });

      return projects[0]; // Usar el primer proyecto
    } else {
      console.error('❌ Error al obtener proyectos:', response.data);
      return null;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

/**
 * Obtener modelos disponibles (STT)
 */
async function getSTTModels(projectId) {
  try {
    console.log('🎤 Consultando modelos STT (Speech-to-Text) disponibles...\n');
    
    const response = await makeRequest(`https://api.deepgram.com/v1/projects/${projectId}/models`);
    
    if (response.status === 200 && response.data.models) {
      const models = response.data.models;
      
      console.log(`✅ Modelos STT disponibles: ${models.length}\n`);
      
      const sttModels = models.filter(m => m.type === 'stt' || !m.type);
      const ttsModels = models.filter(m => m.type === 'tts');
      
      if (sttModels.length > 0) {
        console.log('📝 Modelos STT:');
        sttModels.forEach(model => {
          console.log(`   ✅ ${model.name || model.model_id}`);
        });
        console.log('');
      }

      if (ttsModels.length > 0) {
        console.log('🔊 Modelos TTS:');
        ttsModels.forEach(model => {
          console.log(`   ✅ ${model.name || model.model_id}`);
        });
        console.log('');
      }

      return { stt: sttModels, tts: ttsModels };
    } else {
      console.log('⚠️  No se pudieron obtener modelos específicos del proyecto');
      console.log('💡 Esto puede ser normal - algunos planes muestran todos los modelos públicos\n');
      return { stt: [], tts: [] };
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return { stt: [], tts: [] };
  }
}

/**
 * Listar modelos TTS públicos conocidos
 */
function listKnownTTSModels() {
  console.log('📋 Modelos TTS Aura-2 en Español (públicos conocidos):\n');
  
  const spanishModels = [
    'aura-2-agustina-es',
    'aura-2-carina-es',
    'aura-2-diana-es',
    'aura-2-silvia-es',
    'aura-2-nestor-es',
    'aura-2-celeste-es',
    'aura-2-estrella-es'
  ];

  console.log('🇪🇸 Modelos españoles disponibles:');
  spanishModels.forEach(model => {
    console.log(`   • ${model}`);
  });
  console.log('\n💡 Estos modelos deberían estar disponibles en plan "Pay As You Go" o superior');
  console.log('⚠️  Si recibes error 1008, el modelo puede no estar disponible en tu plan\n');
}

/**
 * Probar modelo específico (test de conexión)
 */
async function testModel(modelName) {
  try {
    console.log(`🧪 Probando modelo: ${modelName}...\n`);
    
    // Intentar crear conexión WebSocket (solo verificar que no da error inmediato)
    const WebSocket = (await import('ws')).default;
    
    return new Promise((resolve) => {
      const ws = new WebSocket('wss://api.deepgram.com/v1/speak', {
        headers: {
          'Authorization': `Token ${DEEPGRAM_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      let configureSent = false;
      let errorReceived = false;

      ws.on('open', () => {
        const configureMessage = {
          type: 'Configure',
          model: modelName,
          encoding: 'linear16',
          sample_rate: 24000
        };

        try {
          ws.send(JSON.stringify(configureMessage));
          configureSent = true;
          console.log(`   ✅ Mensaje Configure enviado`);
          
          // Esperar respuesta
          setTimeout(() => {
            if (!errorReceived) {
              console.log(`   ✅ Modelo ${modelName} parece estar disponible\n`);
              ws.close();
              resolve(true);
            }
          }, 2000);
        } catch (error) {
          console.log(`   ❌ Error enviando Configure: ${error.message}\n`);
          ws.close();
          resolve(false);
        }
      });

      ws.on('message', (data) => {
        try {
          if (Buffer.isBuffer(data) && data[0] === 123) {
            const message = JSON.parse(data.toString('utf8'));
            if (message.type === 'Metadata') {
              console.log(`   ✅ Metadata recibida - Modelo confirmado: ${message.model_name || modelName}\n`);
              ws.close();
              resolve(true);
            } else if (message.type === 'Error') {
              console.log(`   ❌ Error de Deepgram: ${message.message || 'Unknown error'}\n`);
              errorReceived = true;
              ws.close();
              resolve(false);
            }
          }
        } catch (e) {
          // Ignorar
        }
      });

      ws.on('close', (code, reason) => {
        if (code === 1008) {
          console.log(`   ❌ Error 1008 (Policy Violation) - Modelo ${modelName} NO disponible en tu plan\n`);
          errorReceived = true;
          resolve(false);
        } else if (code !== 1000 && !configureSent) {
          console.log(`   ⚠️  Conexión cerrada con código ${code}\n`);
          resolve(false);
        }
      });

      ws.on('error', (error) => {
        console.log(`   ❌ Error de conexión: ${error.message}\n`);
        errorReceived = true;
        resolve(false);
      });

      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN && !configureSent) {
          ws.close();
          resolve(false);
        }
      }, 5000);
    });
  } catch (error) {
    console.error(`❌ Error probando modelo: ${error.message}\n`);
    return false;
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('🚀 Verificador de Modelos Deepgram\n');
  console.log('=' .repeat(50));
  console.log('');

  // 1. Obtener información del proyecto
  const project = await getProjectInfo();
  
  if (project) {
    // 2. Obtener modelos del proyecto
    await getSTTModels(project.project_id);
  }

  // 3. Listar modelos conocidos
  listKnownTTSModels();

  // 4. Probar modelos específicos
  console.log('🧪 Probando modelos TTS específicos...\n');
  
  const modelsToTest = [
    'aura-2-agustina-es',
    'aura-2-carina-es',
    'aura-2-diana-es'
  ];

  const results = {};
  
  for (const model of modelsToTest) {
    results[model] = await testModel(model);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo entre pruebas
  }

  // 5. Resumen
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMEN:\n');
  
  const available = Object.entries(results).filter(([_, available]) => available);
  const unavailable = Object.entries(results).filter(([_, available]) => !available);

  if (available.length > 0) {
    console.log('✅ Modelos DISPONIBLES en tu cuenta:');
    available.forEach(([model]) => {
      console.log(`   • ${model}`);
    });
    console.log('');
  }

  if (unavailable.length > 0) {
    console.log('❌ Modelos NO disponibles en tu cuenta:');
    unavailable.forEach(([model]) => {
      console.log(`   • ${model}`);
    });
    console.log('');
  }

  if (available.length === 0) {
    console.log('⚠️  NINGÚN modelo TTS disponible en tu plan actual');
    console.log('💡 Considera actualizar tu plan o verificar tu API Key\n');
  } else {
    console.log(`✅ Usa uno de los modelos disponibles en tu código:\n`);
    console.log(`   model: '${available[0][0]}'`);
    console.log('');
  }

  console.log('='.repeat(50));
}

// Ejecutar
main().catch(console.error);
