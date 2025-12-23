/**
 * Herramientas del Cliente - Sandra-Live para GuestsValencia
 * Funciones que la IA puede invocar para interactuar con la interfaz y el estado
 * Adaptado del sistema original de "clientTools.ts"
 */

// Importar estado global (si está disponible)
let sessionState = null;
try {
  if (typeof window !== 'undefined' && window.sessionState) {
    sessionState = window.sessionState;
  }
} catch (e) {
  console.warn('SessionState no disponible aún');
}

/**
 * Reservar una propiedad
 * @param {string} propertyId - ID de la propiedad
 * @param {string} checkIn - Fecha de check-in (YYYY-MM-DD)
 * @param {string} checkOut - Fecha de check-out (YYYY-MM-DD)
 * @param {number} guests - Número de huéspedes
 * @returns {object} Resultado de la operación
 */
function bookAccommodation(propertyId, checkIn, checkOut, guests = 2) {
  console.log(' [ClientTools] Ejecutando bookAccommodation:', { propertyId, checkIn, checkOut, guests });

  try {
    // Actualizar estado global
    if (sessionState) {
      sessionState.currentBooking.propertyId = propertyId;
      sessionState.currentBooking.checkIn = checkIn;
      sessionState.currentBooking.checkOut = checkOut;
      sessionState.currentBooking.guests = guests;
      sessionState.currentBooking.status = 'pending';
      sessionState.update = true;

      // Buscar título de la propiedad desde la lista de alojamientos
      const property = findPropertyById(propertyId);
      if (property) {
        sessionState.currentBooking.propertyTitle = property.title;
        sessionState.currentBooking.price = property.price;
      }

      // Añadir al historial
      if (sessionState.addAction) {
        sessionState.addAction('booking_started', {
          propertyId,
          checkIn,
          checkOut,
          guests
        });
      }
    }

    // Resaltar la propiedad en la interfaz
    highlightProperty(propertyId);

    // Navegar a la página de la propiedad si existe
    navigateToProperty(propertyId);

    // Mostrar modal de reserva si está disponible
    showBookingModal(propertyId, checkIn, checkOut, guests);

    return {
      success: true,
      message: `Reserva iniciada para la propiedad ${propertyId}. Fechas: ${checkIn} a ${checkOut}, ${guests} huéspedes.`
    };
  } catch (error) {
    console.error(' [ClientTools] Error en bookAccommodation:', error);
    return {
      success: false,
      message: `Error al iniciar la reserva: ${error.message}`
    };
  }
}

/**
 * Verificar disponibilidad de una propiedad
 * @param {string} propertyId - ID de la propiedad
 * @param {string} checkIn - Fecha de check-in (YYYY-MM-DD)
 * @param {string} checkOut - Fecha de check-out (YYYY-MM-DD)
 * @returns {object} Resultado con disponibilidad
 */
function checkAvailability(propertyId, checkIn, checkOut) {
  console.log(' [ClientTools] Ejecutando checkAvailability:', { propertyId, checkIn, checkOut });

  try {
    // En una implementación real, esto consultaría una API
    // Por ahora, simulamos que todas las propiedades están disponibles
    const property = findPropertyById(propertyId);

    if (!property) {
      return {
        success: false,
        available: false,
        message: `Propiedad ${propertyId} no encontrada.`
      };
    }

    // Simular verificación (en producción, llamar a API real)
    const isAvailable = true; // TODO: Implementar verificación real

    // Actualizar criterios de búsqueda
    if (sessionState) {
      sessionState.searchCriteria.checkIn = checkIn;
      sessionState.searchCriteria.checkOut = checkOut;
      sessionState.update = true;
    }

    return {
      success: true,
      available: isAvailable,
      property: {
        id: propertyId,
        title: property.title,
        price: property.price
      },
      message: isAvailable
        ? `La propiedad está disponible del ${checkIn} al ${checkOut}. Precio: EUR ${property.price}/noche.`
        : `Lo siento, la propiedad no está disponible en esas fechas.`
    };
  } catch (error) {
    console.error(' [ClientTools] Error en checkAvailability:', error);
    return {
      success: false,
      available: false,
      message: `Error al verificar disponibilidad: ${error.message}`
    };
  }
}

/**
 * Resaltar una propiedad en la interfaz
 * @param {string} propertyId - ID de la propiedad
 * @returns {object} Resultado de la operación
 */
