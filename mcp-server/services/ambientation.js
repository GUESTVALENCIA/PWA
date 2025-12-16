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

    this.weatherState = {
      isRaining: false,
      lastCheck: 0,
      location: 'Valencia' // Default location
    };
  }

  async initialize(location = 'Valencia') {
    this.ready = true;
    this.weatherState.location = location;

    // Initial weather check (background)
    this._checkRain(this.weatherState.location)
      .then(isRaining => {
        this.weatherState.isRaining = isRaining;
        this.weatherState.lastCheck = Date.now();
      })
      .catch(error => {
        console.error('Error inicializando clima:', error);
      });
  }

  isReady() {
    return this.ready;
  }

  getStatus() {
    return {
      ready: this.ready,
      availableTypes: Object.keys(this.ambientations),
      weather: this.weatherState
    };
  }

  async _checkRain(location) {
    try {
      const response = await fetch(`https://wttr.in/${location}?format=j1`);
      if (!response.ok) return false;

      const data = await response.json();
      if (!data.current_condition || !data.current_condition[0]) return false;

      const current = data.current_condition[0];
      const desc = current.weatherDesc[0].value.toLowerCase();

      // Palabras clave para lluvia
      const rainKeywords = ['rain', 'drizzle', 'shower', 'thunderstorm', 'precip'];
      const isRaining = rainKeywords.some(keyword => desc.includes(keyword));

      // También verificar precipitación milimétrica si está disponible y es > 0
      const precipMM = parseFloat(current.precipMM);
      if (!isNaN(precipMM) && precipMM > 0) {
          return true;
      }

      return isRaining;
    } catch (error) {
      console.error('Error checking weather:', error);
      return false;
    }
  }

  async getCurrentAmbientation(timezone = 'Europe/Madrid') {
    const now = new Date();
    const hour = new Date(now.toLocaleString('en-US', { timeZone: timezone })).getHours();
    
    // Actualizar clima si ha pasado tiempo (30 min)
    const nowTimestamp = Date.now();
    if (nowTimestamp - this.weatherState.lastCheck > 30 * 60 * 1000) {
        // Ejecutar en segundo plano para no bloquear respuesta
        this._checkRain(this.weatherState.location)
            .then(isRaining => {
                this.weatherState.isRaining = isRaining;
                this.weatherState.lastCheck = Date.now();
            })
            .catch(err => console.error('Background weather check failed:', err));
    }

    // Determinar tipo según hora
    let type;
    if (hour >= 6 && hour < 12) {
      type = 'day';
    } else if (hour >= 12 && hour < 18) {
      type = 'afternoon';
    } else {
      type = 'night';
    }
    
    // Si llueve, sobreescribir con ambiente de lluvia
    // Nota: Podríamos querer mantener 'night' si es de noche aunque llueva,
    // pero la definición actual de 'rain' parece ser un tipo completo.
    // Asumiremos que 'rain' tiene prioridad visual.
    if (this.weatherState.isRaining) {
      type = 'rain';
    }
    
    const ambientation = this.ambientations[type] || this.ambientations.day;
    
    return {
      ...ambientation,
      hour,
      timezone,
      weather: {
        raining: this.weatherState.isRaining,
        checked: new Date(this.weatherState.lastCheck).toISOString()
      },
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
    // Forzar chequeo de clima
    this.weatherState.location = location;
    this.weatherState.isRaining = await this._checkRain(location);
    this.weatherState.lastCheck = Date.now();
    
    return await this.getCurrentAmbientation();
  }
}

module.exports = AmbientationService;
