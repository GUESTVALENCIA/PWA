// ═══════════════════════════════════════════════════════════════════
// MODEL SELECTOR - Sistema Nuevo y Limpio
// Diseño Elegante y Funcional
// ═══════════════════════════════════════════════════════════════════

class ModelSelector {
    constructor() {
        this.menu = null;
        this.button = null;
        this.isOpen = false;
        this.currentProvider = 'auto';
        this.currentModel = 'auto';
        this.selectedModels = [];
        this.multiModel = false;
        
        this.init();
    }
    
    init() {
        this.menu = document.getElementById('modelMenu');
        // Buscar el botón auto primero, luego compacto, luego normal
        this.button = document.querySelector('.model-btn-auto') || document.querySelector('.model-btn-compact') || document.querySelector('.model-btn');
        
        if (!this.menu || !this.button) {
            console.warn(' Model selector elements not found, reintentando...', {
                menu: !!this.menu,
                button: !!this.button
            });
            setTimeout(() => this.init(), 100);
            return;
        }
        
        // Cargar estado guardado
        const savedProvider = localStorage.getItem('currentProvider') || 'auto';
        const savedModel = localStorage.getItem('currentModel') || 'auto';
        this.currentProvider = savedProvider;
        this.currentModel = savedModel;
        
        // Sincronizar con AppState si existe
        if (window.AppState) {
            this.currentProvider = window.AppState.currentProvider || savedProvider;
            this.currentModel = window.AppState.currentModel || savedModel;
        }
        
        // Cargar modelos seleccionados
        const savedModels = localStorage.getItem('selectedModels');
        if (savedModels) {
            try {
                this.selectedModels = JSON.parse(savedModels);
            } catch (e) {
                this.selectedModels = [];
            }
        }
        
        // Cargar multi-model
        this.multiModel = localStorage.getItem('multiModel') === 'true';
        
        this.setupEventListeners();
        this.renderModelList();
        this.updateButtonDisplay();
        
        console.log(' ModelSelector inicializado correctamente');
    }
    