function highlightProperty(propertyId) {
  console.log(' [ClientTools] Ejecutando highlightProperty:', propertyId);

  try {
    // Buscar elemento en el DOM
    const element = document.getElementById(propertyId);
    const card = document.querySelector(`[data-property-id="${propertyId}"]`);
    const propertyCard = element || card;

    if (propertyCard) {
      // Añadir clase de resaltado
      propertyCard.classList.add('highlight');
      propertyCard.style.transition = 'all 0.3s ease';
      propertyCard.style.boxShadow = '0 8px 24px rgba(37, 99, 235, 0.4)';
      propertyCard.style.transform = 'scale(1.02)';

      // Scroll suave hasta la propiedad
      propertyCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Remover resaltado después de 3 segundos
      setTimeout(() => {
        propertyCard.classList.remove('highlight');
        propertyCard.style.boxShadow = '';
        propertyCard.style.transform = '';
      }, 3000);

      return {
        success: true,
        message: `Propiedad ${propertyId} resaltada en la interfaz.`
      };
    } else {
      // Si no se encuentra, navegar a la página de propiedades
      navigateToProperty(propertyId);
      return {
        success: true,
        message: `Navegando a la propiedad ${propertyId}.`
      };
    }
  } catch (error) {
    console.error(' [ClientTools] Error en highlightProperty:', error);
    return {
      success: false,
      message: `Error al resaltar propiedad: ${error.message}`
    };
  }
}

/**
 * Mostrar detalles de una propiedad
 * @param {string} propertyId - ID de la propiedad
 * @returns {object} Resultado de la operación
 */
function showPropertyDetails(propertyId) {
  console.log(' [ClientTools] Ejecutando showPropertyDetails:', propertyId);

  try {
    // Navegar a la página de detalles
    navigateToProperty(propertyId);

    // Añadir a propiedades vistas
    if (sessionState && !sessionState.viewedProperties.includes(propertyId)) {
      sessionState.viewedProperties.push(propertyId);
      sessionState.update = true;
    }

    return {
      success: true,
      message: `Mostrando detalles de la propiedad ${propertyId}.`
    };
  } catch (error) {
    console.error(' [ClientTools] Error en showPropertyDetails:', error);
    return {
      success: false,
      message: `Error al mostrar detalles: ${error.message}`
    };
  }
}

/**
 * Añadir propiedad a favoritos/wishlist
 * @param {string} propertyId - ID de la propiedad
 * @returns {object} Resultado de la operación
 */
function addToWishlist(propertyId) {
  console.log(' [ClientTools] Ejecutando addToWishlist:', propertyId);

  try {
    if (sessionState) {
      if (!sessionState.wishlist.includes(propertyId)) {
        sessionState.wishlist.push(propertyId);
        sessionState.update = true;

        if (sessionState.addAction) {
          sessionState.addAction('added_to_wishlist', { propertyId });
        }
      }
    }

    return {
      success: true,
      message: `Propiedad ${propertyId} añadida a favoritos.`
    };
  } catch (error) {
    console.error(' [ClientTools] Error en addToWishlist:', error);
    return {
      success: false,
      message: `Error al añadir a favoritos: ${error.message}`
    };
  }
}

/**
 * Obtener recomendaciones basadas en criterios
 * @param {object} criteria - Criterios de búsqueda
 * @returns {object} Resultado con recomendaciones
 */
function getRecommendations(criteria) {
  console.log(' [ClientTools] Ejecutando getRecommendations:', criteria);

  try {
    // Actualizar criterios de búsqueda
    if (sessionState) {
      Object.assign(sessionState.searchCriteria, criteria);
      sessionState.update = true;
    }

    // En producción, esto llamaría a una API de recomendaciones
    // Por ahora, retornamos éxito
    return {
      success: true,
      message: `Buscando propiedades que se ajusten a tus criterios...`
    };
  } catch (error) {
    console.error(' [ClientTools] Error en getRecommendations:', error);
    return {
      success: false,
      message: `Error al obtener recomendaciones: ${error.message}`
    };
  }
}

// ===== HERRAMIENTAS MCP - CAPACIDADES AVANZADAS =====

/**
 * URL del servidor MCP (detectada dinámicamente)
 */
function getMCPServerUrl() {
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.protocol === 'file:') {
      return 'http://localhost:4040';
    } else {
      // En producción, usar el servidor MCP de Render
      return 'https://pwa-imbf.onrender.com';
    }
  }
  return 'https://pwa-imbf.onrender.com';
}

