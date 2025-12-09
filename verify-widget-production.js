/**
 * Script de verificación del widget de Sandra en producción
 * Ejecutar después del deploy para verificar que todo funciona
 */

const https = require('https');

const PRODUCTION_URL = 'https://pwa-2caws3ssh-guests-valencias-projects.vercel.app';
const WIDGET_PATH = '/assets/js/sandra-widget.js';

function checkFile(url, path) {
  return new Promise((resolve, reject) => {
    https.get(url + path, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve({
            exists: true,
            size: data.length,
            statusCode: res.statusCode,
            content: data.substring(0, 200) // Primeros 200 caracteres
          });
        } else {
          resolve({
            exists: false,
            statusCode: res.statusCode
          });
        }
      });
    }).on('error', reject);
  });
}

function checkHTML(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let html = '';
      res.on('data', (chunk) => html += chunk);
      res.on('end', () => {
        const hasWidgetScript = html.includes('sandra-widget.js');
        const hasSandraWidget = html.includes('SandraWidget') || html.includes('sandra-widget-button');
        
        resolve({
          statusCode: res.statusCode,
          hasWidgetScript,
          hasSandraWidget,
          htmlSnippet: html.includes('sandra-widget.js') ? 
            html.substring(html.indexOf('sandra-widget.js') - 50, html.indexOf('sandra-widget.js') + 100) : 
            'No encontrado'
        });
      });
    }).on('error', reject);
  });
}

async function verify() {
  console.log('\n🔍 Verificando widget de Sandra en producción...\n');
  console.log(`URL: ${PRODUCTION_URL}\n`);

  try {
    // Verificar que el archivo JS existe
    console.log('1. Verificando archivo sandra-widget.js...');
    const fileCheck = await checkFile(PRODUCTION_URL, WIDGET_PATH);
    
    if (fileCheck.exists) {
      console.log(`   ✅ Archivo encontrado (${fileCheck.size} bytes)`);
      console.log(`   ✅ Status: ${fileCheck.statusCode}`);
      console.log(`   ✅ Contenido: ${fileCheck.content.substring(0, 100)}...`);
    } else {
      console.log(`   ❌ Archivo NO encontrado (Status: ${fileCheck.statusCode})`);
      if (fileCheck.statusCode === 401 || fileCheck.statusCode === 403) {
        console.log(`   ⚠️  Sitio puede requerir autenticación o no estar desplegado aún`);
      } else {
        console.log(`   ⚠️  El widget no se desplegará correctamente`);
      }
    }

    // Verificar que el HTML incluye el script
    console.log('\n2. Verificando integración en index.html...');
    const htmlCheck = await checkHTML(PRODUCTION_URL);
    
    console.log(`   ✅ Status HTML: ${htmlCheck.statusCode}`);
    console.log(`   ${htmlCheck.hasWidgetScript ? '✅' : '❌'} Script sandra-widget.js referenciado: ${htmlCheck.hasWidgetScript}`);
    console.log(`   ${htmlCheck.hasSandraWidget ? '✅' : '❌'} Clase SandraWidget presente: ${htmlCheck.hasSandraWidget}`);
    
    if (htmlCheck.hasWidgetScript) {
      console.log(`   📄 Snippet: ...${htmlCheck.htmlSnippet}...`);
    }

    // Resumen
    console.log('\n' + '='.repeat(60));
    if (fileCheck.exists && htmlCheck.hasWidgetScript) {
      console.log('✅ WIDGET LISTO PARA PRODUCCIÓN');
      console.log('✅ Archivo JS desplegado correctamente');
      console.log('✅ HTML incluye referencia al script');
    } else {
      console.log('⚠️  WIDGET REQUIERE VERIFICACIÓN');
      if (!fileCheck.exists) {
        console.log('❌ El archivo JS no está disponible');
      }
      if (!htmlCheck.hasWidgetScript) {
        console.log('❌ El HTML no incluye el script');
      }
      console.log('\n💡 Nota: Si el sitio está protegido o aún no desplegado,');
      console.log('   espera a que Vercel complete el deploy y vuelve a ejecutar este script.');
    }
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Error verificando:', error.message);
    console.log('\n💡 El sitio puede no estar desplegado aún o requiere autenticación.');
  }
}

verify();

