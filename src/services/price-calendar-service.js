/**
 * Price Calendar Service - Gestión de precios por temporada y festivos
 * Genera calendario anual de tarifas base con descuentos OTA y festivos
 */

import logger from '../utils/logger.js';
import NeonService from './neon-service.js';

class PriceCalendarService {
  constructor() {
    this.neonService = null;
    this.otaDiscount = parseFloat(process.env.OTA_DISCOUNT_PERCENT || '10'); // 10% por defecto
    this.maxDiscount = parseFloat(process.env.MAX_DISCOUNT_PERCENT || '18'); // Máximo 18%
    this.festiveDays = this.getFestiveDaysValencia(); // Festivos Comunidad Valenciana
  }

  /**
   * Inicializar servicio con Neon DB
   */
  async initialize(neonService) {
    this.neonService = neonService;
    logger.info(`[PRICE CALENDAR] ✅ Servicio inicializado (Descuento OTA: ${this.otaDiscount}%, Máximo: ${this.maxDiscount}%)`);
  }

  /**
   * Festivos de la Comunidad Valenciana 2024-2025
   */
  getFestiveDaysValencia() {
    const festivos = [
      // 2024
      '2024-01-01', // Año Nuevo
      '2024-01-06', // Reyes
      '2024-03-19', // San José (Comunidad Valenciana)
      '2024-03-28', // Jueves Santo
      '2024-03-29', // Viernes Santo
      '2024-04-01', // Lunes de Pascua
      '2024-05-01', // Día del Trabajador
      '2024-10-09', // Día de la Comunidad Valenciana
      '2024-10-12', // Día de la Hispanidad
      '2024-11-01', // Todos los Santos
      '2024-12-06', // Día de la Constitución
      '2024-12-25', // Navidad
      // 2025
      '2025-01-01', // Año Nuevo
      '2025-01-06', // Reyes
      '2025-03-19', // San José
      '2025-04-18', // Jueves Santo
      '2025-04-19', // Viernes Santo
      '2025-04-21', // Lunes de Pascua
      '2025-05-01', // Día del Trabajador
      '2025-10-09', // Día de la Comunidad Valenciana
      '2025-10-12', // Día de la Hispanidad
      '2025-11-01', // Todos los Santos
      '2025-12-06', // Día de la Constitución
      '2025-12-25', // Navidad
    ];
    return festivos;
  }

  /**
   * Verificar si una fecha es festiva
   */
  isFestive(date) {
    const dateStr = typeof date === 'string' ? date.split('T')[0] : date.toISOString().split('T')[0];
    return this.festiveDays.includes(dateStr);
  }

  /**
   * Determinar temporada (alta/media/baja)
   */
  getSeason(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    const month = d.getMonth() + 1; // 1-12
    
    // Temporada alta: julio, agosto
    if (month === 7 || month === 8) return 'high';
    // Temporada media: junio, septiembre
    if (month === 6 || month === 9) return 'medium';
    // Temporada baja: resto
    return 'low';
  }

  /**
   * Calcular precio base según temporada
   * @param {string} propertyId - ID de la propiedad
   * @param {string} date - Fecha (YYYY-MM-DD)
   * @returns {number} Precio base
   */
  async getBasePrice(propertyId, date) {
    try {
      // Obtener precio base de la propiedad desde Neon
      const property = await this.neonService.getPropertyAvailability(propertyId);
      
      if (!property || !property.pricing_data) {
        // Precios por defecto si no hay en BD
        const defaultPrices = {
          'cabanal': { high: 100, medium: 85, low: 70 },
          'montanejos': { high: 150, medium: 130, low: 110 },
          'default': { high: 120, medium: 100, low: 80 }
        };
        
        const season = this.getSeason(date);
        const prices = defaultPrices[propertyId.toLowerCase()] || defaultPrices.default;
        return prices[season];
      }

      const pricingData = typeof property.pricing_data === 'string'
        ? JSON.parse(property.pricing_data)
        : property.pricing_data;

      const season = this.getSeason(date);
      const basePrice = pricingData[`base_${season}`] || pricingData.base_price || 100;

      // Ajuste por festivo (+20% en festivos)
      if (this.isFestive(date)) {
        return Math.round(basePrice * 1.2);
      }

      return basePrice;
    } catch (error) {
      logger.error('[PRICE CALENDAR] Error calculando precio base:', error);
      return 100; // Fallback
    }
  }

