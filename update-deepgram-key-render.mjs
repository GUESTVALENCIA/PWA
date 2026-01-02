import fetch from 'node-fetch';

const RENDER_API_KEY = 'rnd_Uay2uwmu5q75kbh8kmDegPCQw8wR';
const SERVICE_ID = 'srv-d4sqhoeuk2gs73f1ba8g';
const NEW_DEEPGRAM_API_KEY = '150575411ff8eeb52de0a708fad474e765a8371d';

async function updateEnvironmentVariable() {
  try {
    console.log('🔧 Actualizando variable de entorno DEEPGRAM_API_KEY en Render...\n');
    
    // Primero, obtener la configuración actual del servicio
    const getResponse = await fetch(`https://api.render.com/v1/services/${SERVICE_ID}`, {
      headers: {
        'Authorization': `Bearer ${RENDER_API_KEY}`,
        'Accept': 'application/json'
      }
    });
    
    if (!getResponse.ok) {
      const text = await getResponse.text();
      throw new Error(`Error obteniendo servicio: ${getResponse.status} - ${text}`);
    }
    
    const service = await getResponse.json();
    const serviceData = service.service || service;
    
    console.log('✅ Servicio obtenido:', serviceData.name);
    
    // Obtener variables de entorno actuales
    const envVarsResponse = await fetch(`https://api.render.com/v1/services/${SERVICE_ID}/env-vars`, {
      headers: {
        'Authorization': `Bearer ${RENDER_API_KEY}`,
        'Accept': 'application/json'
      }
    });
    
    if (!envVarsResponse.ok) {
      const text = await envVarsResponse.text();
      throw new Error(`Error obteniendo variables de entorno: ${envVarsResponse.status} - ${text}`);
    }
    
    const envVars = await envVarsResponse.json();
    const envVarsList = Array.isArray(envVars) ? envVars : (envVars.envVars || envVars.items || []);
    
    console.log(`📋 Variables de entorno actuales: ${envVarsList.length}`);
    
    // Buscar si DEEPGRAM_API_KEY ya existe
    const existingKey = envVarsList.find(v => v.key === 'DEEPGRAM_API_KEY');
    
    if (existingKey) {
      console.log('⚠️  DEEPGRAM_API_KEY ya existe, actualizando...');
    } else {
      console.log('➕ DEEPGRAM_API_KEY no existe, creando...');
    }
    
    // Actualizar o crear la variable de entorno
    const updateResponse = await fetch(`https://api.render.com/v1/services/${SERVICE_ID}/env-vars`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${RENDER_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        envVars: [
          ...envVarsList.filter(v => v.key !== 'DEEPGRAM_API_KEY'),
          {
            key: 'DEEPGRAM_API_KEY',
            value: NEW_DEEPGRAM_API_KEY
          }
        ]
      })
    });
    
    if (!updateResponse.ok) {
      const text = await updateResponse.text();
      console.error('❌ Error actualizando variable de entorno');
      console.error(`Status: ${updateResponse.status}`);
      console.error(`Respuesta: ${text}`);
      
      // Intentar método alternativo (POST para crear nueva)
      console.log('\n🔄 Intentando método alternativo (POST)...');
      const postResponse = await fetch(`https://api.render.com/v1/services/${SERVICE_ID}/env-vars`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RENDER_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          key: 'DEEPGRAM_API_KEY',
          value: NEW_DEEPGRAM_API_KEY
        })
      });
      
      if (postResponse.ok) {
        console.log('✅ Variable de entorno actualizada usando método POST');
        return true;
      } else {
        const postText = await postResponse.text();
        console.error('❌ Error con método POST también');
        console.error(`Status: ${postResponse.status}`);
        console.error(`Respuesta: ${postText}`);
        return false;
      }
    }
    
    const result = await updateResponse.json();
    console.log('✅ Variable de entorno actualizada correctamente');
    console.log('\n📝 Resumen:');
    console.log(`   Clave: DEEPGRAM_API_KEY`);
    console.log(`   Valor: ${NEW_DEEPGRAM_API_KEY.substring(0, 10)}...${NEW_DEEPGRAM_API_KEY.substring(NEW_DEEPGRAM_API_KEY.length - 4)}`);
    console.log(`   Longitud: ${NEW_DEEPGRAM_API_KEY.length} caracteres`);
    
    console.log('\n⚠️  IMPORTANTE: Render necesita un nuevo deploy para aplicar los cambios.');
    console.log('   Puedes hacerlo desde el dashboard o esperar el auto-deploy.');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    return false;
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  ACTUALIZAR DEEPGRAM_API_KEY EN RENDER                 ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`Service ID: ${SERVICE_ID}`);
  console.log(`Nueva API Key: ${NEW_DEEPGRAM_API_KEY.substring(0, 10)}...${NEW_DEEPGRAM_API_KEY.substring(NEW_DEEPGRAM_API_KEY.length - 4)}`);
  console.log('');
  
  const success = await updateEnvironmentVariable();
  
  if (success) {
    console.log('\n✅ Proceso completado');
    console.log('\n📋 Próximos pasos:');
    console.log('   1. Espera 1-2 minutos para que Render aplique los cambios');
    console.log('   2. O inicia un deploy manual desde el dashboard');
    console.log('   3. Prueba la funcionalidad de voz nuevamente');
  } else {
    console.log('\n❌ No se pudo actualizar la variable de entorno');
    console.log('   Por favor, actualiza DEEPGRAM_API_KEY manualmente en Render Dashboard:');
    console.log('   https://dashboard.render.com/web/srv-d4sqhoeuk2gs73f1ba8g');
    console.log(`   Valor: ${NEW_DEEPGRAM_API_KEY}`);
  }
}

main();
