/**
 * Sistema de Ejecución de Herramientas - Sandra-Live
 * Mapea y ejecuta las funciones personalizadas invocadas por la IA
 * Adaptado del sistema original "callFunctions.ts"
 */

// Importar herramientas del cliente
let clientTools = null;
try {
  if (typeof window !== 'undefined' && window.clientTools) {
    clientTools = window.clientTools;
  }
} catch (e) {
  console.warn('ClientTools no disponible aún');
}

/**
 * Interfaz para resultados de herramientas
 * @typedef {Object} ToolResult
 * @property {boolean} success - Si la ejecución fue exitosa
 * @property {string} message - Mensaje descriptivo del resultado
 * @property {any} [data] - Datos adicionales (opcional)
 */

/**
 * Mapeo nombre de función -> implementación
 */
const toolMap = {
  'bookAccommodation': (args) => {
    if (!clientTools || !clientTools.bookAccommodation) {
      return { success: false, message: 'Herramienta bookAccommodation no disponible' };
    }
    const { propertyId, checkIn, checkOut, guests } = args;
    if (!propertyId || !checkIn || !checkOut) {
      return { success: false, message: 'Faltan parámetros requeridos: propertyId, checkIn, checkOut' };
    }
    return clientTools.bookAccommodation(propertyId, checkIn, checkOut, guests || 2);
  },
  
  'checkAvailability': (args) => {
    if (!clientTools || !clientTools.checkAvailability) {
      return { success: false, message: 'Herramienta checkAvailability no disponible' };
    }
    const { propertyId, checkIn, checkOut } = args;
    if (!propertyId || !checkIn || !checkOut) {
      return { success: false, message: 'Faltan parámetros requeridos: propertyId, checkIn, checkOut' };
    }
    return clientTools.checkAvailability(propertyId, checkIn, checkOut);
  },
  
  'highlightProperty': (args) => {
    if (!clientTools || !clientTools.highlightProperty) {
      return { success: false, message: 'Herramienta highlightProperty no disponible' };
    }
    const { propertyId } = args;
    if (!propertyId) {
      return { success: false, message: 'Falta parámetro requerido: propertyId' };
    }
    return clientTools.highlightProperty(propertyId);
  },
  
  'showPropertyDetails': (args) => {
    if (!clientTools || !clientTools.showPropertyDetails) {
      return { success: false, message: 'Herramienta showPropertyDetails no disponible' };
    }
    const { propertyId } = args;
    if (!propertyId) {
      return { success: false, message: 'Falta parámetro requerido: propertyId' };
    }
    return clientTools.showPropertyDetails(propertyId);
  },
  
  'addToWishlist': (args) => {
    if (!clientTools || !clientTools.addToWishlist) {
      return { success: false, message: 'Herramienta addToWishlist no disponible' };
    }
    const { propertyId } = args;
    if (!propertyId) {
      return { success: false, message: 'Falta parámetro requerido: propertyId' };
    }
    return clientTools.addToWishlist(propertyId);
  },
  
  'getRecommendations': (args) => {
    if (!clientTools || !clientTools.getRecommendations) {
      return { success: false, message: 'Herramienta getRecommendations no disponible' };
    }
    return clientTools.getRecommendations(args || {});
  }
};

/**
 * Ejecuta la herramienta especificada con los parámetros dados
 * @param {string} toolName - Nombre de la herramienta a ejecutar
 * @param {any[]|object} args - Argumentos para la herramienta
 * @returns {ToolResult} Resultado de la ejecución
 */
function invokeTool(toolName, args) {
  console.log(`🔧 [CallFunctions] Invocando herramienta: ${toolName}`, args);
  
  // Obtener función del mapa
  const func = toolMap[toolName];
  
  if (!func) {
    console.error(`❌ [CallFunctions] Herramienta desconocida: ${toolName}`);
    return {
      success: false,
      message: `Herramienta desconocida: ${toolName}. Herramientas disponibles: ${Object.keys(toolMap).join(', ')}`
    };
  }
  
  try {
    // Normalizar argumentos
    // Si args es un array, convertir a objeto usando los nombres de parámetros
    let normalizedArgs = args;
    if (Array.isArray(args)) {
      // Intentar inferir los nombres de los parámetros desde el contexto
      // Por ahora, asumimos que son objetos o valores simples
      normalizedArgs = args[0] || {};
    }
    
    // Ejecutar herramienta
    const result = func(normalizedArgs);
    
    console.log(`✅ [CallFunctions] Herramienta ${toolName} ejecutada:`, result);
    
    return result;
  } catch (error) {
    console.error(`❌ [CallFunctions] Error al ejecutar la herramienta ${toolName}:`, error);
    return {
      success: false,
      message: `Error al ejecutar ${toolName}: ${error.message || error}`
    };
  }
}

/**
 * Obtener lista de herramientas disponibles
 * @returns {string[]} Array con nombres de herramientas
 */
function getAvailableTools() {
  return Object.keys(toolMap);
}

/**
 * Verificar si una herramienta está disponible
 * @param {string} toolName - Nombre de la herramienta
 * @returns {boolean} Si la herramienta está disponible
 */
function isToolAvailable(toolName) {
  return toolName in toolMap;
}

// Exportar para uso en otros módulos
if (typeof window !== 'undefined') {
  window.callFunctions = {
    invokeTool,
    getAvailableTools,
    isToolAvailable
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    invokeTool,
    getAvailableTools,
    isToolAvailable,
    toolMap
  };
}

