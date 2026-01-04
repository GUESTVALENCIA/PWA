/**
 * IP Tracking Service - Sistema completo de rastreo de IPs
 * Usa ip.guide (API pública gratuita)
 * Funcionalidades:
 * - Detectar región/idioma por IP
 * - Recuperar conversaciones anteriores
 * - Detectar si llamada se cayó o se cortó normalmente
 * - Recuperar contexto completo
 * - Almacenar en NEON DB
 */

import logger from '../utils/logger.js';
import NeonService from './neon-service.js';

class IPTrackingService {
  constructor() {
    this.neonService = null;
    this.ipGuideUrl = 'https://ip.guide';
  }

  /**
   * Inicializar servicio con Neon DB
   */
  async initialize(neonService) {
    this.neonService = neonService;
    logger.info('[IP TRACKING] ✅ Servicio inicializado');
  }

  /**
   * Obtener información completa de IP desde ip.guide
   * @param {string} ipAddress - Dirección IP
   * @returns {Promise<Object>} Información completa de IP
   */
  async getIPInfo(ipAddress) {
    try {
      if (!ipAddress || ipAddress === '::1' || ipAddress === '127.0.0.1') {
        // IP local, retornar datos por defecto
        return {
          ip: ipAddress,
          location: {
            city: 'Valencia',
            country: 'Spain',
            countryCode: 'ES',
            timezone: 'Europe/Madrid',
            latitude: 39.4699,
            longitude: -0.3763
          },
          network: {
            autonomous_system: {
              asn: null,
              name: 'Local',
              organization: 'Local Network',
              country: 'ES'
            }
          }
        };
      }

      const response = await fetch(`${this.ipGuideUrl}/${ipAddress}`, {
        headers: {
          'User-Agent': 'GuestsValencia-PWA/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`ip.guide API error: ${response.status}`);
      }

      const data = await response.json();
      
      logger.debug(`[IP TRACKING] ✅ IP info obtenida para ${ipAddress}`);
      return data;
    } catch (error) {
      logger.error('[IP TRACKING] ❌ Error obteniendo IP info:', error);
      // Fallback a datos básicos
      return {
        ip: ipAddress,
        location: {
          city: null,
          country: 'Unknown',
          countryCode: 'XX',
          timezone: 'UTC',
          latitude: null,
          longitude: null
        }
      };
    }
  }

  /**
   * Detectar idioma basado en país/IP
   * @param {string} countryCode - Código de país (ES, FR, EN, etc.)
   * @returns {string} Código de idioma preferido
   */
  detectLanguage(countryCode) {
    const languageMap = {
      'ES': 'es', // España
      'MX': 'es', // México
      'AR': 'es', // Argentina
      'CO': 'es', // Colombia
      'CL': 'es', // Chile
      'PE': 'es', // Perú
      'VE': 'es', // Venezuela
      'US': 'en', // Estados Unidos
      'GB': 'en', // Reino Unido
      'CA': 'en', // Canadá
      'AU': 'en', // Australia
      'FR': 'fr', // Francia
      'BE': 'fr', // Bélgica
      'CH': 'fr', // Suiza (francés)
      'DE': 'de', // Alemania
      'AT': 'de', // Austria
      'IT': 'it', // Italia
      'PT': 'pt', // Portugal
      'BR': 'pt', // Brasil
      'NL': 'nl', // Países Bajos
      'RU': 'ru', // Rusia
      'CN': 'zh', // China
      'JP': 'ja', // Japón
      'KR': 'ko', // Corea
      'VA': 'es' // Comunidad Valenciana (si existe código)
    };

    return languageMap[countryCode] || 'es'; // Default: español
  }

  /**
   * Detectar acento/región basado en IP
   * @param {Object} ipInfo - Información de IP
   * @returns {string} Acento detectado
   */
  detectAccent(ipInfo) {
    const countryCode = ipInfo.location?.countryCode || ipInfo.location?.country?.substring(0, 2);
    const city = ipInfo.location?.city?.toLowerCase() || '';

    // Acentos españoles
    if (countryCode === 'ES') {
      if (city.includes('valencia') || city.includes('alicante') || city.includes('castellón')) {
        return 'valenciano';
      } else if (city.includes('madrid')) {
        return 'madrileño';
      } else if (city.includes('barcelona') || city.includes('cataluña')) {
        return 'catalán';
      } else if (city.includes('sevilla') || city.includes('andaluz')) {
        return 'andaluz';
      }
      return 'español_neutro';
    }

    // Acentos latinoamericanos
    if (countryCode === 'MX') return 'mexicano';
    if (countryCode === 'AR') return 'argentino';
    if (countryCode === 'CO') return 'colombiano';
    if (countryCode === 'CL') return 'chileno';

    return 'neutral';
  }

  /**
   * Buscar conversaciones anteriores por IP
   * @param {string} ipAddress - Dirección IP
   * @returns {Promise<Array>} Conversaciones anteriores
   */
  async findPreviousConversations(ipAddress) {
    try {
      if (!this.neonService) {
        logger.warn('[IP TRACKING] ⚠️ NeonService no inicializado');
        return [];
      }

      // Buscar en call_logs por IP
      const callLogs = await this.neonService.query(
        `SELECT * FROM call_logs 
         WHERE ip_address = $1 
         ORDER BY start_time DESC 
         LIMIT 10`,
        [ipAddress]
      );

      // Buscar en sessions por IP
      const sessions = await this.neonService.query(
        `SELECT * FROM sessions 
         WHERE ip_address = $1 
         ORDER BY created_at DESC 
         LIMIT 10`,
        [ipAddress]
      );

      // Buscar en users por IP
      const users = await this.neonService.query(
        `SELECT * FROM users 
         WHERE ip_address = $1 
         ORDER BY created_at DESC 
         LIMIT 5`,
        [ipAddress]
      );

      logger.info(`[IP TRACKING] ✅ Encontradas ${callLogs.rows.length} conversaciones anteriores para IP ${ipAddress}`);
      
      return {
        callLogs: callLogs.rows || [],
        sessions: sessions.rows || [],
        users: users.rows || []
      };
    } catch (error) {
      logger.error('[IP TRACKING] ❌ Error buscando conversaciones:', error);
      return { callLogs: [], sessions: [], users: [] };
    }
  }

  /**
   * Guardar información de IP en NEON DB
   * @param {string} sessionId - ID de sesión
   * @param {string} ipAddress - Dirección IP
   * @param {Object} ipInfo - Información completa de IP
   */
  async saveIPInfo(sessionId, ipAddress, ipInfo) {
    try {
      if (!this.neonService) return;

      const location = ipInfo.location || {};
      const network = ipInfo.network || {};
      const asn = network.autonomous_system || {};

      // Actualizar call_log si existe
      await this.neonService.query(
        `UPDATE call_logs 
         SET 
           ip_address = $1,
           country = $2,
           city = $3,
           timezone = $4,
           language = $5
         WHERE session_id = $6`,
        [
          ipAddress,
          location.country || location.countryCode,
          location.city,
          location.timezone,
          this.detectLanguage(location.countryCode),
          sessionId
        ]
      );

      // Actualizar o crear usuario por IP
      const language = this.detectLanguage(location.countryCode);
      const accent = this.detectAccent(ipInfo);

      await this.neonService.createOrUpdateUser({
        ip_address: ipAddress,
        language: language,
        country: location.country || location.countryCode,
        city: location.city,
        timezone: location.timezone,
        preferences: {
          accent: accent,
          detected_country: location.country,
          detected_city: location.city,
          asn: asn.asn,
          organization: asn.organization || asn.name
        }
      });

      logger.info(`[IP TRACKING] ✅ Información de IP guardada para ${ipAddress}`);
    } catch (error) {
      logger.error('[IP TRACKING] ❌ Error guardando IP info:', error);
    }
  }

  /**
   * Detectar si llamada se cayó o se cortó normalmente
   * @param {string} sessionId - ID de sesión
   * @param {string} reason - Razón del cierre (close, error, timeout)
   * @returns {string} Tipo de cierre: 'normal' | 'dropped' | 'error'
   */
  async detectCallEndType(sessionId, reason) {
    try {
      if (!this.neonService) return 'unknown';

      // Obtener último estado de la llamada
      const callLog = await this.neonService.query(
        `SELECT * FROM call_logs WHERE session_id = $1 ORDER BY start_time DESC LIMIT 1`,
        [sessionId]
      );

      if (!callLog.rows || callLog.rows.length === 0) {
        return 'unknown';
      }

      const log = callLog.rows[0];

      // Si hay end_time, se cortó normalmente
      if (log.end_time && reason === 'close') {
        return 'normal';
      }

      // Si no hay end_time pero hay error, se cayó
      if (!log.end_time && (reason === 'error' || reason === 'timeout')) {
        return 'dropped';
      }

      // Si hay end_time pero el tiempo fue muy corto (< 5 segundos), probablemente error
      if (log.end_time && log.start_time) {
        const duration = new Date(log.end_time) - new Date(log.start_time);
        if (duration < 5000) {
          return 'dropped';
        }
      }

      return reason === 'close' ? 'normal' : 'dropped';
    } catch (error) {
      logger.error('[IP TRACKING] ❌ Error detectando tipo de cierre:', error);
      return 'unknown';
    }
  }

  /**
   * Recuperar contexto completo de una conversación anterior
   * @param {string} ipAddress - Dirección IP
   * @param {string} sessionId - ID de sesión actual (opcional)
   * @returns {Promise<Object>} Contexto completo
   */
  async recoverContext(ipAddress, sessionId = null) {
    try {
      const previousData = await this.findPreviousConversations(ipAddress);
      const ipInfo = await this.getIPInfo(ipAddress);

      // Obtener última conversación completa
      let lastConversation = null;
      if (previousData.callLogs.length > 0) {
        const lastCall = previousData.callLogs[0];
        const conversationHistory = await this.neonService.getConversationHistoryEntries(
          lastCall.session_id,
          10
        );
        
        lastConversation = {
          sessionId: lastCall.session_id,
          startTime: lastCall.start_time,
          endTime: lastCall.end_time,
          conversationHistory: conversationHistory || [],
          bookingDetails: lastCall.booking_details,
          intent: lastCall.intent
        };
      }

      // Obtener información de usuario
      let userInfo = null;
      if (previousData.users.length > 0) {
        userInfo = previousData.users[0];
      }

      const context = {
        ipAddress,
        ipInfo: {
          location: ipInfo.location,
          network: ipInfo.network,
          language: this.detectLanguage(ipInfo.location?.countryCode),
          accent: this.detectAccent(ipInfo)
        },
        previousConversations: previousData.callLogs.length,
        lastConversation,
        userInfo,
        isReturningUser: previousData.callLogs.length > 0,
        recommendedLanguage: this.detectLanguage(ipInfo.location?.countryCode),
        recommendedAccent: this.detectAccent(ipInfo)
      };

      logger.info(`[IP TRACKING] ✅ Contexto recuperado para IP ${ipAddress}: ${previousData.callLogs.length} conversaciones anteriores`);
      return context;
    } catch (error) {
      logger.error('[IP TRACKING] ❌ Error recuperando contexto:', error);
      return null;
    }
  }

  /**
   * Obtener información resumida de IP (rápido, para uso en prompt)
   * @param {string} ipAddress - Dirección IP
   * @returns {Promise<Object>} Información resumida
   */
  async getQuickIPInfo(ipAddress) {
    try {
      const ipInfo = await this.getIPInfo(ipAddress);
      const language = this.detectLanguage(ipInfo.location?.countryCode);
      const accent = this.detectAccent(ipInfo);

      return {
        country: ipInfo.location?.country || ipInfo.location?.countryCode,
        city: ipInfo.location?.city,
        timezone: ipInfo.location?.timezone,
        language: language,
        accent: accent,
        coordinates: ipInfo.location?.latitude && ipInfo.location?.longitude 
          ? { lat: ipInfo.location.latitude, lng: ipInfo.location.longitude }
          : null
      };
    } catch (error) {
      logger.error('[IP TRACKING] ❌ Error obteniendo quick IP info:', error);
      return {
        country: 'Unknown',
        city: null,
        timezone: 'UTC',
        language: 'es',
        accent: 'neutral'
      };
    }
  }
}

export default IPTrackingService;
