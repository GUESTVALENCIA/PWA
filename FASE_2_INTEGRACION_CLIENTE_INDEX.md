/**
 * FASE 2: Integración Cliente - Actualizar index.html
 * 
 * Añadir esta sección antes del cierre de </body>
 */

// ============================================
// MANEJADORES DE COMANDOS DE UI
// ============================================

<script>
// Inicializar manejadores de UI cuando esté lista la página
document.addEventListener('DOMContentLoaded', function() {
  // Crear sistema de manejo de comandos UI
  window.UICommandSystem = {
    handlers: {
      scroll_to: function(target) {
        try {
          const element = document.getElementById(target) || 
                         document.querySelector(`.${target}`) ||
                         document.querySelector(`[data-section="${target}"]`);
          if (!element) {
            console.warn(`[UI] ⚠️ Elemento no encontrado: ${target}`);
            return false;
          }
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          console.log(`[UI] 📜 Scroll a: ${target}`);
          return true;
        } catch (error) {
          console.error('[UI] Error scrolling:', error);
          return false;
        }
      },

      click: function(target) {
        try {
          const element = document.getElementById(target) || 
                         document.querySelector(`.${target}`);
          if (!element) {
            console.warn(`[UI] ⚠️ Elemento no encontrado: ${target}`);
            return false;
          }
          element.click();
          // Efecto visual
          const originalBg = element.style.background;
          element.style.background = 'rgba(255, 200, 0, 0.3)';
          setTimeout(() => { element.style.background = originalBg; }, 300);
          console.log(`[UI] 🖱️ Click en: ${target}`);
          return true;
        } catch (error) {
          console.error('[UI] Error clicking:', error);
          return false;
        }
      },

      toggle_modal: function(target, value) {
        try {
          const modal = document.getElementById(target) || 
                       document.querySelector(`.${target}`);
          if (!modal) {
            console.warn(`[UI] ⚠️ Modal no encontrado: ${target}`);
            return false;
          }
          if (value === 'open') {
            modal.style.display = 'flex';
            modal.classList.add('modal-open');
          } else if (value === 'close') {
            modal.style.display = 'none';
            modal.classList.remove('modal-open');
          }
          console.log(`[UI] 🪟 Modal ${value}: ${target}`);
          return true;
        } catch (error) {
          console.error('[UI] Error toggle modal:', error);
          return false;
        }
      },

      highlight: function(target) {
        try {
          const element = document.getElementById(target) || 
                         document.querySelector(`.${target}`);
          if (!element) {
            console.warn(`[UI] ⚠️ Elemento no encontrado: ${target}`);
            return false;
          }
          document.querySelectorAll('.highlighted').forEach(el => {
            el.classList.remove('highlighted');
          });
          element.classList.add('highlighted');
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => { element.classList.remove('highlighted'); }, 3000);
          console.log(`[UI] ✨ Highlight en: ${target}`);
          return true;
        } catch (error) {
          console.error('[UI] Error highlighting:', error);
          return false;
        }
      }
    },

    navigate: function(section, sectionId) {
      try {
        const element = document.getElementById(sectionId);
        if (!element) {
          console.warn(`[NAV] ⚠️ Sección no encontrada: ${sectionId}`);
          return false;
        }
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        element.classList.add('nav-highlight');
        setTimeout(() => { element.classList.remove('nav-highlight'); }, 500);
        console.log(`[NAV] 🧭 Navegación a: ${section}`);
        return true;
      } catch (error) {
        console.error('[NAV] Error navigating:', error);
        return false;
      }
    },

    handleMessage: function(message) {
      if (message.type === 'ui_command') {
        const { command, target, value } = message;
        const handler = this.handlers[command];
        if (handler) {
          return handler(target, value);
        }
      } else if (message.type === 'ui_navigation') {
        const { section, sectionId } = message;
        return this.navigate(section, sectionId);
      }
      return false;
    }
  };

  // Integrar con WebSocket existente
  if (window.conversationalCallManager) {
    const manager = window.conversationalCallManager;
    // Interceptar mensajes del WebSocket
    const setupInterceptor = setInterval(() => {
      if (manager.ws && manager.ws.onmessage) {
        const originalHandler = manager.ws.onmessage;
        manager.ws.onmessage = function(event) {
          try {
            const message = JSON.parse(event.data);
            if (message.type === 'ui_command' || message.type === 'ui_navigation') {
              console.log('[UI SYSTEM] Comando recibido:', message);
              window.UICommandSystem.handleMessage(message);
            }
          } catch (e) {}
          originalHandler.call(this, event);
        };
        clearInterval(setupInterceptor);
      }
    }, 100);
  }
});

// ============================================
// ESTILOS CSS PARA EFECTOS VISUALES
// ============================================

// Añadir a styles.css o <style> tag

const uiStyles = `
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
  0% { box-shadow: 0 0 5px rgba(255, 215, 0, 0.4); }
  50% { box-shadow: 0 0 25px rgba(255, 215, 0, 0.8); }
  100% { box-shadow: 0 0 5px rgba(255, 215, 0, 0.4); }
}

.modal-open {
  animation: modal-fade-in 0.3s ease-in-out;
}

@keyframes modal-fade-in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

html { scroll-behavior: smooth; }

.section-active {
  border-top: 3px solid #6eb3ff;
  padding-top: 15px;
}
`;
</script>