    setupEventListeners() {
        // Cerrar menú al hacer click fuera
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.model-dropdown') && !e.target.closest('.model-tooltip')) {
                this.closeMenu();
            }
        });
        
        // Buscador de modelos
        const searchInput = document.getElementById('modelSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterModels(e.target.value);
            });
        }
        
        // Toggles
        const autoToggle = document.getElementById('autoToggle');
        if (autoToggle) {
            autoToggle.addEventListener('change', (e) => {
                this.toggleAutoMode(e.target.checked);
            });
        }
        
        const multiModelToggle = document.getElementById('multiModelToggle');
        if (multiModelToggle) {
            multiModelToggle.addEventListener('change', (e) => {
                this.toggleMultiModel(e.target.checked);
            });
        }
    }
    
    toggleMenu() {
        if (this.isOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }
    
    openMenu() {
        if (!this.menu || !this.button) {
            console.warn(' No se puede abrir el menú: elementos no encontrados', {
                menu: !!this.menu,
                button: !!this.button
            });
            return;
        }
        
        const rect = this.button.getBoundingClientRect();
        const menuHeight = 600; // max-height del menú
        const menuWidth = 360;
        
        // Calcular posición hacia arriba del botón
        let left = rect.left;
        let bottom = window.innerHeight - rect.top + 8; // 8px de espacio
        
        // Asegurar que no se salga por la izquierda
        if (left < 16) {
            left = 16;
        }
        
        // Asegurar que no se salga por la derecha
        if (left + menuWidth > window.innerWidth - 16) {
            left = window.innerWidth - menuWidth - 16;
        }
        
        // Asegurar que no se salga por arriba
        if (bottom + menuHeight > window.innerHeight - 16) {
            bottom = menuHeight + 16;
        }
        
        // Aplicar estilos directamente - FORZAR TODOS LOS ESTILOS CON cssText
        this.menu.style.cssText = `
            position: fixed !important;
            left: ${left}px !important;
            bottom: ${bottom}px !important;
            top: auto !important;
            right: auto !important;
            width: ${menuWidth}px !important;
            z-index: 99999999 !important;
            display: flex !important;
            flex-direction: column !important;
            opacity: 1 !important;
            visibility: visible !important;
            pointer-events: auto !important;
        `;
        
        // Agregar clase show
        this.menu.classList.add('show');
        this.isOpen = true;
        
        console.log(' Menú abierto en posición:', {
            left: left,
            bottom: bottom,
            buttonRect: {
                left: rect.left,
                top: rect.top,
                right: rect.right,
                bottom: rect.bottom
            },
            windowSize: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            menuStyles: {
                display: this.menu.style.display,
                visibility: this.menu.style.visibility,
                opacity: this.menu.style.opacity,
                zIndex: this.menu.style.zIndex
            }
        });
        
        // Verificar que el menú sea visible
        const menuRect = this.menu.getBoundingClientRect();
        console.log(' Dimensiones del menú:', {
            width: menuRect.width,
            height: menuRect.height,
            top: menuRect.top,
            left: menuRect.left,
            bottom: menuRect.bottom,
            right: menuRect.right,
            visible: menuRect.width > 0 && menuRect.height > 0
        });
        
        // Focus en buscador
        const searchInput = document.getElementById('modelSearch');
        if (searchInput) {
            setTimeout(() => searchInput.focus(), 100);
        }
    }
    
    closeMenu() {
        if (this.menu) {
            this.menu.classList.remove('show');
            // Resetear todos los estilos inline
            this.menu.style.cssText = '';
        }
        this.isOpen = false;
        this.hideTooltip();
    }
    
    renderModelList() {
        const container = document.getElementById('modelListScroll');
        if (!container) return;
        
        // Usar MODELS global o local
        const MODELS_REF = window.MODELS || (typeof MODELS !== 'undefined' ? MODELS : {});
        
        let html = '';
        
        Object.keys(MODELS_REF).forEach(provider => {
            const providerModels = MODELS_REF[provider];
            
            Object.keys(providerModels).forEach(modelId => {
                const model = providerModels[modelId];
                const fullId = `${provider}:${modelId}`;
                const isActive = this.currentProvider === provider && this.currentModel === modelId;
                const isSelected = this.selectedModels.includes(fullId);
                
                html += `
                    <div class="model-option ${isActive ? 'active' : ''}" 
                         data-provider="${provider}" 
                         data-model="${modelId}"
                         data-tokens="${model.tokens || 'N/A'}"
                         data-capabilities="${JSON.stringify(model.capabilities || [])}"
                         data-description="${(model.description || model.desc || '').replace(/"/g, '&quot;')}"
                         onmouseenter="modelSelector.showTooltip(event, this)"
                         onmouseleave="modelSelector.hideTooltip()"
                         onclick="modelSelector.selectModel(this)">
                        <input type="checkbox" 
                               class="model-checkbox" 
                               ${isSelected || isActive ? 'checked' : ''}
                               onclick="event.stopPropagation(); modelSelector.toggleSelection(this, '${provider}', '${modelId}')">
                        <span class="model-icon">${model.icon || ''}</span>
                        <div class="model-info">
                            <span class="model-name">${model.name}</span>
                            <span class="model-desc">${model.desc || ''}</span>
                        </div>
                    </div>
                `;
            });
        });
        
        container.innerHTML = html;
    }
    
    selectModel(element) {
        const provider = element.dataset.provider;
        const model = element.dataset.model;
        
        if (!provider || !model) return;
        
        this.currentProvider = provider;
        this.currentModel = model;
        
        // Guardar en localStorage (usando storage-helpers)
        if (window.safeLocalStorageSet) {
            window.safeLocalStorageSet('currentProvider', provider);
            window.safeLocalStorageSet('currentModel', model);
        } else {
            try {
                localStorage.setItem('currentProvider', provider);
                localStorage.setItem('currentModel', model);
            } catch (e) {
                if (window.handleStorageError) {
                    window.handleStorageError(e, 'ModelSelector.selectModel', { provider, model });
                }
            }
        }
        
        // Actualizar UI
        document.querySelectorAll('.model-option').forEach(opt => {
            opt.classList.remove('active');
        });
        element.classList.add('active');
        
        // Si no es multi-model, deseleccionar otros
        if (!this.multiModel) {
            this.selectedModels = [`${provider}:${model}`];
            document.querySelectorAll('.model-checkbox').forEach(cb => {
                if (cb !== element.querySelector('.model-checkbox')) {
                    cb.checked = false;
                }
            });
        }
        
        this.updateButtonDisplay();
        this.closeMenu();
        
        // Actualizar AppState
        if (window.AppState) {
            window.AppState.currentProvider = provider;
            window.AppState.currentModel = model;
        }
        
        console.log(` Modelo seleccionado: ${provider}:${model}`);
    }
    
    toggleSelection(checkbox, provider, modelId) {
        const fullId = `${provider}:${modelId}`;
        
        if (checkbox.checked) {
            if (!this.selectedModels.includes(fullId)) {
                this.selectedModels.push(fullId);
            }
            
            if (!this.multiModel) {
                // Modo single: deseleccionar otros
                this.selectedModels = [fullId];
                document.querySelectorAll('.model-checkbox').forEach(cb => {
                    if (cb !== checkbox) cb.checked = false;
                });
                // Seleccionar este modelo
                const option = checkbox.closest('.model-option');
                if (option) this.selectModel(option);
            }
        } else {
            this.selectedModels = this.selectedModels.filter(id => id !== fullId);
        }
        
        // Guardar modelos seleccionados (usando storage-helpers)
        if (window.safeLocalStorageSetJSON) {
            window.safeLocalStorageSetJSON('selectedModels', this.selectedModels);
        } else {
            try {
                localStorage.setItem('selectedModels', JSON.stringify(this.selectedModels));
            } catch (e) {
                if (window.handleStorageError) {
                    window.handleStorageError(e, 'ModelSelector.toggleSelection', { selectedModels: this.selectedModels });
                }
            }
        }
    }
    
    toggleAutoMode(enabled) {
        if (enabled) {
            this.currentProvider = 'auto';
            this.currentModel = 'auto';
            this.updateButtonDisplay();
            
            if (window.AppState) {
                window.AppState.currentProvider = 'auto';
                window.AppState.currentModel = 'auto';
            }
        }
    }
    
    toggleMultiModel(enabled) {
        this.multiModel = enabled;
        localStorage.setItem('multiModel', enabled);
        
        if (!enabled && this.selectedModels.length > 0) {
            const first = this.selectedModels[0];
            const [provider, model] = first.split(':');
            if (provider && model) {
                this.currentProvider = provider;
                this.currentModel = model;
                this.selectedModels = [first];
                this.updateButtonDisplay();
                this.renderModelList();
            }
        }
    }
    
    filterModels(term) {
        const options = document.querySelectorAll('.model-option');
        const searchTerm = term.toLowerCase().trim();
        
        options.forEach(option => {
            const provider = option.dataset.provider || '';
            const model = option.dataset.model || '';
            const name = option.querySelector('.model-name')?.textContent || '';
            const desc = option.querySelector('.model-desc')?.textContent || '';
            
            const searchText = `${provider} ${model} ${name} ${desc}`.toLowerCase();
            option.style.display = searchText.includes(searchTerm) ? 'flex' : 'none';
        });
    }
    
    updateButtonDisplay() {
        // Actualizar botón Auto (nuevo diseño ampliado)
        const iconEl = document.getElementById('modelIcon');
        const labelEl = document.getElementById('modelLabel');
        
        if (iconEl && labelEl) {
            if (this.currentProvider === 'auto') {
                iconEl.textContent = '';
                labelEl.textContent = 'Auto';
            } else {
                // Usar MODELS global o local
                const MODELS_REF = window.MODELS || (typeof MODELS !== 'undefined' ? MODELS : {});
                const modelInfo = MODELS_REF[this.currentProvider]?.[this.currentModel];
                if (modelInfo) {
                    iconEl.textContent = modelInfo.icon || '';
                    labelEl.textContent = modelInfo.name;
                }
            }
        } else if (iconEl) {
            // Fallback para botón compacto
            if (this.currentProvider === 'auto') {
                iconEl.textContent = '';
            } else {
                // Usar MODELS global o local
                const MODELS_REF = window.MODELS || (typeof MODELS !== 'undefined' ? MODELS : {});
                const modelInfo = MODELS_REF[this.currentProvider]?.[this.currentModel];
                if (modelInfo) {
                    iconEl.textContent = modelInfo.icon || '';
                }
            }
        }
        
        // Mantener compatibilidad con botón antiguo si existe
        const providerEl = document.getElementById('modelProvider');
        const nameEl = document.getElementById('modelName');
        
        if (providerEl && nameEl) {
            if (this.currentProvider === 'auto') {
                if (providerEl) providerEl.textContent = 'Auto';
                if (nameEl) nameEl.textContent = 'Selector Inteligente';
            } else {
                const modelInfo = MODELS[this.currentProvider]?.[this.currentModel];
                if (modelInfo) {
                    if (providerEl) providerEl.textContent = this.currentProvider.charAt(0).toUpperCase() + this.currentProvider.slice(1);
                    if (nameEl) nameEl.textContent = modelInfo.name;
                }
            }
        }
    }
    
    showTooltip(event, element) {
        clearTimeout(this.tooltipTimeout);
        
        this.tooltipTimeout = setTimeout(() => {
            const tooltip = document.getElementById('modelTooltip');
            if (!tooltip || !element) return;
            
            const provider = element.dataset.provider || '';
            const tokens = element.dataset.tokens || 'N/A';
            const capabilities = JSON.parse(element.dataset.capabilities || '[]');
            const description = element.dataset.description || '';
            
            // Usar MODELS global o local
            const MODELS_REF = window.MODELS || (typeof MODELS !== 'undefined' ? MODELS : {});
            const modelInfo = MODELS_REF[provider]?.[element.dataset.model];
            const modelName = modelInfo?.name || element.dataset.model;
            const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
            
            // Actualizar contenido
            const tooltipProvider = tooltip.querySelector('.tooltip-provider');
            const tooltipName = tooltip.querySelector('.tooltip-name');
            const tooltipTokens = tooltip.querySelector('.tooltip-tokens');
            const tooltipCapabilities = tooltip.querySelector('.tooltip-capabilities');
            const tooltipDescription = tooltip.querySelector('.tooltip-description');
            
            if (tooltipProvider) tooltipProvider.textContent = providerName;
            if (tooltipName) tooltipName.textContent = modelName;
            if (tooltipTokens) tooltipTokens.innerHTML = `<strong>Ventana de contexto:</strong> ${tokens}`;
            
            if (tooltipCapabilities && capabilities.length > 0) {
                tooltipCapabilities.innerHTML = `
                    <strong>Capacidades:</strong>
                    <ul>
                        ${capabilities.map(cap => `<li>${cap}</li>`).join('')}
                    </ul>
                `;
            } else if (tooltipCapabilities) {
                tooltipCapabilities.innerHTML = '';
            }
            
            if (tooltipDescription) {
                tooltipDescription.textContent = description;
            }
            
            // Posicionar tooltip
            const rect = element.getBoundingClientRect();
            const tooltipRect = tooltip.getBoundingClientRect();
            
            let left = rect.right + 12;
            let top = rect.top;
            
            if (left + tooltipRect.width > window.innerWidth - 16) {
                left = rect.left - tooltipRect.width - 12;
            }
            
            if (top + tooltipRect.height > window.innerHeight - 16) {
                top = window.innerHeight - tooltipRect.height - 16;
            }
            
            if (top < 16) {
                top = 16;
            }
            
            tooltip.style.left = `${left}px`;
            tooltip.style.top = `${top}px`;
            tooltip.classList.add('show');
        }, 300);
    }
    
    hideTooltip() {
        if (this.tooltipTimeout) {
            clearTimeout(this.tooltipTimeout);
            this.tooltipTimeout = null;
        }
        
        const tooltip = document.getElementById('modelTooltip');
        if (tooltip) {
            tooltip.classList.remove('show');
        }
    }
}

