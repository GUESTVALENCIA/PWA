/**
 * Twilio Service - Integración con Twilio API para WhatsApp y llamadas
 */

import logger from '../utils/logger.js';
import twilio from 'twilio';

class TwilioService {
  constructor() {
    // Credenciales de Twilio desde variables de entorno
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN || process.env.TWILIO_TOKEN;
    this.apiKeySid = process.env.TWILIO_API_KEY_SID;
    this.apiKeySecret = process.env.TWILIO_API_KEY_SECRET;
    this.whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || process.env.WHATSAPP_SANDRA;
    this.testNumber = process.env.TWILIO_TEST_NUMBER;

    // Inicializar cliente de Twilio
    if (this.accountSid && this.authToken) {
      try {
        this.client = twilio(this.accountSid, this.authToken);
        this.isConfigured = true;
        logger.info('[TWILIO SERVICE] ✅ Twilio configurado correctamente');
      } catch (error) {
        logger.error('[TWILIO SERVICE] ❌ Error inicializando Twilio:', error);
        this.isConfigured = false;
        this.client = null;
      }
    } else {
      logger.warn('[TWILIO SERVICE] ⚠️ Credenciales de Twilio no configuradas');
      this.isConfigured = false;
      this.client = null;
    }
  }

  /**
   * Verificar si el servicio está configurado
   */
  isAvailable() {
    return this.isConfigured && this.client !== null;
  }

  /**
   * Enviar mensaje de WhatsApp
   * @param {string} to - Número de destino (formato: whatsapp:+34624020085)
   * @param {string} message - Mensaje a enviar
   * @returns {Promise<Object>} Resultado del envío
   */
  async sendMessage(to, message) {
    if (!this.isAvailable()) {
      throw new Error('Twilio no está configurado');
    }

    try {
      // Asegurar formato whatsapp: si no lo tiene
      const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
      const from = this.whatsappNumber 
        ? (this.whatsappNumber.startsWith('whatsapp:') ? this.whatsappNumber : `whatsapp:${this.whatsappNumber}`)
        : 'whatsapp:+34624829117'; // Número por defecto de Sandra

      const result = await this.client.messages.create({
        from: from,
        to: formattedTo,
        body: message
      });

      logger.info(`[TWILIO SERVICE] 💬 Mensaje WhatsApp enviado: ${formattedTo}`, {
        sid: result.sid,
        status: result.status
      });

      return {
        success: true,
        sid: result.sid,
        status: result.status,
        to: formattedTo,
        from: from
      };
    } catch (error) {
      logger.error('[TWILIO SERVICE] Error enviando mensaje WhatsApp:', error);
      throw error;
    }
  }

  /**
   * Iniciar llamada de voz
   * @param {string} to - Número de destino (formato: +34624020085)
   * @param {string} script - Script de voz (opcional)
   * @param {string} from - Número de origen (opcional, usa test number por defecto)
   * @returns {Promise<Object>} Resultado de la llamada
   */
  async initiateCall(to, script = null, from = null) {
    if (!this.isAvailable()) {
      throw new Error('Twilio no está configurado');
    }

    try {
      const callFrom = from || this.testNumber || '+18577608754';
      
      // URL del webhook para la llamada (Twilio llama a esta URL cuando se conecta)
      const twimlUrl = process.env.TWILIO_TWIML_URL || 
                      `${process.env.MCP_SERVER_URL || 'https://pwa-imbf.onrender.com'}/api/twilio/voice`;

      const callParams = {
        to: to,
        from: callFrom,
        url: twimlUrl,
        method: 'POST'
      };

      // Si hay script, añadirlo como parámetro
      if (script) {
        callParams.statusCallback = `${twimlUrl}?script=${encodeURIComponent(script)}`;
      }

      const call = await this.client.calls.create(callParams);

      logger.info(`[TWILIO SERVICE] 📞 Llamada iniciada: ${to}`, {
        sid: call.sid,
        status: call.status,
        from: callFrom
      });

      return {
        success: true,
        sid: call.sid,
        status: call.status,
        to: to,
        from: callFrom
      };
    } catch (error) {
      logger.error('[TWILIO SERVICE] Error iniciando llamada:', error);
      throw error;
    }
  }

  /**
   * Enviar mensaje de WhatsApp con media (imagen, video, etc.)
   * @param {string} to - Número de destino
   * @param {string} message - Mensaje de texto
   * @param {string} mediaUrl - URL del media
   * @returns {Promise<Object>} Resultado del envío
   */
  async sendMessageWithMedia(to, message, mediaUrl) {
    if (!this.isAvailable()) {
      throw new Error('Twilio no está configurado');
    }

    try {
      const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
      const from = this.whatsappNumber 
        ? (this.whatsappNumber.startsWith('whatsapp:') ? this.whatsappNumber : `whatsapp:${this.whatsappNumber}`)
        : 'whatsapp:+34624829117';

      const result = await this.client.messages.create({
        from: from,
        to: formattedTo,
        body: message,
        mediaUrl: [mediaUrl]
      });

      logger.info(`[TWILIO SERVICE] 📷 Mensaje con media enviado: ${formattedTo}`);

      return {
        success: true,
        sid: result.sid,
        status: result.status
      };
    } catch (error) {
      logger.error('[TWILIO SERVICE] Error enviando mensaje con media:', error);
      throw error;
    }
  }

  /**
   * Verificar estado de un mensaje
   * @param {string} messageSid - SID del mensaje
   * @returns {Promise<Object>} Estado del mensaje
   */
  async getMessageStatus(messageSid) {
    if (!this.isAvailable()) {
      throw new Error('Twilio no está configurado');
    }

    try {
      const message = await this.client.messages(messageSid).fetch();
      return {
        sid: message.sid,
        status: message.status,
        to: message.to,
        from: message.from,
        body: message.body,
        dateSent: message.dateSent
      };
    } catch (error) {
      logger.error('[TWILIO SERVICE] Error obteniendo estado de mensaje:', error);
      throw error;
    }
  }
}

export default TwilioService;
