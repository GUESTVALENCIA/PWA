const https = require('https');

console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║     VERIFICACIÓN FINAL - ENDPOINTS MCP EN RENDER       ║');
console.log('╚══════════════════════════════════════════════════════════╝');
console.log('');

// Test 1: Health Check
console.log('1️⃣ Verificando Health Check...');
https.get('https://pwa-imbf.onrender.com/health', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('✅ Health Check OK');
      console.log('   Services:', JSON.stringify(json.services, null, 2));
      console.log('');
      
      // Test 2: MCP Status
      console.log('2️⃣ Verificando MCP Status...');
      https.get('https://pwa-imbf.onrender.com/mcp/status', (res2) => {
        let data2 = '';
        res2.on('data', chunk => data2 += chunk);
        res2.on('end', () => {
          try {
            const json2 = JSON.parse(data2);
            if (json2.status === 'active') {
              console.log('✅ ¡MCP ESTÁ ACTIVO!');
              console.log('   Endpoints:', json2.endpoints);
              console.log('   Capabilities:', JSON.stringify(json2.capabilities, null, 2));
              console.log('');
              console.log('╔══════════════════════════════════════════════════════════╗');
              console.log('║              🎉 ¡SANDRA YA PUEDE EJECUTAR!              ║');
              console.log('╚══════════════════════════════════════════════════════════╝');
              console.log('');
              console.log('Prueba en tu aplicación:');
              console.log('1. Abre Sandra Studio Ultimate');
              console.log('2. Escribe: "Lee el README del repo"');
              console.log('3. Sandra debería ejecutar y leer el archivo');
            } else {
              console.log('⚠️ MCP responde pero no está activo');
            }
          } catch (e) {
            console.log('❌ Error parseando MCP Status:', e.message);
            console.log('   Respuesta:', data2.substring(0, 200));
          }
        });
      }).on('error', (e) => {
        console.log('❌ Error conectando con MCP Status:', e.message);
      });
    } catch (e) {
      console.log('❌ Error parseando Health:', e.message);
    }
  });
}).on('error', (e) => {
  console.log('❌ Error conectando con Health:', e.message);
});