  /**
   * Calcular precio con descuento OTA
   * @param {string} propertyId - ID de la propiedad
   * @param {string} date - Fecha (YYYY-MM-DD)
   * @param {number} additionalDiscount - Descuento adicional (0-8%)
   * @returns {Object} Precio con descuento y detalles
   */
  async getPriceWithDiscount(propertyId, date, additionalDiscount = 0) {
    try {
      const basePrice = await this.getBasePrice(propertyId, date);
      const isFestive = this.isFestive(date);
      
      // Descuento total (OTA + adicional)
      const totalDiscount = Math.min(this.otaDiscount + additionalDiscount, this.maxDiscount);
      
      // En festivos, reducir descuento a la mitad
      const finalDiscount = isFestive ? totalDiscount / 2 : totalDiscount;
      
      const priceWithDiscount = Math.round(basePrice * (1 - finalDiscount / 100));
      
      return {
        basePrice,
        otaDiscount: this.otaDiscount,
        additionalDiscount,
        totalDiscount: finalDiscount,
        priceWithDiscount,
        isFestive,
        season: this.getSeason(date),
        currency: 'EUR'
      };
    } catch (error) {
      logger.error('[PRICE CALENDAR] Error calculando precio con descuento:', error);
      return null;
    }
  }

  /**
   * Generar calendario anual de precios para una propiedad
   * @param {string} propertyId - ID de la propiedad
   * @param {number} year - Año (2024 o 2025)
   */
  async generateAnnualCalendar(propertyId, year = new Date().getFullYear()) {
    try {
      logger.info(`[PRICE CALENDAR] 📅 Generando calendario ${year} para ${propertyId}...`);
      
      const calendar = {};
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);
      
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const priceInfo = await this.getPriceWithDiscount(propertyId, dateStr);
        
        calendar[dateStr] = {
          date: dateStr,
          price_base: priceInfo.basePrice,
          price_with_discount: priceInfo.priceWithDiscount,
          is_festive: priceInfo.isFestive,
          season: priceInfo.season,
          discount_percent: priceInfo.totalDiscount
        };
      }

      // Guardar en Neon DB
      await this.saveCalendarToNeon(propertyId, year, calendar);
      
      logger.info(`[PRICE CALENDAR] ✅ Calendario ${year} generado para ${propertyId}`);
      return calendar;
    } catch (error) {
      logger.error('[PRICE CALENDAR] Error generando calendario:', error);
      return null;
    }
  }

  /**
   * Guardar calendario en Neon DB
   */
  async saveCalendarToNeon(propertyId, year, calendar) {
    try {
      const property = await this.neonService.getPropertyAvailability(propertyId);
      
      const pricingData = property?.pricing_data 
        ? (typeof property.pricing_data === 'string' ? JSON.parse(property.pricing_data) : property.pricing_data)
        : {};

      pricingData[`calendar_${year}`] = calendar;
      pricingData.last_calendar_update = new Date().toISOString();

      await this.neonService.updatePropertyAvailability({
        property_id: propertyId,
        pricing_data: pricingData
      });

      logger.info(`[PRICE CALENDAR] ✅ Calendario guardado en Neon para ${propertyId}`);
    } catch (error) {
      logger.error('[PRICE CALENDAR] Error guardando calendario:', error);
    }
  }

  /**
   * Actualizar descuento OTA
   */
  setOtaDiscount(percent) {
    if (percent < 0 || percent > this.maxDiscount) {
      logger.warn(`[PRICE CALENDAR] ⚠️ Descuento ${percent}% fuera de rango (0-${this.maxDiscount}%)`);
      return false;
    }
    this.otaDiscount = percent;
    logger.info(`[PRICE CALENDAR] ✅ Descuento OTA actualizado a ${percent}%`);
    return true;
  }

  /**
   * Obtener precio para rango de fechas
   */
  async getPriceForDateRange(propertyId, checkIn, checkOut) {
    try {
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
      
      let totalBase = 0;
      let totalWithDiscount = 0;
      const dates = [];

      for (let d = new Date(checkInDate); d < checkOutDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const priceInfo = await this.getPriceWithDiscount(propertyId, dateStr);
        
        totalBase += priceInfo.basePrice;
        totalWithDiscount += priceInfo.priceWithDiscount;
        dates.push({
          date: dateStr,
          ...priceInfo
        });
      }

      return {
        propertyId,
        checkIn,
        checkOut,
        nights,
        totalBasePrice: totalBase,
        totalPriceWithDiscount: totalWithDiscount,
        averageDiscount: ((totalBase - totalWithDiscount) / totalBase * 100).toFixed(1),
        dates,
        currency: 'EUR'
      };
    } catch (error) {
      logger.error('[PRICE CALENDAR] Error calculando precio para rango:', error);
      return null;
    }
  }
}

export default PriceCalendarService;
