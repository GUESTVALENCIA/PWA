/**
 * Ambientation Service
 * Gestión de ambientación dinámica según hora/clima
 * Sandra cambia de ropa/escenario según hora del día y clima
 */

class AmbientationService {
  constructor() {
    this.ready = false;
    this.ambientations = {
      day: {
        type: 'day',
        time: 'morning',
        image: '/assets/images/sandra-day.png',
        video: '/assets/videos/sandra-day.mp4',
        description: 'Sandra durante el día'
      },
      afternoon: {
        type: 'afternoon',
        time: 'afternoon',
        image: '/assets/images/sandra-afternoon.png',
        video: '/assets/videos/sandra-afternoon.mp4',
        description: 'Sandra por la tarde'
      },
      night: {
        type: 'night',
        time: 'night',
        image: '/assets/images/sandra-night.png',
        video: '/assets/videos/sandra-night.mp4',
        description: 'Sandra por la noche'
      },
      rain: {
        type: 'rain',
        time: 'day',
        image: '/assets/images/sandra-rain.png',
        video: '/assets/videos/sandra-rain.mp4',
        description: 'Sandra en día lluvioso'
      }
    };
  }

  async initialize() {
    this.ready = true;
  }

  isReady() {
    return this.ready;
  }

  getStatus() {
    return {
      ready: this.ready,
      availableTypes: Object.keys(this.ambientations)
    };
  }

  async getCurrentAmbientation(timezone = 'Europe/Madrid') {
    const now = new Date();
    const hour = new Date(now.toLocaleString('en-US', { timeZone: timezone })).getHours();
    
    // Determinar tipo según hora
    let type;
    if (hour >= 6 && hour < 12) {
      type = 'day';
    } else if (hour >= 12 && hour < 18) {
      type = 'afternoon';
    } else {
      type = 'night';
    }
    
    // TODO: Integrar API de clima para detectar lluvia
    // Por ahora, usar hora del día
    
    const ambientation = this.ambientations[type] || this.ambientations.day;
    
    return {
      ...ambientation,
      hour,
      timezone,
      timestamp: new Date().toISOString()
    };
  }

  async setAmbientation(type, timezone = 'Europe/Madrid') {
    if (!this.ambientations[type]) {
      throw new Error(`Tipo de ambientación no válido: ${type}`);
    }
    
    const ambientation = this.ambientations[type];
    
    return {
      ...ambientation,
      timezone,
      timestamp: new Date().toISOString()
    };
  }

  async getWeatherBasedAmbientation(location = 'Valencia') {
    // TODO: Integrar API de meteorología
    // Por ahora, retornar ambientación por defecto según hora
    
    return await this.getCurrentAmbientation();
  }
}

module.exports = AmbientationService;