/**
 * Secret MCP para autenticación
 */
const MCP_SECRET = 'sandra_mcp_ultra_secure_2025';

/**
 * Obtener contenido de una URL (GitHub, cualquier web pública)
 * @param {string} url - URL a leer
 * @returns {object} Resultado con el contenido
 */
async function fetchUrl(url) {
  console.log(' [ClientTools] Ejecutando fetchUrl:', url);

  try {
    // Para URLs de GitHub raw, usamos fetch directo
    if (url.includes('github.com') && !url.includes('raw.githubusercontent.com')) {
      // Convertir URL de GitHub a raw
      url = url
        .replace('github.com', 'raw.githubusercontent.com')
        .replace('/blob/', '/');
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const content = await response.text();

    return {
      success: true,
      content: content.substring(0, 10000), // Limitar a 10KB para respuestas
      url: url,
      contentLength: content.length,
      message: `Contenido obtenido exitosamente de ${url} (${content.length} caracteres)`
    };
  } catch (error) {
    console.error(' [ClientTools] Error en fetchUrl:', error);
    return {
      success: false,
      error: error.message,
      message: `Error al obtener contenido de ${url}: ${error.message}`
    };
  }
}

/**
 * Leer contenido de un archivo del repositorio GitHub
 * @param {string} owner - Propietario del repo (ej: "GUESTVALENCIA")
 * @param {string} repo - Nombre del repo (ej: "PWA")
 * @param {string} path - Ruta del archivo (ej: "README.md")
 * @param {string} branch - Rama (default: "main")
 * @returns {object} Resultado con el contenido del archivo
 */
async function readGitHubFile(owner, repo, path, branch = 'main') {
  console.log(' [ClientTools] Ejecutando readGitHubFile:', { owner, repo, path, branch });

  try {
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
    const response = await fetch(rawUrl);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const content = await response.text();

    return {
      success: true,
      content: content.substring(0, 10000), // Limitar a 10KB
      path: path,
      repo: `${owner}/${repo}`,
      branch: branch,
      url: rawUrl,
      contentLength: content.length,
      message: `Archivo ${path} leído exitosamente del repo ${owner}/${repo}`
    };
  } catch (error) {
    console.error(' [ClientTools] Error en readGitHubFile:', error);
    return {
      success: false,
      error: error.message,
      message: `Error al leer ${path} de ${owner}/${repo}: ${error.message}`
    };
  }
}

/**
 * Ejecutar un comando en el servidor MCP
 * @param {string} command - Comando a ejecutar
 * @returns {object} Resultado de la ejecución
 */
async function executeMCPCommand(command) {
  console.log(' [ClientTools] Ejecutando executeMCPCommand:', command);

  try {
    const mcpUrl = getMCPServerUrl();
    const response = await fetch(`${mcpUrl}/mcp/execute_command`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'mcp-secret': MCP_SECRET
      },
      body: JSON.stringify({ command })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Error ejecutando comando');
    }

    return {
      success: true,
      output: data.output,
      stderr: data.stderr,
      message: `Comando ejecutado: ${command}`
    };
  } catch (error) {
    console.error(' [ClientTools] Error en executeMCPCommand:', error);
    return {
      success: false,
      error: error.message,
      message: `Error ejecutando comando: ${error.message}`
    };
  }
}

/**
 * Leer un archivo local usando el servidor MCP
 * @param {string} filePath - Ruta del archivo
 * @returns {object} Resultado con el contenido
 */
async function readLocalFile(filePath) {
  console.log(' [ClientTools] Ejecutando readLocalFile:', filePath);

  try {
    const mcpUrl = getMCPServerUrl();
    const response = await fetch(`${mcpUrl}/mcp/read_file`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'mcp-secret': MCP_SECRET
      },
      body: JSON.stringify({ filePath })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Error leyendo archivo');
    }

    return {
      success: true,
      content: data.content.substring(0, 10000),
      path: filePath,
      size: data.size,
      message: `Archivo leído: ${filePath} (${data.size} caracteres)`
    };
  } catch (error) {
    console.error(' [ClientTools] Error en readLocalFile:', error);
    return {
      success: false,
      error: error.message,
      message: `Error leyendo archivo: ${error.message}`
    };
  }
}

/**
 * Listar archivos de un directorio usando el servidor MCP
 * @param {string} dirPath - Ruta del directorio
 * @returns {object} Lista de archivos
 */
