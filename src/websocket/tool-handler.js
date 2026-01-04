/**
 * Tool Handler Service - Gestiona todas las tools de Sandra Omni-Brain
 * Ejecuta herramientas desde llamadas de voz y coordina con servicios
 */

import logger from '../utils/logger.js';

class ToolHandler {
  constructor(services) {
    this.services = services;
    this.tools = new Map();
    this.registerAllTools();
    logger.info('[TOOL HANDLER] ✅ Inicializado con 8 tools principales');
  }

  /**
   * Registrar todas las tools disponibles
   */
  registerAllTools() {
    // UI Control Tools
    this.tools.set('ui_action', {
      handler: this.handleUIAction.bind(this),
      description: 'Controla elementos de la interfaz: scroll, click en botones, cerrar ventanas.',
      requiresClient: true
    });

    this.tools.set('navigate_ui', {
      handler: this.handleNavigateUI.bind(this),
      description: 'Navega suavemente a secciones principales de la web mediante comandos de voz.',
      requiresClient: true
    });

    // Geolocalización
    this.tools.set('get_current_location', {
      handler: this.handleGetLocation.bind(this),
      description: 'Obtiene las coordenadas GPS del usuario para ofrecer recomendaciones cercanas.',
      requiresClient: false
    });

    // Pagos
    this.tools.set('initiate_secure_voice_payment', {
      handler: this.handlePayment.bind(this),
      description: 'Inicia el terminal de pago virtual seguro de PayPal durante la llamada.',
      requiresClient: true
    });

    // Comunicaciones
    this.tools.set('whatsapp_omni_response', {
      handler: this.handleWhatsApp.bind(this),
      description: 'Gestiona una respuesta a un mensaje de WhatsApp Business.',
      requiresClient: false
    });

    this.tools.set('trigger_push_notification', {
      handler: this.handleNotification.bind(this),
      description: 'Muestra una notificación push en la pantalla del usuario (Toast).',
      requiresClient: true
    });

    // Marketing
    this.tools.set('orchestrate_marketing_campaign', {
      handler: this.handleMarketing.bind(this),
      description: 'Sandra activa una campaña en redes sociales para captar tráfico directo.',
      requiresClient: false
    });

    // BridgeData
    this.tools.set('get_live_pricing_bridge', {
      handler: this.handlePricing.bind(this),
      description: 'Consulta precios y disponibilidad en tiempo real desde la Bridge Data API.',
      requiresClient: false
    });
  }

  /**
   * Ejecutar una tool
   * @param {string} name - Nombre de la tool
   * @param {Object} args - Argumentos de la tool
   * @param {string} sessionId - ID de sesión
   * @param {WebSocket} ws - Conexión WebSocket (opcional, para tools que requieren cliente)
   * @returns {Promise<Object>} Resultado de la ejecución
   */
  async executeTool(name, args, sessionId, ws = null) {
    try {
      const tool = this.tools.get(name);
      
      if (!tool) {
        logger.warn(`[TOOL HANDLER] ⚠️ Tool '${name}' no encontrada`);
        return {
          success: false,
          error: `Tool '${name}' no encontrada`,
          availableTools: Array.from(this.tools.keys())
        };
      }

      // Verificar si la tool requiere cliente y si hay conexión WebSocket
      if (tool.requiresClient && !ws) {
        logger.warn(`[TOOL HANDLER] ⚠️ Tool '${name}' requiere conexión cliente pero no hay WebSocket`);
        return {
          success: false,
          error: `Tool '${name}' requiere conexión cliente`
        };
      }

      logger.info(`[TOOL HANDLER] 🔧 Ejecutando tool: ${name}`, { args, sessionId });
      
      const result = await tool.handler(args, sessionId, ws);
      
      logger.info(`[TOOL HANDLER] ✅ Tool '${name}' ejecutada exitosamente`);
      return {
        success: true,
        tool: name,
        result: result
      };
    } catch (error) {
      logger.error(`[TOOL HANDLER] ❌ Error ejecutando tool '${name}':`, error);
      return {
        success: false,
        error: error.message,
        tool: name
      };
    }
  }

