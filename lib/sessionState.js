/**
 * Estado Global de Sesión/Reserva para Sandra-Live
 * Adaptado del sistema de "orderState" para el contexto de hospedaje
 */

// Estado global de la sesión actual
const sessionState = {
  // Información de reserva actual
  currentBooking: {
    propertyId: null,
    propertyTitle: null,
    checkIn: null,
    checkOut: null,
    guests: 2,
    price: null,
    status: 'draft' // 'draft', 'pending', 'confirmed'
  },

  // Propiedades vistas/recomendadas
  viewedProperties: [],
  wishlist: [],

  // Información del cliente (si está disponible)
  clientInfo: {
    name: null,
    email: null,
    phone: null
  },

  // Historial de acciones en esta sesión
  actionHistory: [],

  // Criterios de búsqueda actuales
  searchCriteria: {
    location: null,
    checkIn: null,
    checkOut: null,
    guests: 2,
    budget: null,
    amenities: []
  },

  // Flag de actualización para sincronizar con UI
  update: false,

  // Estado de completitud
  completed: false
};

/**
 * Añadir una acción al historial
 */
function addAction(actionType, data) {
  sessionState.actionHistory.push({
    type: actionType,
    data: data,
    timestamp: new Date().toISOString()
  });
  sessionState.update = true;
  console.log('📋 [SessionState] Acción añadida:', actionType, data);
}

/**
 * Resetear estado de reserva (mantener historial y wishlist)
 */
function resetBooking() {
  sessionState.currentBooking = {
    propertyId: null,
    propertyTitle: null,
    checkIn: null,
    checkOut: null,
    guests: 2,
    price: null,
    status: 'draft'
  };
  sessionState.update = true;
}

/**
 * Completar reserva (confirmar)
 */
function completeBooking() {
  sessionState.currentBooking.status = 'confirmed';
  sessionState.completed = true;
  sessionState.update = true;
  addAction('booking_confirmed', sessionState.currentBooking);
}

/**
 * Exportar para uso en módulos
 */
if (typeof window !== 'undefined') {
  window.sessionState = sessionState;
  window.addAction = addAction;
  window.resetBooking = resetBooking;
  window.completeBooking = completeBooking;
  // Añadir método addAction al objeto sessionState para facilidad de uso
  sessionState.addAction = addAction;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { sessionState, addAction, resetBooking, completeBooking };
}

