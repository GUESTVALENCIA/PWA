/**
 * Public APIs Indexer
 * Indexa el repositorio de Public APIs para acceso local
 * https://github.com/public-apis/public-apis
 */

const fs = require('fs').promises;
const path = require('path');

class PublicAPIsIndexer {
  constructor() {
    this.indexPath = path.join(__dirname, '../data/public-apis-index.json');
    this.apis = new Map();
  }

  async loadIndex() {
    try {
      // Crear directorio data si no existe
      const dataDir = path.join(__dirname, '../data');
      try {
        await fs.mkdir(dataDir, { recursive: true });
      } catch (e) {
        // Directorio ya existe, continuar
      }

      // Crear archivo vacío si no existe
      try {
        await fs.access(this.indexPath);
      } catch (e) {
        // Archivo no existe, crear uno vacío
        await fs.writeFile(this.indexPath, JSON.stringify({ apis: [], lastUpdated: new Date().toISOString(), version: "1.0.0" }, null, 2));
        console.log('✅ Archivo public-apis-index.json creado');
      }

      const data = await fs.readFile(this.indexPath, 'utf8');
      const indexData = JSON.parse(data);
      
      // Manejar tanto array como objeto con propiedad 'apis'
      const index = Array.isArray(indexData) ? indexData : (indexData.apis || []);
      
      index.forEach(api => {
        this.apis.set(api.name.toLowerCase(), api);
        // También indexar por categoría
        if (api.category) {
          const categoryKey = `category:${api.category.toLowerCase()}`;
          if (!this.apis.has(categoryKey)) {
            this.apis.set(categoryKey, []);
          }
          this.apis.get(categoryKey).push(api);
        }
      });
      
      console.log(`✅ Índice de APIs cargado: ${this.apis.size} APIs`);
      return true;
    } catch (error) {
      console.warn('⚠️  No se pudo cargar el índice de APIs:', error.message);
      // Inicializar con estructura vacía para evitar errores
      this.apis = new Map();
      return false;
    }
  }

  search(query) {
    const queryLower = query.toLowerCase();
    const results = [];
    
    // Búsqueda por nombre
    for (const [key, value] of this.apis.entries()) {
      if (key.includes(queryLower) && !key.startsWith('category:')) {
        results.push(value);
      }
    }
    
    // Búsqueda por descripción si es un objeto con descripción
    for (const [key, value] of this.apis.entries()) {
      if (!key.startsWith('category:') && typeof value === 'object') {
        if (value.description && value.description.toLowerCase().includes(queryLower)) {
          if (!results.find(r => r.name === value.name)) {
            results.push(value);
          }
        }
      }
    }
    
    return results.slice(0, 10); // Limitar a 10 resultados
  }

  getByCategory(category) {
    const categoryKey = `category:${category.toLowerCase()}`;
    return this.apis.get(categoryKey) || [];
  }

  getAPI(name) {
    return this.apis.get(name.toLowerCase());
  }

  getAllCategories() {
    const categories = new Set();
    for (const [key, value] of this.apis.entries()) {
      if (!key.startsWith('category:') && value.category) {
        categories.add(value.category);
      }
    }
    return Array.from(categories);
  }
}

module.exports = PublicAPIsIndexer;