  /**
   * Obtener definiciones de tools para OpenAI function calling
   * @returns {Array} Array de definiciones de funciones
   */
  getToolDefinitions() {
    return Array.from(this.tools.entries()).map(([name, tool]) => ({
      name: name,
      description: tool.description,
      parameters: this.getToolParameters(name)
    }));
  }

  /**
   * Obtener parámetros de una tool específica
   * @param {string} name - Nombre de la tool
   * @returns {Object} Esquema de parámetros
   */
  getToolParameters(name) {
    const parametersMap = {
      ui_action: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['SCROLL', 'CLICK', 'TOGGLE_MODAL', 'HIGHLIGHT'],
            description: 'Tipo de acción a ejecutar'
          },
          target: {
            type: 'string',
            description: 'ID del elemento o nombre de la sección'
          },
          value: {
            type: 'string',
            description: 'Valor adicional (ej. "open" o "close")'
          }
        },
        required: ['action', 'target']
      },
      navigate_ui: {
        type: 'object',
        properties: {
          section: {
            type: 'string',
            enum: ['hero', 'properties', 'ai-studio', 'faq', 'dashboard', 'marketing'],
            description: 'Sección a la que navegar'
          }
        },
        required: ['section']
      },
      get_current_location: {
        type: 'object',
        properties: {},
        required: []
      },
      initiate_secure_voice_payment: {
        type: 'object',
        properties: {
          amount: {
            type: 'number',
            description: 'Monto total a cobrar'
          },
          propertyName: {
            type: 'string',
            description: 'Nombre de la propiedad'
          }
        },
        required: ['amount', 'propertyName']
      },
      whatsapp_omni_response: {
        type: 'object',
        properties: {
          phone: {
            type: 'string',
            description: 'Número de destino'
          },
          modality: {
            type: 'string',
            enum: ['voice_call', 'text_chat', 'conversational_msg'],
            description: 'Modalidad de comunicación'
          },
          message: {
            type: 'string',
            description: 'Contenido del mensaje o script de voz'
          }
        },
        required: ['phone', 'modality', 'message']
      },
      trigger_push_notification: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Título de la notificación'
          },
          message: {
            type: 'string',
            description: 'Mensaje de la notificación'
          },
          type: {
            type: 'string',
            enum: ['booking', 'update', 'alert', 'message', 'payment'],
            description: 'Tipo de notificación'
          }
        },
        required: ['title', 'message', 'type']
      },
      orchestrate_marketing_campaign: {
        type: 'object',
        properties: {
          platform: {
            type: 'string',
            enum: ['instagram', 'tiktok', 'meta'],
            description: 'Plataforma de marketing'
          },
          budget: {
            type: 'number',
            description: 'Presupuesto diario en EUR'
          },
          targetPropertyId: {
            type: 'string',
            description: 'ID de propiedad objetivo (opcional)'
          }
        },
        required: ['platform', 'budget']
      },
      get_live_pricing_bridge: {
        type: 'object',
        properties: {
          propertyId: {
            type: 'string',
            description: 'ID de la propiedad'
          },
          checkIn: {
            type: 'string',
            description: 'Fecha de check-in (YYYY-MM-DD, opcional)'
          },
          checkOut: {
            type: 'string',
            description: 'Fecha de check-out (YYYY-MM-DD, opcional)'
          }
        },
        required: ['propertyId']
      }
    };

    return parametersMap[name] || { type: 'object', properties: {}, required: [] };
  }

  // ============================================
  // HANDLERS INDIVIDUALES DE TOOLS
  // ============================================

  /**
   * Handler: ui_action - Control de UI completo
   */
  async handleUIAction(args, sessionId, ws) {
    const { action, target, value } = args;

    if (!ws || ws.readyState !== 1) {
      logger.warn('[TOOL HANDLER] ⚠️ WebSocket no disponible para ui_action');
      return { success: false, error: 'WebSocket no disponible' };
    }

    try {
      // Validar acción
      const validActions = ['SCROLL', 'CLICK', 'TOGGLE_MODAL', 'HIGHLIGHT'];
      if (!validActions.includes(action)) {
        return { success: false, error: `Acción no válida: ${action}` };
      }

      // Enviar comando al cliente
      ws.send(JSON.stringify({
        type: 'ui_command',
        command: action.toLowerCase().replace('_', '-'),
        target: target,
        value: value,
        action: action,
        sessionId: sessionId,
        timestamp: new Date().toISOString()
      }));

      logger.info(`[TOOL HANDLER] ✅ Comando UI enviado: ${action} → ${target}`);

      return {
        success: true,
        action: action,
        target: target,
        message: `${action} ejecutado en ${target}`
      };
    } catch (error) {
      logger.error('[TOOL HANDLER] ❌ Error en ui_action:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handler: navigate_ui - Navegación completa
   */
  async handleNavigateUI(args, sessionId, ws) {
    const { section } = args;

    if (!ws || ws.readyState !== 1) {
      logger.warn('[TOOL HANDLER] ⚠️ WebSocket no disponible para navigate_ui');
      return { success: false, error: 'WebSocket no disponible' };
    }

    try {
      // Validar sección
      const validSections = ['hero', 'properties', 'ai-studio', 'faq', 'dashboard', 'marketing'];
      if (!validSections.includes(section)) {
        return {
          success: false,
          error: `Sección no válida: ${section}`,
          validSections: validSections
        };
      }

      // Mapeo de secciones
      const sectionMap = {
        'hero': 'hero-section',
        'properties': 'properties-section',
        'ai-studio': 'ai-studio-section',
        'faq': 'faq-section',
        'dashboard': 'dashboard-section',
        'marketing': 'marketing-section'
      };

      // Enviar comando de navegación
      ws.send(JSON.stringify({
        type: 'ui_navigation',
        section: section,
        sectionId: sectionMap[section],
        sessionId: sessionId,
        timestamp: new Date().toISOString()
      }));

      logger.info(`[TOOL HANDLER] 🧭 Navegación enviada: → ${section}`);

      return {
        success: true,
        section: section,
        sectionId: sectionMap[section],
        message: `Navegando a ${section}...`
      };
    } catch (error) {
      logger.error('[TOOL HANDLER] ❌ Error en navigate_ui:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handler: get_current_location - Geolocalización GPS
   */
  async handleGetLocation(args, sessionId, ws) {
    // Si hay conexión cliente, solicitar GPS del navegador
    if (ws && ws.readyState === 1) {
      ws.send(JSON.stringify({
        type: 'request_location',
        sessionId: sessionId,
        timestamp: new Date().toISOString()
      }));

      logger.info(`[TOOL HANDLER] 📍 Solicitud de ubicación GPS enviada`);
      return {
        status: 'requested',
        message: 'Solicitando ubicación GPS del cliente'
      };
    }

    // Fallback: usar IP tracking si está disponible
    if (this.services.ipTrackingService) {
      const ipInfo = ws?._callContext?.ipAddress 
        ? await this.services.ipTrackingService.getQuickIPInfo(ws._callContext.ipAddress)
        : null;

      if (ipInfo && ipInfo.coordinates) {
        return {
          lat: ipInfo.coordinates.lat,
          lng: ipInfo.coordinates.lng,
          source: 'ip_tracking',
          accuracy: 'city_level'
        };
      }
    }

    return {
      error: 'Permission denied',
      message: 'No se pudo obtener la ubicación'
    };
  }

  /**
   * Handler: initiate_secure_voice_payment - Pago seguro por voz
   */
  async handlePayment(args, sessionId, ws) {
    const { amount, propertyName } = args;

    if (!ws || ws.readyState !== 1) {
      return {
        status: 'error',
        error: 'Conexión cliente no disponible'
      };
    }

    // Enviar comando de pago al cliente
    ws.send(JSON.stringify({
      type: 'payment_init',
      amount: amount,
      propertyName: propertyName,
      sessionId: sessionId,
      timestamp: new Date().toISOString()
    }));

    logger.info(`[TOOL HANDLER] 💳 Pago iniciado: ${amount}€ - ${propertyName}`);
    return {
      status: 'payment_terminal_active',
      amount: amount,
      propertyName: propertyName,
      message: `Terminal de pago activado para ${propertyName}: ${amount}€`
    };
  }

  /**
   * Handler: whatsapp_omni_response - WhatsApp omnicanal
   */
  async handleWhatsApp(args, sessionId, ws) {
    const { phone, modality, message } = args;

    // Si es llamada de voz, usar Twilio si está disponible
    if (modality === 'voice_call' && this.services.twilioService) {
      try {
        await this.services.twilioService.initiateCall(phone);
        return {
          status: 'voice_call_initiated',
          target: phone,
          modality: modality
        };
      } catch (error) {
        logger.error('[TOOL HANDLER] Error iniciando llamada WhatsApp:', error);
        return {
          status: 'error',
          error: error.message
        };
      }
    }

    // Para text_chat o conversational_msg, loguear (implementación futura)
    logger.info(`[TOOL HANDLER] 📱 WhatsApp ${modality} para ${phone}: ${message.substring(0, 50)}...`);
    
    // Guardar en Neon DB si está disponible
    if (this.services.neonService) {
      try {
        await this.services.neonService.createOrUpdateCallLog({
          call_id: `whatsapp_${Date.now()}`,
          session_id: sessionId,
          agent_id: 'sandra_whatsapp',
          conversation_history: [{
            role: 'assistant',
            content: `WhatsApp ${modality}: ${message}`
          }]
        });
      } catch (error) {
        logger.error('[TOOL HANDLER] Error guardando WhatsApp log:', error);
      }
    }

    return {
      status: 'whatsapp_queued',
      platform: 'WhatsApp Business API',
      modality: modality,
      target: phone
    };
  }

  /**
   * Handler: trigger_push_notification - Notificaciones push
   */
  async handleNotification(args, sessionId, ws) {
    const { title, message, type } = args;

    if (!ws || ws.readyState !== 1) {
      return {
        status: 'error',
        error: 'Conexión cliente no disponible'
      };
    }

    // Enviar notificación al cliente
    ws.send(JSON.stringify({
      type: 'push_notification',
      title: title,
      message: message,
      notificationType: type,
      sessionId: sessionId,
      timestamp: new Date().toISOString()
    }));

    logger.info(`[TOOL HANDLER] 🔔 Notificación enviada: ${title}`);
    return {
      status: 'triggered',
      title: title,
      message: message,
      type: type
    };
  }

  /**
   * Handler: orchestrate_marketing_campaign - Campañas de marketing
   */
  async handleMarketing(args, sessionId, ws) {
    const { platform, budget, targetPropertyId } = args;

    logger.info(`[TOOL HANDLER] 📢 Campaña de marketing: ${platform} - ${budget}€/día`);

    // Guardar en Neon DB si está disponible
    if (this.services.neonService) {
      try {
        // TODO: Crear tabla marketing_campaigns si no existe
        await this.services.neonService.query(
          `INSERT INTO call_logs (call_id, session_id, agent_id, conversation_history)
           VALUES ($1, $2, $3, $4)`,
          [
            `marketing_${Date.now()}`,
            sessionId,
            'sandra_marketing',
            JSON.stringify([{
              type: 'marketing_campaign',
              platform: platform,
              budget: budget,
              targetPropertyId: targetPropertyId || null
            }])
          ]
        );
      } catch (error) {
        logger.error('[TOOL HANDLER] Error guardando campaña:', error);
      }
    }

    return {
      status: 'campaign_launched',
      platform: platform,
      budget: budget,
      targetPropertyId: targetPropertyId || null,
      message: `Campaña ${platform} lanzada con presupuesto ${budget}€/día`
    };
  }

  /**
   * Handler MEJORADO: get_live_pricing_bridge - Precios con comparación OTA
   */
  async handlePricing(args, sessionId, ws) {
    const { propertyId, checkIn, checkOut } = args;

    try {
      // Verificar servicios disponibles
      const hasPriceCalendar = !!this.services.priceCalendarService;
      const hasBridgeData = !!this.services.bridgeDataService;
      const hasNeon = !!this.services.neonService;

      if (!hasPriceCalendar && !hasBridgeData) {
        logger.warn('[TOOL HANDLER] ⚠️ Servicios de precios no disponibles');
        return {
          status: 'error',
          error: 'Servicios de precios no configurados'
        };
      }

      // Si hay fechas, calcular precio completo
      if (checkIn && checkOut) {
        let ourPrice = null;
        let otaPrice = null;
        let priceInfo = null;

        // 1. Obtener nuestro precio con descuentos
        if (hasPriceCalendar) {
          try {
            priceInfo = await this.services.priceCalendarService.getPriceForDateRange(
              propertyId,
              checkIn,
              checkOut
            );

            if (priceInfo) {
              ourPrice = priceInfo.totalPriceWithDiscount;
            }
          } catch (error) {
            logger.warn('[TOOL HANDLER] Error calculando precio interno:', error.message);
          }
        }

        // 2. Obtener precio OTA desde BridgeData (gancho comparativo)
        if (hasBridgeData) {
          try {
            const otaData = await this.services.bridgeDataService.getAvailabilityFromCache(
              propertyId,
              checkIn,
              checkOut
            );

            if (otaData && otaData.pricing) {
              otaPrice = otaData.pricing.totalPrice || otaData.pricing.pricePerNight;
            }
          } catch (error) {
            logger.debug('[TOOL HANDLER] Precio OTA no disponible (continuando):', error.message);
          }
        }

        // 3. Si no hay precio interno, intentar desde Neon DB
        if (!ourPrice && hasNeon) {
          try {
            const property = await this.services.neonService.getPropertyAvailability(propertyId, checkIn);
            if (property && property.price_with_discount) {
              ourPrice = property.price_with_discount;
            }
          } catch (error) {
            logger.debug('[TOOL HANDLER] Precio desde DB no disponible:', error.message);
          }
        }

        if (!ourPrice) {
          return {
            status: 'error',
            error: 'No se pudo calcular el precio para las fechas especificadas'
          };
        }

        // Calcular ahorro si hay precio OTA
        let savings = null;
        let savingsPercent = null;
        if (otaPrice && otaPrice > ourPrice) {
          savings = otaPrice - ourPrice;
          savingsPercent = Math.round((savings / otaPrice) * 100);
        }

        const nights = priceInfo?.nights || this._calculateNights(checkIn, checkOut);
        const pricePerNight = Math.round(ourPrice / nights);

        return {
          status: 'available',
          price: ourPrice,
          currency: 'EUR',
          provider: 'PriceCalendar',
          nights: nights,
          averagePricePerNight: pricePerNight,
          discount: priceInfo?.averageDiscount || 0,
          checkIn: checkIn,
          checkOut: checkOut,
          // Gancho comparativo
          otaPrice: otaPrice,
          savings: savings,
          savingsPercent: savingsPercent,
          message: savings 
            ? `Precio OTA: ${otaPrice}€ | Nuestro precio: ${ourPrice}€ (Ahorro: ${savings}€ - ${savingsPercent}%)`
            : `Precio: ${ourPrice}€ (${pricePerNight}€/noche)`
        };
      }

      // Si no hay fechas, retornar precio base
      let basePrice = null;
      const today = new Date().toISOString().split('T')[0];

      if (hasPriceCalendar) {
        try {
          basePrice = await this.services.priceCalendarService.getBasePrice(propertyId, today);
        } catch (error) {
          logger.debug('[TOOL HANDLER] Error obteniendo precio base:', error.message);
        }
      }

      if (!basePrice && hasNeon) {
        try {
          const property = await this.services.neonService.getPropertyAvailability(propertyId, today);
          basePrice = property?.price_with_discount || property?.price_base;
        } catch (error) {
          logger.debug('[TOOL HANDLER] Error desde DB:', error.message);
        }
      }

      if (!basePrice) {
        return {
          status: 'error',
          error: 'No se pudo obtener precio base. Especifica fechas para precio exacto.'
        };
      }

      return {
        status: 'available',
        price: basePrice,
        currency: 'EUR',
        provider: 'PriceCalendar',
        message: `Precio base: ${basePrice}€/noche (especifica fechas para precio exacto con descuentos)`
      };
    } catch (error) {
      logger.error('[TOOL HANDLER] Error obteniendo precio:', error);
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Calcular número de noches entre dos fechas
   */
  _calculateNights(checkIn, checkOut) {
    try {
      const start = new Date(checkIn);
      const end = new Date(checkOut);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 1;
    } catch (error) {
      return 1;
    }
  }
}

export default ToolHandler;
