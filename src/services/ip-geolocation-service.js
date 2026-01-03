/**
 * IP Geolocation Service
 * Obtiene información de ubicación basada en IP del cliente
 * Usa ip.guide API para obtener país, ciudad y zona horaria
 */

import logger from '../utils/logger.js';

class IPGeolocationService {
  constructor() {
    this.apiUrl = 'https://ip.guide';
  }

  /**
   * Get geolocation data from IP address
   * @param {string} ipAddress - IP address of the client
   * @returns {Promise<Object>} Geolocation data (country, city, timezone, etc.)
   */
  async getLocationFromIP(ipAddress) {
    try {
      if (!ipAddress || ipAddress === '::1' || ipAddress === '127.0.0.1') {
        // Localhost - return default values
        return {
          country: 'ES',
          city: 'Valencia',
          timezone: 'Europe/Madrid',
          language: 'es',
          region: 'Comunidad Valenciana'
        };
      }

      const response = await fetch(`${this.apiUrl}/${ipAddress}`, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`IP Geolocation API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Extract relevant information
      const result = {
        country: data.country_code || 'ES',
        city: data.city || 'Valencia',
        timezone: data.timezone || 'Europe/Madrid',
        language: this.getLanguageFromCountry(data.country_code || 'ES'),
        region: data.region || data.state || null,
        latitude: data.latitude || null,
        longitude: data.longitude || null
      };

      logger.info(`[IP-GEOLOCATION] ✅ Location retrieved for IP ${ipAddress}: ${result.city}, ${result.country}`);
      return result;
    } catch (error) {
      logger.warn(`[IP-GEOLOCATION] ⚠️ Error getting location for IP ${ipAddress}:`, error.message);
      // Return default values on error
      return {
        country: 'ES',
        city: 'Valencia',
        timezone: 'Europe/Madrid',
        language: 'es',
        region: null
      };
    }
  }

  /**
   * Get language code from country code
   * @param {string} countryCode - ISO country code
   * @returns {string} Language code
   */
  getLanguageFromCountry(countryCode) {
    const languageMap = {
      'ES': 'es',
      'MX': 'es',
      'AR': 'es',
      'CO': 'es',
      'CL': 'es',
      'PE': 'es',
      'VE': 'es',
      'EC': 'es',
      'GT': 'es',
      'CU': 'es',
      'BO': 'es',
      'DO': 'es',
      'HN': 'es',
      'PY': 'es',
      'SV': 'es',
      'NI': 'es',
      'CR': 'es',
      'PA': 'es',
      'UY': 'es',
      'US': 'en',
      'GB': 'en',
      'CA': 'en',
      'AU': 'en',
      'NZ': 'en',
      'IE': 'en',
      'FR': 'fr',
      'BE': 'fr',
      'CH': 'fr',
      'IT': 'it',
      'PT': 'pt',
      'BR': 'pt',
      'DE': 'de',
      'AT': 'de',
      'NL': 'nl',
      'PL': 'pl',
      'RU': 'ru',
      'CN': 'zh',
      'JP': 'ja',
      'KR': 'ko'
    };
    return languageMap[countryCode] || 'es'; // Default to Spanish
  }

  /**
   * Extract IP address from request object
   * Handles proxies and load balancers
   * @param {Object} req - HTTP request object
   * @returns {string} IP address
   */
  extractIPFromRequest(req) {
    try {
      // Check for forwarded headers (proxies, load balancers)
      const forwarded = req.headers['x-forwarded-for'];
      if (forwarded) {
        // X-Forwarded-For can contain multiple IPs, take the first one
        return forwarded.split(',')[0].trim();
      }

      // Check for real IP header
      const realIP = req.headers['x-real-ip'];
      if (realIP) {
        return realIP;
      }

      // Fallback to socket remote address
      if (req.socket && req.socket.remoteAddress) {
        return req.socket.remoteAddress;
      }

      // Last resort
      return req.connection?.remoteAddress || '127.0.0.1';
    } catch (error) {
      logger.warn('[IP-GEOLOCATION] Error extracting IP from request:', error);
      return '127.0.0.1';
    }
  }
}

export default IPGeolocationService;
