/**
 * Actualización Cliente - FASE 2: Handlers para comandos de UI
 * Añadir esto a index.html en el script principal
 */

// ============================================
// MANEJADOR DE COMANDOS DE UI
// ============================================

// Almacenar referencias globales
window.uiCommandHandlers = {
  // Scroll a elemento específico
  scroll_to: function(target) {
    try {
      const element = document.getElementById(target) || document.querySelector(`.${target}`);
      if (!element) {
        console.warn(`[UI] ⚠️ Elemento no encontrado: ${target}`);
        return false;
      }

      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });

      console.log(`[UI] 📜 Scroll a: ${target}`);
      return true;
    } catch (error) {
      console.error('[UI] Error scrolling:', error);
      return false;
    }
  },

  // Click en elemento
  click_element: function(target) {
    try {
      const element = document.getElementById(target) || document.querySelector(`.${target}`);
      if (!element) {
        console.warn(`[UI] ⚠️ Elemento no encontrado: ${target}`);
        return false;
      }

      // Simular click
      element.click();
      
      // Añadir efecto visual temporal
      const originalBg = element.style.background;
      element.style.background = 'rgba(255, 200, 0, 0.3)';
      setTimeout(() => {
        element.style.background = originalBg;
      }, 300);

      console.log(`[UI] 🖱️ Click en: ${target}`);
      return true;
    } catch (error) {
      console.error('[UI] Error clicking:', error);
      return false;
    }
  },

  // Toggle modal
  toggle_modal: function(target, value) {
    try {
      const modal = document.getElementById(target) || document.querySelector(`.${target}`);
      if (!modal) {
        console.warn(`[UI] ⚠️ Modal no encontrado: ${target}`);
        return false;
      }

      if (value === 'open') {
        modal.style.display = 'flex';
        modal.classList.add('modal-open');
        console.log(`[UI] 🪟 Modal abierto: ${target}`);
      } else if (value === 'close') {
        modal.style.display = 'none';
        modal.classList.remove('modal-open');
        console.log(`[UI] 🪟 Modal cerrado: ${target}`);
      }

      return true;
    } catch (error) {
      console.error('[UI] Error toggling modal:', error);
      return false;
    }
  },

  // Highlight elemento
  highlight_element: function(target) {
    try {
      const element = document.getElementById(target) || document.querySelector(`.${target}`);
      if (!element) {
        console.warn(`[UI] ⚠️ Elemento no encontrado: ${target}`);
        return false;
      }

      // Remover highlight anterior si existe
      document.querySelectorAll('.highlighted').forEach(el => {
        el.classList.remove('highlighted');
      });

      // Añadir highlight
      element.classList.add('highlighted');
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Remover highlight después de 3 segundos
      setTimeout(() => {
        element.classList.remove('highlighted');
      }, 3000);

      console.log(`[UI] ✨ Highlight en: ${target}`);
      return true;
    } catch (error) {
      console.error('[UI] Error highlighting:', error);
      return false;
    }
  }
};

// ============================================
// MANEJADOR DE NAVEGACIÓN
// ============================================

window.navigationHandler = {
  navigate: function(section, sectionId) {
    try {
      const element = document.getElementById(sectionId);
      if (!element) {
        console.warn(`[NAV] ⚠️ Sección no encontrada: ${sectionId}`);
        return false;
      }

      // Scroll suave a la sección
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });

      // Añadir efecto visual
      element.classList.add('nav-highlight');
      setTimeout(() => {
        element.classList.remove('nav-highlight');
      }, 500);

      console.log(`[NAV] 🧭 Navegación a: ${section}`);
      return true;
    } catch (error) {
      console.error('[NAV] Error navigating:', error);
      return false;
    }
  }
};

// ============================================
// MANEJADOR CENTRAL DE COMANDOS DE UI
// ============================================

// Integrar con el WebSocket existente para recibir comandos
function setupUICommandHandler() {
  // Encontrar la instancia de WebSocket existente
  if (window.conversationalCallManager && window.conversationalCallManager.ws) {
    const originalOnMessage = window.conversationalCallManager.ws.onmessage;
    
    window.conversationalCallManager.ws.onmessage = function(event) {
      try {
        const message = JSON.parse(event.data);

        // Manejar comando de UI
        if (message.type === 'ui_command') {
          console.log(`[UI COMMAND] Recibido:`, message);
          
          const { command, target, value } = message;
          const handler = window.uiCommandHandlers[command];
          
          if (handler) {
            const result = handler(target, value);
            console.log(`[UI COMMAND] ✅ Ejecutado: ${command} → ${target}`);
          } else {
            console.warn(`[UI COMMAND] ⚠️ Handler no encontrado: ${command}`);
          }
        }
        // Manejar navegación
        else if (message.type === 'ui_navigation') {
          console.log(`[UI NAV] Recibido:`, message);
          
          const { section, sectionId } = message;
          const result = window.navigationHandler.navigate(section, sectionId);
          console.log(`[UI NAV] ✅ Navegado a: ${section}`);
        }
        // Llamar al manejador original para otros mensajes
        else if (originalOnMessage) {
          originalOnMessage.call(this, event);
        }
      } catch (error) {
        console.error('[UI HANDLER] Error procesando mensaje:', error);
        if (originalOnMessage) {
          originalOnMessage.call(this, event);
        }
      }
    };
  }
}

// Inicializar cuando el conversational call manager esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupUICommandHandler);
} else {
  setupUICommandHandler();
}

// ============================================
// ESTILOS CSS PARA EFECTOS VISUALES
// ============================================

// Añadir esto al archivo CSS

const uiStyles = `
/* Estilos para navegación y efectos UI */

.nav-highlight {
  background: linear-gradient(135deg, rgba(100, 200, 255, 0.1), rgba(150, 100, 255, 0.1)) !important;
  transition: all 0.5s ease-in-out;
  border-left: 4px solid #6eb3ff;
  padding-left: 12px !important;
}

.highlighted {
  background: rgba(255, 215, 0, 0.2) !important;
  border: 2px solid #ffd700 !important;
  border-radius: 4px;
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.4);
  animation: pulse-highlight 0.6s ease-in-out;
}

@keyframes pulse-highlight {
  0% {
    box-shadow: 0 0 5px rgba(255, 215, 0, 0.4);
  }
  50% {
    box-shadow: 0 0 25px rgba(255, 215, 0, 0.8);
  }
  100% {
    box-shadow: 0 0 5px rgba(255, 215, 0, 0.4);
  }
}

.modal-open {
  animation: modal-fade-in 0.3s ease-in-out;
}

@keyframes modal-fade-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Animación suave de scroll */
html {
  scroll-behavior: smooth;
}

/* Indicador de sección activa */
.section-active {
  border-top: 3px solid #6eb3ff;
  padding-top: 15px;
}
`;
