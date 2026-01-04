/**
 * 🔄 NEGOTIATION BRIDGE - Conecta Pipeline de Negociación de IA-SANDRA
 * 
 * Bridge que conecta el pipeline de negociación de IA-SANDRA con el sistema PWA
 * sin modificar ninguno de los dos repos.
 */

import logger from '../utils/logger.js';

class NegotiationBridge {
  constructor(sandraOrchestrator) {
    this.sandraOrchestrator = sandraOrchestrator;
    this.negotiationPipeline = null;
  }

  /**
   * Inicializar bridge con pipeline de IA-SANDRA
   */
  async initialize() {
    if (this.sandraOrchestrator && this.sandraOrchestrator.negotiationPipeline) {
      this.negotiationPipeline = this.sandraOrchestrator.negotiationPipeline;
      logger.info('[NEGOTIATION BRIDGE] ✅ Pipeline de negociación conectado');
      return true;
    }
    
    logger.warn('[NEGOTIATION BRIDGE] ⚠️ Pipeline de negociación no disponible');
    return false;
  }

  /**
   * Calcular oferta estratégica
   * @param {Object} params - Parámetros de negociación
   * @param {string} params.propertyId - ID de la propiedad
   * @param {number} params.basePrice - Precio base (o startPrice)
   * @param {string} params.season - Temporada (high/medium/low) - opcional
   * @param {string} params.channel - Canal (direct/ota/phone) - opcional
   * @param {number} params.guests - Número de huéspedes - opcional
   * @param {number} params.nights - Número de noches - opcional
   * @param {string} params.date - Fecha de check-in - opcional
   * @returns {Promise<Object>} Oferta calculada
   */
  async calculateOffer(params) {
    if (!this.negotiationPipeline) {
      logger.warn('[NEGOTIATION BRIDGE] ⚠️ Pipeline no inicializado');
      return this.getDefaultOffer(params);
    }

    try {
      // NegotiationService usa computeOffer() como método principal
      // Mapear startPrice a basePrice si es necesario
      const negotiationParams = {
        propertyId: params.propertyId,
        basePrice: params.basePrice || params.startPrice,
        channel: params.channel,
        date: params.date,
        guests: params.guests
      };
      
      const offer = await this.negotiationPipeline.computeOffer(negotiationParams);
      
      logger.info(`[NEGOTIATION BRIDGE] ✅ Oferta calculada: ${offer.suggestedOffer || offer.finalPrice}€ (minNegotiable: ${offer.minNegotiable})`);
      return offer;
    } catch (error) {
      logger.error('[NEGOTIATION BRIDGE] ❌ Error calculando oferta:', error);
      return this.getDefaultOffer(params);
    }
  }

  /**
   * Oferta por defecto si el pipeline no está disponible
   */
  getDefaultOffer(params) {
    const { startPrice, season, channel } = params;
    
    // Lógica básica de descuento
    let discount = 0;
    if (season === 'low') discount = 10;
    else if (season === 'medium') discount = 5;
    
    if (channel === 'direct') discount += 5;
    else if (channel === 'phone') discount += 3;
    
    const finalPrice = startPrice * (1 - discount / 100);
    
    return {
      startPrice,
      finalPrice: Math.round(finalPrice * 100) / 100,
      discount,
      currency: 'EUR',
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 horas
    };
  }

  /**
   * Registrar negociación en Neon
   * @param {string} sessionId - ID de sesión
   * @param {string} propertyId - ID de propiedad
   * @param {Object} negotiationData - Datos de negociación
   */
  async logNegotiation(sessionId, propertyId, negotiationData) {
    // Esta función se conectará con neon-service para guardar en negotiation_logs
    // Por ahora es un placeholder
    logger.info(`[NEGOTIATION BRIDGE] 📝 Negociación registrada para sesión ${sessionId}`);
  }
}

export default NegotiationBridge;