// ═══════════════════════════════════════════════════════════════════
// INICIALIZACIÓN - SINGLE SOURCE, SIN RACE CONDITIONS
// ═══════════════════════════════════════════════════════════════════

// Instancia global
let modelSelector = null;
let initAttempts = 0;
const MAX_INIT_ATTEMPTS = 20; // 2 segundos máximo

// Función de inicialización robusta
function initModelSelector() {
    // Verificar que MODELS esté disponible (definido en ultimate-app.js)
    if (!window.MODELS || typeof window.MODELS !== 'object') {
        initAttempts++;
        if (initAttempts < MAX_INIT_ATTEMPTS) {
            // Reintentar después de 100ms
            setTimeout(initModelSelector, 100);
            return;
        } else {
            console.error(' MODELS no disponible después de múltiples intentos');
            return;
        }
    }
    
    // Verificar que los elementos DOM existan
    const menu = document.getElementById('modelMenu');
    const button = document.querySelector('.model-btn-auto') || document.querySelector('.model-btn');
    
    if (!menu || !button) {
        initAttempts++;
        if (initAttempts < MAX_INIT_ATTEMPTS) {
            setTimeout(initModelSelector, 100);
            return;
        } else {
            console.error(' Elementos DOM no encontrados después de múltiples intentos', {
                menu: !!menu,
                button: !!button
            });
            return;
        }
    }
    
    // Inicializar solo una vez
    if (!modelSelector) {
        try {
            modelSelector = new ModelSelector();
            window.modelSelector = modelSelector;
            
            // Exponer toggleModelMenu globalmente
            window.toggleModelMenu = () => {
                if (modelSelector) {
                    modelSelector.toggleMenu();
                } else {
                    console.warn(' ModelSelector no inicializado aún');
                }
            };
            
            console.log(' ModelSelector inicializado correctamente');
        } catch (error) {
            console.error(' Error inicializando ModelSelector:', error);
        }
    }
}

