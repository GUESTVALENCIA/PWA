/**
 * Public APIs Service - Gestión de APIs públicas desde public-apis repo
 * Más de 1700 APIs gratuitas disponibles
 * Reemplazo de servicios de Google y otros servicios pagos
 */

import logger from '../utils/logger.js';

class PublicAPIsService {
  constructor() {
    this.apis = {
      // Geolocalización (alternativas a Google Maps)
      geolocation: {
        ipapi: {
          url: 'https://ipapi.co',
          endpoint: '/{ip}/json/',
          free: true,
          rateLimit: '10,000 requests/month'
        },
        ipapiCo: {
          url: 'https://ip-api.com',
          endpoint: '/json/{ip}',
          free: true,
          rateLimit: '45 requests/minute'
        },
        ipgeolocation: {
          url: 'https://api.ipgeolocation.io',
          endpoint: '/ipgeo',
          free: true,
          rateLimit: '1,500 requests/day'
        },
        freegeoip: {
          url: 'https://freegeoip.app',
          endpoint: '/json/{ip}',
          free: true,
          rateLimit: '15,000 requests/hour'
        },
        ipinfo: {
          url: 'https://ipinfo.io',
          endpoint: '/{ip}/json',
          free: true,
          rateLimit: '50,000 requests/month'
        },
        // ip.guide (ya en uso, preferido)
        ipguide: {
          url: 'https://ip.guide',
          endpoint: '/{ip}',
          free: true,
          rateLimit: 'Unlimited'
        }
      },
      
      // Maps/Navigation (alternativas a Google Maps)
      maps: {
        openstreetmap: {
          url: 'https://nominatim.openstreetmap.org',
          endpoint: '/search',
          free: true,
          rateLimit: '1 request/second'
        },
        mapbox: {
          url: 'https://api.mapbox.com',
          endpoint: '/geocoding/v5/mapbox.places',
          free: true,
          rateLimit: '100,000 requests/month',
          requiresKey: true
        },
        here: {
          url: 'https://geocode.search.hereapi.com',
          endpoint: '/v1/geocode',
          free: true,
          rateLimit: '250,000 requests/month',
          requiresKey: true
        }
      },
      
      // Routing/Directions (alternativas a Google Directions)
      routing: {
        openrouteservice: {
          url: 'https://api.openrouteservice.org',
          endpoint: '/v2/directions',
          free: true,
          rateLimit: '2,000 requests/day',
          requiresKey: true
        },
        graphhopper: {
          url: 'https://graphhopper.com/api/1',
          endpoint: '/route',
          free: true,
          rateLimit: '500 requests/day',
          requiresKey: true
        }
      },
      
      // Weather (para contexto)
      weather: {
        openweathermap: {
          url: 'https://api.openweathermap.org/data/2.5',
          endpoint: '/weather',
          free: true,
          rateLimit: '60 calls/minute',
          requiresKey: true
        },
        weatherapi: {
          url: 'https://api.weatherapi.com/v1',
          endpoint: '/current.json',
          free: true,
          rateLimit: '1,000,000 calls/month',
          requiresKey: true
        }
      },
      
      // Transport/Bus (Valencia)
      transport: {
        emtValencia: {
          url: 'https://valencia.opendatasoft.com',
          endpoint: '/api/records/1.0/search',
          free: true,
          rateLimit: 'Unknown'
        },
        openrouteserviceTransit: {
          url: 'https://api.openrouteservice.org',
          endpoint: '/v2/directions/public_transport',
          free: true,
          rateLimit: '2,000 requests/day',
          requiresKey: true
        }
      }
    };
    
    logger.info('[PUBLIC APIS] ✅ Servicio inicializado con APIs públicas');
  }

  /**
   * Obtener API de geolocalización (preferir ip.guide)
   */
  getGeolocationAPI() {
    return this.apis.geolocation.ipguide; // Preferido: ip.guide (ya en uso)
  }

  /**
   * Obtener API de maps/navigation
   */
  getMapsAPI() {
    // Preferir OpenStreetMap (gratis, sin key)
    return this.apis.maps.openstreetmap;
  }

  /**
   * Obtener API de routing/directions
   */
  getRoutingAPI() {
    // Preferir OpenRouteService si tiene key, sino OpenStreetMap
    return process.env.OPENROUTESERVICE_API_KEY 
      ? this.apis.routing.openrouteservice
      : this.apis.maps.openstreetmap;
  }

  /**
   * Obtener API de transporte público
   */
  getTransportAPI() {
    return process.env.OPENROUTESERVICE_API_KEY
      ? this.apis.transport.openrouteserviceTransit
      : this.apis.transport.emtValencia;
  }

  /**
   * Obtener API de clima
   */
  getWeatherAPI() {
    // Preferir WeatherAPI si tiene key
    return process.env.WEATHERAPI_KEY
      ? this.apis.weather.weatherapi
      : this.apis.weather.openweathermap;
  }
}

export default PublicAPIsService;
