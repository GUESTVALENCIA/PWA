/**
 * Tool Handler - Implementación Completa de Handlers
 * FASE 2: Handlers completos para tools de navegación
 */

// ============================================
// ACTUALIZACIÓN DE TOOL HANDLER (tool-handler.js)
// Reemplazar los handlers básicos por handlers completos
// ============================================

/**
 * Handler MEJORADO: ui_action - Control de UI
 * Ejecuta acciones complejas en la interfaz desde voz
 */
async handleUIAction(args, sessionId, ws) {
  const { action, target, value } = args;

  if (!ws || ws.readyState !== 1) {
    logger.warn('[TOOL HANDLER] ⚠️ WebSocket no disponible para ui_action');
    return {
      success: false,
      error: 'WebSocket no disponible'
    };
  }

  try {
    // Mapeo de acciones a comandos del cliente
    const actionMap = {
      'SCROLL': {
        command: 'scroll_to',
        description: 'Desplazar a elemento específico',
        validation: (target) => target && typeof target === 'string'
      },
      'CLICK': {
        command: 'click_element',
        description: 'Hacer clic en elemento',
        validation: (target) => target && typeof target === 'string'
      },
      'TOGGLE_MODAL': {
        command: 'toggle_modal',
        description: 'Abrir/cerrar modal',
        validation: (target) => target && ['open', 'close'].includes(value)
      },
      'HIGHLIGHT': {
        command: 'highlight_element',
        description: 'Resaltar elemento',
        validation: (target) => target && typeof target === 'string'
      }
    };

    const actionInfo = actionMap[action];
    if (!actionInfo) {
      logger.warn(`[TOOL HANDLER] ⚠️ Acción desconocida: ${action}`);
      return {
        success: false,
        error: `Acción no reconocida: ${action}`
      };
    }

    // Validar parámetros
    if (!actionInfo.validation(target)) {
      logger.warn(`[TOOL HANDLER] ⚠️ Parámetros inválidos para ${action}`);
      return {
        success: false,
        error: `Parámetros inválidos para ${action}`
      };
    }

    // Enviar comando al cliente
    ws.send(JSON.stringify({
      type: 'ui_command',
      command: actionInfo.command,
      target: target,
      value: value,
      action: action,
      sessionId: sessionId,
      timestamp: new Date().toISOString()
    }));

    logger.info(`[TOOL HANDLER] ✅ Comando UI enviado: ${action} → ${target}`, {
      command: actionInfo.command,
      description: actionInfo.description,
      value: value
    });

    return {
      success: true,
      action: action,
      target: target,
      command: actionInfo.command,
      message: `${actionInfo.description} ejecutado: ${target}`
    };
  } catch (error) {
    logger.error('[TOOL HANDLER] ❌ Error en ui_action:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Handler MEJORADO: navigate_ui - Navegación completa
 * Navega a secciones con scroll suave y análitico
 */
async handleNavigateUI(args, sessionId, ws) {
  const { section } = args;

  if (!ws || ws.readyState !== 1) {
    logger.warn('[TOOL HANDLER] ⚠️ WebSocket no disponible para navigate_ui');
    return {
      success: false,
      error: 'WebSocket no disponible'
    };
  }

  try {
    // Validar sección
    const validSections = UIControlService.getValidSections();
    if (!validSections.includes(section)) {
      logger.warn(`[TOOL HANDLER] ⚠️ Sección inválida: ${section}`);
      return {
        success: false,
        error: `Sección no válida: ${section}. Válidas: ${validSections.join(', ')}`,
        validSections: validSections
      };
    }

    // Mapeo de secciones a IDs del cliente
    const sectionMap = {
      'hero': {
        id: 'hero-section',
        name: 'Inicio',
        delay: 0,
        scroll_behavior: 'smooth'
      },
      'properties': {
        id: 'properties-section',
        name: 'Propiedades',
        delay: 100,
        scroll_behavior: 'smooth'
      },
      'ai-studio': {
        id: 'ai-studio-section',
        name: 'Sandra AI Studio',
        delay: 100,
        scroll_behavior: 'smooth'
      },
      'faq': {
        id: 'faq-section',
        name: 'Preguntas Frecuentes',
        delay: 100,
        scroll_behavior: 'smooth'
      },
      'dashboard': {
        id: 'dashboard-section',
        name: 'Dashboard',
        delay: 100,
        scroll_behavior: 'smooth'
      },
      'marketing': {
        id: 'marketing-section',
        name: 'Marketing',
        delay: 100,
        scroll_behavior: 'smooth'
      }
    };

    const sectionInfo = sectionMap[section];

    // Registrar navegación
    if (this.services?.uiControlService) {
      this.services.uiControlService.activeNavigations.set(sessionId, {
        section: section,
        timestamp: Date.now()
      });
    }

    // Enviar comando de navegación al cliente
    ws.send(JSON.stringify({
      type: 'ui_navigation',
      section: section,
      sectionId: sectionInfo.id,
      sectionName: sectionInfo.name,
      delay: sectionInfo.delay,
      scrollBehavior: sectionInfo.scroll_behavior,
      sessionId: sessionId,
      timestamp: new Date().toISOString()
    }));

    logger.info(`[TOOL HANDLER] 🧭 Navegación enviada: → ${section}`, {
      sectionId: sectionInfo.id,
      sectionName: sectionInfo.name,
      scrollBehavior: sectionInfo.scroll_behavior
    });

    return {
      success: true,
      section: section,
      sectionId: sectionInfo.id,
      sectionName: sectionInfo.name,
      message: `Navegando a ${sectionInfo.name}...`
    };
  } catch (error) {
    logger.error('[TOOL HANDLER] ❌ Error en navigate_ui:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================
// ACTUALIZACIÓN DE VOICE SERVICES (voice-services.js)
// Mejorar el prompt para incluir instrucciones de navegación
// ============================================

/**
 * Actualizar systemPrompt en processMessage() para incluir instrucciones de tools
 */
const toolsInstructions = `

### HERRAMIENTAS DE NAVEGACIÓN - Úsalas para controlar la interfaz:

**1. navigate_ui(section)** - Navega a una sección:
   - "hero" - Vuelve al inicio
   - "properties" - Muestra propiedades disponibles
   - "ai-studio" - Accede a Sandra AI Studio
   - "faq" - Muestra preguntas frecuentes
   - "dashboard" - Dashboard de propiedades
   - "marketing" - Sección de marketing

**2. ui_action(action, target, value)** - Controla elementos de UI:
   - SCROLL: Desplaza suavemente a un elemento (target: ID o clase)
   - CLICK: Hace clic en un botón o enlace (target: ID o clase)
   - TOGGLE_MODAL: Abre/cierra un modal (target: ID, value: "open"|"close")
   - HIGHLIGHT: Resalta un elemento (target: ID o clase)

### CUÁNDO USAR TOOLS:

- Si el usuario dice "Muéstrame las propiedades" → usa navigate_ui("properties")
- Si dice "Ir al inicio" → usa navigate_ui("hero")
- Si dice "Abre la calculadora de precios" → usa ui_action("CLICK", "price-calculator-btn")
- Si dice "Resalta el botón de reserva" → usa ui_action("HIGHLIGHT", "booking-btn")

### IMPORTANTE:
- SIEMPRE avisa verbalmente qué vas a hacer antes de ejecutar la tool
- Ejemplo: "Te muestro nuestras propiedades disponibles" → LUEGO usa navigate_ui("properties")
- No uses tools si el usuario solo está conversando (no pide control de UI)
`;
