#!/usr/bin/env node
/**
 * Script para clonar e indexar Public APIs Repository
 * https://github.com/public-apis/public-apis
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');

const PUBLIC_APIS_REPO = 'https://raw.githubusercontent.com/public-apis/public-apis/master/apis.json';
const OUTPUT_PATH = path.join(__dirname, '../data/public-apis-index.json');

async function downloadPublicAPIs() {
  console.log(' Descargando Public APIs Repository...\n');
  
  return new Promise((resolve, reject) => {
    https.get(PUBLIC_APIS_REPO, (res) => {
      let data = '';
      
      res.on('data', (chunk) => data += chunk);
      res.on('end', async () => {
        try {
          const apis = JSON.parse(data);
          
          // Asegurar que el directorio existe
          await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
          
          // Guardar índice
          await fs.writeFile(OUTPUT_PATH, JSON.stringify(apis, null, 2));
          
          console.log(` ${apis.length} APIs indexadas`);
          console.log(` Guardado en: ${OUTPUT_PATH}\n`);
          
          resolve(apis);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  try {
    const apis = await downloadPublicAPIs();
    
    console.log(' Estadísticas:');
    const categories = new Set(apis.map(api => api.Category));
    console.log(`  • Total APIs: ${apis.length}`);
    console.log(`  • Categorías: ${categories.size}`);
    console.log(`  • Categorías principales: ${Array.from(categories).slice(0, 5).join(', ')}\n`);
    
    console.log(' Public APIs indexado exitosamente\n');
  } catch (error) {
    console.error(' Error:', error.message);
    process.exit(1);
  }
}

main();

