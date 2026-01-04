/**
 * BridgeData Service - Consulta SOLO disponibilidad de propiedades
 * Microservicio para consultar y actualizar disponibilidad desde BridgeData/PMS
 * NOTA: NO maneja precios, solo disponibilidad (is_available)
 */

import logger from '../utils/logger.js';
import NeonService from './neon-service.js';

class BridgeDataService {
  constructor() {
    this.neonService = null;
    this.updateInterval = null;
    this.updateIntervalMs = 60 * 60 * 1000; // 1 hora por defecto
    this.bridgeDataApiKey = process.env.BRIDGEDATA_API_KEY || process.env.BRIGHTDATA_PROXY_URL;
    this.bridgeDataUrl = process.env.BRIDGEDATA_API_URL || 'https://api.bridgedata.com';
  }

  /**
   * Inicializar servicio con Neon DB
   */
  async initialize(neonService) {
    this.neonService = neonService;
    logger.info('[BRIDGE DATA] ✅ Servicio inicializado');
    
    // Iniciar actualización periódica si está habilitada
    if (process.env.BRIDGEDATA_AUTO_UPDATE === 'true') {
      this.startPeriodicUpdate();
    }
  }

  /**
   * Consultar SOLO disponibilidad de una propiedad desde BridgeData
   * NOTA: NO retorna precios, solo disponibilidad (is_available)
   * @param {string} propertyId - ID de la propiedad
   * @param {string} checkIn - Fecha check-in (YYYY-MM-DD)
   * @param {string} checkOut - Fecha check-out (YYYY-MM-DD)
   * @returns {Promise<Object>} Solo disponibilidad (sin precios)
   */
  async checkAvailability(propertyId, checkIn, checkOut) {
    try {
      // 1. Primero consultar cache en Neon DB
      const cached = await this.neonService.getPropertyAvailability(propertyId, checkIn, checkOut);
      
      if (cached && this.isCacheValid(cached.last_checked)) {
        logger.debug(`[BRIDGE DATA] ✅ Disponibilidad desde cache para ${propertyId}`);
        return {
          available: cached.is_available !== undefined ? cached.is_available : cached.available,
          source: 'cache',
          lastChecked: cached.last_checked
        };
      }

      // 2. Si no hay cache válido, consultar BridgeData API (SOLO disponibilidad)
      const freshData = await this.fetchFromBridgeData(propertyId, checkIn, checkOut);
      
      // 3. Actualizar cache en Neon DB (SOLO is_available, NO precios)
      if (freshData) {
        await this.neonService.updatePropertyAvailability({
          property_id: propertyId,
          check_in: checkIn,
          check_out: checkOut,
          is_available: freshData.available,
          last_checked: new Date().toISOString()
        });
      }

      return {
        available: freshData.available,
        source: 'bridge_data',
        lastChecked: new Date().toISOString()
      };
    } catch (error) {
      logger.error('[BRIDGE DATA] ❌ Error consultando disponibilidad:', error);
      
      // Fallback a cache aunque sea antiguo
      const cached = await this.neonService.getPropertyAvailability(propertyId, checkIn, checkOut);
      if (cached) {
        return {
          available: cached.is_available !== undefined ? cached.is_available : cached.available,
          source: 'cache_stale',
          lastChecked: cached.last_checked,
          warning: 'Datos de cache, puede estar desactualizado'
        };
      }

      throw error;
    }
  }

  /**
   * Consultar BridgeData API directamente (SOLO disponibilidad)
   * NOTA: NO retorna precios, solo is_available
   */
  async fetchFromBridgeData(propertyId, checkIn, checkOut) {
    // TODO: Implementar llamada real a BridgeData API
    // Por ahora, simulación con datos de ejemplo
    
    if (!this.bridgeDataApiKey) {
      logger.warn('[BRIDGE DATA] ⚠️ BRIDGEDATA_API_KEY no configurada, usando datos simulados');
      return this.getSimulatedAvailability(propertyId, checkIn, checkOut);
    }

    try {
      // Implementación real de API call (SOLO disponibilidad)
      const response = await fetch(`${this.bridgeDataUrl}/properties/${propertyId}/availability`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.bridgeDataApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          check_in: checkIn,
          check_out: checkOut
        })
      });

      if (!response.ok) {
        throw new Error(`BridgeData API error: ${response.status}`);
      }

      const data = await response.json();
      // SOLO retornar disponibilidad, NO precios
      return {
        available: data.available || data.is_available || false,
        property_id: propertyId
      };
    } catch (error) {
      logger.error('[BRIDGE DATA] Error en API call:', error);
      // Fallback a simulación
      return this.getSimulatedAvailability(propertyId, checkIn, checkOut);
    }
  }

  /**
   * Datos simulados para desarrollo/testing (SOLO disponibilidad)
   */
  getSimulatedAvailability(propertyId, checkIn, checkOut) {
    // Simular disponibilidad (siempre true por ahora)
    // En producción, esto vendría de BridgeData/PMS
    return {
      available: true, // Simular siempre disponible
      property_id: propertyId
      // NO incluir precios aquí
    };
  }

  /**
   * Verificar si el cache es válido (menos de 1 hora)
   */
  isCacheValid(lastChecked) {
    if (!lastChecked) return false;
    const lastCheckedDate = new Date(lastChecked);
    const now = new Date();
    const hoursSinceUpdate = (now - lastCheckedDate) / (1000 * 60 * 60);
    return hoursSinceUpdate < 1; // Cache válido por 1 hora
  }

  /**
   * Actualizar disponibilidad de todas las propiedades
   */
  async updateAllProperties() {
    try {
      logger.info('[BRIDGE DATA] 🔄 Iniciando actualización de disponibilidad...');
      
      // Obtener todas las propiedades desde Neon DB
      const properties = await this.neonService.getPropertiesByLocation(null);
      
      if (!properties || properties.length === 0) {
        logger.warn('[BRIDGE DATA] ⚠️ No hay propiedades para actualizar');
        return;
      }

      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      const checkIn = today.toISOString().split('T')[0];
      const checkOut = nextWeek.toISOString().split('T')[0];

      let updated = 0;
      for (const property of properties) {
        try {
          await this.checkAvailability(property.property_id, checkIn, checkOut);
          updated++;
        } catch (error) {
          logger.warn(`[BRIDGE DATA] ⚠️ Error actualizando ${property.property_id}:`, error.message);
        }
      }

      logger.info(`[BRIDGE DATA] ✅ Actualizadas ${updated}/${properties.length} propiedades`);
    } catch (error) {
      logger.error('[BRIDGE DATA] ❌ Error en actualización masiva:', error);
    }
  }

  /**
   * Iniciar actualización periódica
   */
  startPeriodicUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(() => {
      this.updateAllProperties();
    }, this.updateIntervalMs);

    logger.info(`[BRIDGE DATA] ✅ Actualización periódica iniciada (cada ${this.updateIntervalMs / 1000 / 60} minutos)`);
  }

  /**
   * Detener actualización periódica
   */
  stopPeriodicUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      logger.info('[BRIDGE DATA] ⏹️ Actualización periódica detenida');
    }
  }
}

export default BridgeDataService;