// Inicializar cuando TODO esté listo (DOM + scripts)
// Con cleanup de timeouts para prevenir memory leaks
(function() {
    let tryInitTimeout = null;
    let loadTimeout = null;
    
    const tryInit = () => {
        // Limpiar timeout anterior
        if (tryInitTimeout) {
            clearTimeout(tryInitTimeout);
            tryInitTimeout = null;
        }
        
        // Esperar a que ultimate-app.js haya definido MODELS
        if (document.readyState === 'complete' && window.MODELS) {
            initModelSelector();
        } else if (document.readyState === 'interactive' || document.readyState === 'complete') {
            // Si el DOM está listo pero MODELS no, esperar un poco más
            tryInitTimeout = setTimeout(tryInit, 50);
        }
    };
    
    const cleanup = () => {
        if (tryInitTimeout) {
            clearTimeout(tryInitTimeout);
            tryInitTimeout = null;
        }
        if (loadTimeout) {
            clearTimeout(loadTimeout);
            loadTimeout = null;
        }
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Esperar a que ultimate-app.js se cargue
            tryInitTimeout = setTimeout(tryInit, 150);
        });
    } else {
        // DOM ya está listo
        tryInitTimeout = setTimeout(tryInit, 150);
    }
    
    // Fallback: también intentar después de window.load
    window.addEventListener('load', () => {
        loadTimeout = setTimeout(() => {
            if (!modelSelector && window.MODELS) {
                initModelSelector();
            }
            loadTimeout = null;
        }, 100);
    });
    
    // Exponer cleanup function
    window.cleanupModelSelectorInit = cleanup;
})();

