/**
 * Voice Functions - Funciones disponibles para el prompt de voz
 * checkAvailability y bookAccommodation para uso en conversaciones
 */

import logger from '../utils/logger.js';

class VoiceFunctions {
  constructor(services) {
    this.bridgeDataService = services.bridgeDataService;
    this.priceCalendarService = services.priceCalendarService;
    this.neonService = services.neonService;
    this.negotiationBridge = services.negotiationBridge;
  }

  /**
   * Verificar disponibilidad y precio de una propiedad
   * Función para usar en el prompt de voz
   * @param {string} propertyId - ID de la propiedad (cabanal, montanejos)
   * @param {string} checkIn - Fecha check-in (YYYY-MM-DD)
   * @param {string} checkOut - Fecha check-out (YYYY-MM-DD)
   * @param {number} guests - Número de huéspedes
   * @returns {Promise<Object>} Disponibilidad y precio
   */
  async checkAvailability(propertyId, checkIn, checkOut, guests = 2) {
    try {
      logger.info(`[VOICE FUNCTIONS] 🔍 Consultando disponibilidad: ${propertyId} (${checkIn} - ${checkOut})`);

      // 1. Verificar disponibilidad desde BridgeData (SOLO disponibilidad)
      const availability = await this.bridgeDataService.checkAvailability(propertyId, checkIn, checkOut);
      
      if (!availability.available) {
        return {
          available: false,
          message: `Lo siento, ${propertyId} no está disponible para esas fechas. ¿Te gustaría consultar otras fechas o el otro alojamiento?`
        };
      }

      // 2. Calcular precio con descuento OTA desde Price Calendar
      const priceInfo = await this.priceCalendarService.getPriceForDateRange(propertyId, checkIn, checkOut);
      
      if (!priceInfo) {
        return {
          available: true,
          message: `${propertyId} está disponible, pero no puedo calcular el precio en este momento.`
        };
      }

      // 3. Formatear respuesta para Sandra
      const totalPrice = priceInfo.totalPriceWithDiscount;
      const averagePricePerNight = Math.round(totalPrice / priceInfo.nights);
      
      return {
        available: true,
        propertyId,
        checkIn,
        checkOut,
        nights: priceInfo.nights,
        guests,
        totalPrice,
        averagePricePerNight,
        currency: 'EUR',
        discount: priceInfo.averageDiscount,
        message: `${propertyId} está disponible para ${priceInfo.nights} noches. Precio total: ${totalPrice}€ (${averagePricePerNight}€/noche) con descuento OTA del ${priceInfo.averageDiscount}%.`
      };
    } catch (error) {
      logger.error('[VOICE FUNCTIONS] Error en checkAvailability:', error);
      return {
        available: false,
        message: 'Lo siento, hubo un error consultando la disponibilidad. ¿Puedes repetir las fechas?'
      };
    }
  }

  /**
   * Reservar alojamiento
   * Función para usar en el prompt de voz
   * @param {string} propertyId - ID de la propiedad
   * @param {string} checkIn - Fecha check-in
   * @param {string} checkOut - Fecha check-out
   * @param {number} guests - Número de huéspedes
   * @param {number} finalPrice - Precio final acordado
   * @param {string} sessionId - Session ID para registrar
   * @param {string} userName - Nombre del usuario
   * @returns {Promise<Object>} Resultado de la reserva
   */
  async bookAccommodation(propertyId, checkIn, checkOut, guests, finalPrice, sessionId, userName) {
    try {
      logger.info(`[VOICE FUNCTIONS] 📅 Reservando: ${propertyId} (${checkIn} - ${checkOut}) por ${finalPrice}€`);

      // 1. Verificar disponibilidad una vez más
      const availability = await this.bridgeDataService.checkAvailability(propertyId, checkIn, checkOut);
      
      if (!availability.available) {
        return {
          success: false,
          message: `Lo siento, ${propertyId} ya no está disponible para esas fechas. ¿Te gustaría consultar otras fechas?`
        };
      }

      // 2. Bloquear fechas en la base de datos (marcar como no disponible)
      await this.neonService.updatePropertyAvailability({
        property_id: propertyId,
        check_in: checkIn,
        check_out: checkOut,
        is_available: false,
        last_checked: new Date().toISOString()
      });

      // 3. Registrar reserva en call_logs
      const callLog = await this.neonService.updateCallLogConversation(sessionId, {
        bookingDetails: {
          property_id: propertyId,
          check_in: checkIn,
          check_out: checkOut,
          guests: guests,
          price: finalPrice,
          status: 'confirmed',
          booked_at: new Date().toISOString()
        }
      });

      // 4. Si hubo negociación, registrar en negotiation_logs
      if (this.negotiationBridge) {
        // TODO: Obtener datos de negociación del contexto si existen
        await this.neonService.saveNegotiationLog({
          call_id: sessionId,
          session_id: sessionId,
          property_id: propertyId,
          initial_price: finalPrice, // TODO: Obtener precio inicial del contexto
          offered_price: finalPrice,
          result: 'accepted'
        });
      }

      return {
        success: true,
        propertyId,
        checkIn,
        checkOut,
        guests,
        finalPrice,
        bookingId: `BOOK_${Date.now()}`,
        message: `¡Reserva confirmada! ${propertyId} del ${checkIn} al ${checkOut} para ${guests} huéspedes por ${finalPrice}€. Te enviaremos los detalles por email.`
      };
    } catch (error) {
      logger.error('[VOICE FUNCTIONS] Error en bookAccommodation:', error);
      return {
        success: false,
        message: 'Lo siento, hubo un error procesando la reserva. ¿Puedes intentar de nuevo?'
      };
    }
  }

  /**
   * Obtener descripción de funciones para el prompt
   */
  getFunctionsDescription() {
    return `
FUNCIONES DISPONIBLES:

1. checkAvailability(propertyId, checkIn, checkOut, guests)
   - Verifica disponibilidad y calcula precio con descuento OTA
   - propertyId: "cabanal" o "montanejos"
   - checkIn: fecha YYYY-MM-DD
   - checkOut: fecha YYYY-MM-DD
   - guests: número de huéspedes (opcional, default: 2)
   - Retorna: { available, totalPrice, averagePricePerNight, message }

2. bookAccommodation(propertyId, checkIn, checkOut, guests, finalPrice, sessionId, userName)
   - Confirma una reserva y bloquea las fechas
   - propertyId: "cabanal" o "montanejos"
   - checkIn: fecha YYYY-MM-DD
   - checkOut: fecha YYYY-MM-DD
   - guests: número de huéspedes
   - finalPrice: precio final acordado
   - sessionId: ID de sesión actual
   - userName: nombre del usuario
   - Retorna: { success, bookingId, message }

INSTRUCCIONES DE USO:
- Usa checkAvailability cuando el usuario pregunta por disponibilidad o precios
- Usa bookAccommodation cuando el usuario confirma que quiere reservar
- Siempre verifica disponibilidad antes de confirmar una reserva
- Presenta los precios con el descuento OTA ya aplicado
    `.trim();
  }
}

export default VoiceFunctions;