async function listFiles(dirPath = '.') {
  console.log(' [ClientTools] Ejecutando listFiles:', dirPath);

  try {
    const mcpUrl = getMCPServerUrl();
    const response = await fetch(`${mcpUrl}/mcp/list_files`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'mcp-secret': MCP_SECRET
      },
      body: JSON.stringify({ dirPath })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Error listando directorio');
    }

    return {
      success: true,
      files: data.files,
      count: data.count,
      directory: dirPath,
      message: `${data.count} archivos encontrados en ${dirPath}`
    };
  } catch (error) {
    console.error(' [ClientTools] Error en listFiles:', error);
    return {
      success: false,
      error: error.message,
      message: `Error listando directorio: ${error.message}`
    };
  }
}

/**
 * Obtener estado del servidor MCP
 * @returns {object} Estado del servidor
 */
async function getMCPStatus() {
  console.log(' [ClientTools] Ejecutando getMCPStatus');

  try {
    const mcpUrl = getMCPServerUrl();
    const response = await fetch(`${mcpUrl}/mcp/status`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      status: data.status,
      version: data.version,
      endpoints: data.endpoints,
      capabilities: data.capabilities,
      message: `Servidor MCP activo (v${data.version})`
    };
  } catch (error) {
    console.error(' [ClientTools] Error en getMCPStatus:', error);
    return {
      success: false,
      error: error.message,
      message: `Error verificando servidor MCP: ${error.message}`
    };
  }
}

// ===== FUNCIONES AUXILIARES =====

/**
 * Buscar propiedad por ID en la lista de alojamientos
 */
function findPropertyById(propertyId) {
  // Buscar en el array de accommodations si está disponible
  if (typeof accommodations !== 'undefined' && Array.isArray(accommodations)) {
    return accommodations.find(a => a.id === propertyId);
  }

  // Buscar en el DOM
  const element = document.getElementById(propertyId);
  if (element) {
    const title = element.querySelector('h3')?.textContent || propertyId;
    const priceElement = element.querySelector('[class*="price"]');
    const price = priceElement ? parseInt(priceElement.textContent.replace(/[^0-9]/g, '')) : null;
    return { id: propertyId, title, price };
  }

  return null;
}

/**
 * Navegar a la página de una propiedad
 */
function navigateToProperty(propertyId) {
  // Navegar usando el sistema de routing del PWA
  if (typeof window !== 'undefined') {
    const hash = `#${propertyId}`;
    window.location.hash = hash;

    // Disparar evento de cambio de hash si es necesario
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  }
}

/**
 * Mostrar modal de reserva
 */
function showBookingModal(propertyId, checkIn, checkOut, guests) {
  // Buscar formulario de reserva en la página de detalles
  const detailPage = document.getElementById(`${propertyId}-page`);
  if (detailPage) {
    // Scroll hasta el formulario
    const bookingForm = detailPage.querySelector('form');
    if (bookingForm) {
      bookingForm.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Rellenar campos si existen
      const checkInInput = bookingForm.querySelector('input[type="date"]');
      const checkOutInput = bookingForm.querySelectorAll('input[type="date"]')[1];
      const guestsSelect = bookingForm.querySelector('select');

      if (checkInInput && checkIn) checkInInput.value = checkIn;
      if (checkOutInput && checkOut) checkOutInput.value = checkOut;
      if (guestsSelect && guests) guestsSelect.value = guests;

      // Resaltar el botón de reserva
      const bookButton = bookingForm.querySelector('.booking-btn, button[type="button"]');
      if (bookButton) {
        bookButton.style.animation = 'pulse 2s infinite';
        setTimeout(() => {
          bookButton.style.animation = '';
        }, 3000);
      }
    }
  }
}

// Exportar funciones para uso en otros módulos
if (typeof window !== 'undefined') {
  window.clientTools = {
    // Herramientas de propiedades
    bookAccommodation,
    checkAvailability,
    highlightProperty,
    showPropertyDetails,
    addToWishlist,
    getRecommendations,
    // Herramientas MCP
    fetchUrl,
    readGitHubFile,
    executeMCPCommand,
    readLocalFile,
    listFiles,
    getMCPStatus
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    // Herramientas de propiedades
    bookAccommodation,
    checkAvailability,
    highlightProperty,
    showPropertyDetails,
    addToWishlist,
    getRecommendations,
    // Herramientas MCP
    fetchUrl,
    readGitHubFile,
    executeMCPCommand,
    readLocalFile,
    listFiles,
    getMCPStatus
  };
}


