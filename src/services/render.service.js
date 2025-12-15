const config = require('../config/config');
const { handleRequest } = require('../utils/apiClient');

class RenderService {
  constructor() {
    this.baseUrl = 'https://api.render.com/v1';
    this.apiKey = process.env.RENDER_API_KEY;
  }

  async getServices() {
    if (!this.apiKey) {
      throw new Error('RENDER_API_KEY not configured');
    }

    return await handleRequest(`${this.baseUrl}/services?limit=20`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'application/json'
      }
    });
  }

  async getDeployments(serviceId) {
    if (!this.apiKey) {
        throw new Error('RENDER_API_KEY not configured');
    }

    return await handleRequest(`${this.baseUrl}/services/${serviceId}/deployments?limit=10`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Accept': 'application/json'
        }
    });
  }

  async triggerDeploy(serviceId, clearCache = false) {
      if (!this.apiKey) {
          throw new Error('RENDER_API_KEY not configured');
      }

      return await handleRequest(`${this.baseUrl}/services/${serviceId}/deploys`, {
          method: 'POST',
          headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
          },
          body: JSON.stringify({ clearCache })
      });
  }
}

module.exports = new RenderService();
