/**
 * PublicAPIs Service
 * Gestión de APIs públicas indexadas localmente
 * https://github.com/public-apis/public-apis
 */

const PublicAPIsIndexer = require('../utils/public-apis-indexer');

class PublicAPIsService {
  constructor() {
    this.ready = false;
    this.indexer = new PublicAPIsIndexer();
  }

  async initialize() {
    try {
      await this.indexer.loadIndex();
      this.ready = true;
      console.log('✅ Public APIs Service inicializado');
    } catch (error) {
      console.warn('⚠️  Public APIs Service no inicializado completamente:', error.message);
      this.ready = false;
    }
  }

  isReady() {
    return this.ready;
  }

  getStatus() {
    return {
      ready: this.ready,
      indexed: this.indexer.apis ? this.indexer.apis.size : 0
    };
  }

  async search(query) {
    if (!this.ready) {
      throw new Error('Public APIs Service no está listo');
    }

    return this.indexer.search(query);
  }

  async getAPI(name) {
    if (!this.ready) {
      throw new Error('Public APIs Service no está listo');
    }

    return this.indexer.getAPI(name);
  }

  async getCategories() {
    if (!this.ready) {
      throw new Error('Public APIs Service no está listo');
    }

    return this.indexer.getAllCategories();
  }

  async getByCategory(category) {
    if (!this.ready) {
      throw new Error('Public APIs Service no está listo');
    }

    return this.indexer.getByCategory(category);
  }
}

module.exports = PublicAPIsService;

