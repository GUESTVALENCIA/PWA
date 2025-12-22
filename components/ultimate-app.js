// ═══════════════════════════════════════════════════════════════════
// SANDRA STUDIO ULTIMATE - MAIN APPLICATION
// Enterprise Edition - Powered by Anthropic Opus 4.1
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// GLOBAL STATE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════

const AppState = {
    // Model Configuration
    currentProvider: 'auto',
    currentModel: 'auto',
    selectedModels: [], // Modelos seleccionados (para multi-model)
    multiModel: false, // Modo multi-model activado
    modelConfig: {
        temperature: 0.7,
        maxTokens: 4096,
        topP: 0.9,
        stream: true
    },
    
    // Chat State
    messages: [],
    currentConversationId: null,
    isGenerating: false,
    abortController: null,
    
    // Multimodal State
    attachedImages: [],
    recordingState: {
        isRecording: false,
        mediaRecorder: null,
        audioChunks: [],
        deepgramLive: null,
        audioContext: null,
        processor: null,
        processorNode: null,
        source: null,
        stream: null,
        transcript: '',
        startTime: null,
        maxDuration: 20 * 60 * 1000, // 20 minutos en milisegundos
        updateInterval: null
    },
    
    // Avatar State
    avatarState: {
        isActive: false,
        sessionId: null,
        viewMode: 'normal', // normal, pip, full, share
        isCallActive: false
    },
    
    // UI State
    theme: localStorage.getItem('theme') || 'dark',
    contextMenuTarget: null,
    
    // API Keys (loaded from localStorage)
    apiKeys: {}
};

// ═══════════════════════════════════════════════════════════════════
// MODELS CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

// Listado completo de modelos con tokens, capabilities y descripción (estilo app.js)
const MODELS = {
    ollama: {
        'deepseek-coder:6.7b': { 
            name: 'DeepSeek Coder', 
            icon: '💻', 
            desc: 'Especializado en código',
            tokens: '16K',
            capabilities: ['Generación de código', 'Debugging', 'Refactoring', 'Múltiples lenguajes'],
            description: 'Modelo especializado en programación. Excelente para escribir, depurar y refactorizar código en múltiples lenguajes.',
            vision: false
        },
        'qwen2.5vl:3b-q4_K_M': { 
            name: 'Qwen 2.5 VL', 
            icon: '👁️', 
            desc: 'Visión multimodal',
            tokens: '32K',
            capabilities: ['Análisis de imágenes', 'OCR', 'Descripción visual', 'Multimodal'],
            description: 'Modelo de visión multimodal. Puede analizar imágenes, extraer texto y describir contenido visual.',
            vision: true
        },
        'qwen2.5:7b-instruct-q4_K_M': { 
            name: 'Qwen 2.5 7B', 
            icon: '💬', 
            desc: 'Conversación rápida',
            tokens: '32K',
            capabilities: ['Conversación natural', 'Respuestas rápidas', 'Multilenguaje'],
            description: 'Modelo conversacional rápido y eficiente. Ideal para chats generales y respuestas rápidas.',
            vision: false
        }
    },
    anthropic: {
        'claude-3-haiku-20240307': { 
            name: 'Claude 3 Haiku', 
            icon: '⚡', 
            desc: 'Ultrarrápido',
            tokens: '200K',
            capabilities: ['Velocidad', 'Eficiencia', 'Respuestas rápidas', 'Costo optimizado'],
            description: 'Modelo rápido y eficiente de Anthropic. Ideal para tareas que requieren velocidad sin sacrificar calidad.',
            vision: false
        },
        'claude-3-5-sonnet-20241022': { 
            name: 'Claude 3.5 Sonnet', 
            icon: '🎭', 
            desc: 'Balance calidad/velocidad',
            tokens: '200K',
            capabilities: ['Balance calidad/velocidad', 'Versatilidad', 'Uso general', 'Contexto amplio'],
            description: 'Modelo balanceado de Anthropic. Excelente relación calidad-velocidad para uso general.',
            vision: false
        },
        'claude-3-opus-20240229': { 
            name: 'Claude 3 Opus', 
            icon: '🎨', 
            desc: 'Máxima capacidad',
            tokens: '200K',
            capabilities: ['Razonamiento avanzado', 'Análisis profundo', 'Creatividad', 'Contexto amplio'],
            description: 'El modelo más avanzado de Anthropic. Excelente para razonamiento complejo, análisis profundo y tareas creativas.',
            vision: false
        }
    },
    openai: {
        'gpt-4o': { 
            name: 'GPT-4o', 
            icon: '🧠', 
            desc: 'Multimodal flagship',
            tokens: '128K',
            capabilities: ['Conversación natural', 'Multimodal', 'Velocidad optimizada', 'Visión'],
            description: 'Modelo optimizado para conversaciones naturales con excelente velocidad y calidad. Soporte completo multimodal.',
            vision: true
        },
        'gpt-4o-mini': { 
            name: 'GPT-4o Mini', 
            icon: '⚡', 
            desc: 'Rápido y eficiente',
            tokens: '128K',
            capabilities: ['Procesamiento de texto', 'Rápido', 'Económico'],
            description: 'Versión optimizada para procesamiento de texto. Rápida y económica.',
            vision: false
        }
    },
    gemini: {
        'gemini-2.5-pro': { 
            name: 'Gemini 2.5 Pro', 
            icon: '💎', 
            desc: 'Modelo premium',
            tokens: '1M',
            capabilities: ['Contexto extenso', 'Versátil', 'Buena calidad', 'Multimodal'],
            description: 'Modelo profesional de Gemini con contexto extenso y versatilidad para múltiples tareas.',
            vision: true
        },
        'gemini-2.5-flash': { 
            name: 'Gemini 2.5 Flash', 
            icon: '⚡', 
            desc: 'Velocidad extrema',
            tokens: '1M',
            capabilities: ['Velocidad', 'Contexto extenso', 'Eficiencia'],
            description: 'Modelo rápido de Gemini que mantiene contexto extenso. Ideal para respuestas rápidas.',
            vision: true
        }
    },
    groq: {
        'llama-3.3-70b-versatile': { 
            name: 'LLaMA 3.3 70B', 
            icon: '🦙', 
            desc: 'Modelo potente',
            tokens: '8K',
            capabilities: ['Versatilidad', 'Respuestas rápidas', 'Buena calidad'],
            description: 'Modelo versátil de Groq con excelente velocidad. Ideal para uso general con respuestas rápidas.',
            vision: false
        },
        'llama-3.1-8b-instant': { 
            name: 'LLaMA 3.1 8B', 
            icon: '⚡', 
            desc: 'Ultra rápido',
            tokens: '8K',
            capabilities: ['Respuestas instantáneas', 'Ultra rápido', 'Eficiente'],
            description: 'Modelo optimizado para respuestas instantáneas. Perfecto cuando la velocidad es crítica.',
            vision: false
        }
    }
};

// ═══════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    loadApiKeys();
    setupEventListeners();
    initializeTheme();
    initializeDeepGram();
    initializeHeyGenAvatar();
    setupKeyboardShortcuts();
    
    // Focus input on load
    document.getElementById('chatInput').focus();
});

function initializeApp() {
    console.log('🚀 Sandra Studio Ultimate - Initializing...');
    
    // Load saved conversations
    loadConversations();
    
    // Initialize WebSocket connections if needed
    initializeWebSockets();
    
    // Check for available models
    checkModelAvailability();
    
    // ModelSelector se inicializa automáticamente desde model-selector.js
    // Esperar a que esté listo y sincronizar estado (SINGLE INITIALIZATION POINT)
    const syncModelSelector = (() => {
        let attempts = 0;
        const MAX_ATTEMPTS = 20; // 2 segundos máximo
        
        return function sync() {
            if (window.modelSelector) {
                // Sincronizar estado
                window.modelSelector.currentProvider = AppState.currentProvider;
                window.modelSelector.currentModel = AppState.currentModel;
                window.modelSelector.updateButtonDisplay();
                
            // Cargar modelos seleccionados guardados (usando storage-helpers)
            const savedModels = window.safeLocalStorageGetJSON 
                ? window.safeLocalStorageGetJSON('selectedModels', null)
                : (() => {
                    try {
                        const val = localStorage.getItem('selectedModels');
                        return val ? JSON.parse(val) : null;
                    } catch (e) {
                        if (window.handleStorageError) {
                            window.handleStorageError(e, 'syncModelSelector', { key: 'selectedModels' });
                        }
                        return null;
                    }
                })();
            
            if (savedModels) {
                window.modelSelector.selectedModels = savedModels;
            }
            
            // Cargar multi-model setting (usando storage-helpers)
            const multiModel = window.safeLocalStorageGet
                ? window.safeLocalStorageGet('multiModel', 'false')
                : localStorage.getItem('multiModel') || 'false';
            window.modelSelector.multiModel = multiModel === 'true';
                
                // Renderizar lista de modelos
                if (typeof window.modelSelector.renderModelList === 'function') {
                    window.modelSelector.renderModelList();
                }
                
                console.log('✅ ModelSelector sincronizado con AppState');
            } else {
                attempts++;
                if (attempts < MAX_ATTEMPTS) {
                    setTimeout(sync, 100);
                } else {
                    console.warn('⚠️ ModelSelector no disponible después de múltiples intentos');
                }
            }
        };
    })();
    
    // Iniciar sincronización después de un breve delay para asegurar que model-selector.js se haya ejecutado
    setTimeout(syncModelSelector, 200);
    syncModelSelector.attempts = 0;
    
    // Intentar sincronizar inmediatamente y luego cada 100ms hasta que esté listo
    syncModelSelector();
    
    // Cerrar context menu cuando se hace clic en mensajes del chat
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        chatMessages.addEventListener('click', (e) => {
            if (!e.target.closest('.context-menu') && !e.target.closest('.context-item')) {
                hideContextMenu();
            }
        }, true);
        chatMessages.addEventListener('scroll', () => {
            hideContextMenu();
        }, true);
    }
}

function loadApiKeys() {
    const keys = [
        'openaiKey', 'anthropicKey', 'geminiKey', 'groqKey',
        'deepgramKey', 'heygenKey', 'cartesiaKey'
    ];
    
    keys.forEach(key => {
        const savedKey = localStorage.getItem(key);
        if (savedKey) {
            AppState.apiKeys[key] = savedKey;
        }
    });
}

// ═══════════════════════════════════════════════════════════════════
// EVENT LISTENERS
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// EVENT LISTENERS - Con cleanup para prevenir memory leaks
// ═══════════════════════════════════════════════════════════════════

// Guardar referencias a handlers para cleanup
const eventHandlers = {
    click: null,
    scroll: null,
    keydown: null,
    blur: null,
    resize: null,
    paste: null
};

function setupEventListeners() {
    // Close dropdowns on outside click (usando dom-helpers)
    eventHandlers.click = (e) => {
        if (!e.target.closest('.model-dropdown')) {
            const modelMenu = window.getElement ? window.getElement('modelMenu') : document.getElementById('modelMenu');
            if (modelMenu) {
                modelMenu.classList.remove('show');
            }
        }
        // Cerrar context menu si se hace click fuera de él
        const contextMenu = window.getElement ? window.getElement('contextMenu') : document.getElementById('contextMenu');
        if (contextMenu && !e.target.closest('.context-menu') && !e.target.closest('.context-item')) {
            hideContextMenu();
        }
    };
    document.addEventListener('click', eventHandlers.click, true);
    
    // Cerrar context menu al hacer scroll
    eventHandlers.scroll = () => {
        hideContextMenu();
    };
    window.addEventListener('scroll', eventHandlers.scroll, true);
    
    // Cerrar context menu al presionar Escape
    eventHandlers.keydown = (e) => {
        if (e.key === 'Escape') {
            hideContextMenu();
        }
    };
    document.addEventListener('keydown', eventHandlers.keydown);
    
    // Cerrar context menu al cambiar de foco
    eventHandlers.blur = () => {
        hideContextMenu();
    };
    window.addEventListener('blur', eventHandlers.blur);
    
    // Cerrar context menu al hacer resize
    eventHandlers.resize = () => {
        hideContextMenu();
    };
    window.addEventListener('resize', eventHandlers.resize);
    
    // Paste event listener for images
    eventHandlers.paste = handleGlobalPaste;
    document.addEventListener('paste', eventHandlers.paste);
    
    // Drag and drop
    setupDragAndDrop();
}

// Cleanup function para remover event listeners
function cleanupEventListeners() {
    if (eventHandlers.click) {
        document.removeEventListener('click', eventHandlers.click, true);
        eventHandlers.click = null;
    }
    if (eventHandlers.scroll) {
        window.removeEventListener('scroll', eventHandlers.scroll, true);
        eventHandlers.scroll = null;
    }
    if (eventHandlers.keydown) {
        document.removeEventListener('keydown', eventHandlers.keydown);
        eventHandlers.keydown = null;
    }
    if (eventHandlers.blur) {
        window.removeEventListener('blur', eventHandlers.blur);
        eventHandlers.blur = null;
    }
    if (eventHandlers.resize) {
        window.removeEventListener('resize', eventHandlers.resize);
        eventHandlers.resize = null;
    }
    if (eventHandlers.paste) {
        document.removeEventListener('paste', eventHandlers.paste);
        eventHandlers.paste = null;
    }
}

// Exponer cleanup globalmente
window.cleanupEventListeners = cleanupEventListeners;

function setupDragAndDrop() {
    // Usar cursor-chat-bar como zona de drop (nueva implementación)
    const dropZone = document.querySelector('.cursor-chat-bar');
    
    // Verificar que el elemento existe antes de agregar listeners
    if (!dropZone) {
        console.warn('⚠️ cursor-chat-bar no encontrado, saltando setupDragAndDrop');
        return;
    }
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.add('drag-over');
        });
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('drag-over');
        });
    });
    
    dropZone.addEventListener('drop', handleDrop);
}

// ═══════════════════════════════════════════════════════════════════
// THEME MANAGEMENT
// ═══════════════════════════════════════════════════════════════════

function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
}

function toggleTheme() {
    const newTheme = AppState.theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
}

function setTheme(theme) {
    AppState.theme = theme;
    document.body.className = theme;
    localStorage.setItem('theme', theme);
    
    const themeBtn = document.getElementById('themeToggle');
    themeBtn.innerHTML = theme === 'light' 
        ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z"/></svg>'
        : '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446A9 9 0 1 1 8.349 3.04c.5-.09 1.032-.04 1.651-.04z"/></svg>';
}

// ═══════════════════════════════════════════════════════════════════
// MODEL SELECTION
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// MODEL MENU FUNCTIONS - ELIMINADO (CÓDIGO MUERTO)
// toggleModelMenu ahora es manejado por model-selector.js
// ═══════════════════════════════════════════════════════════════════

// Generar lista de modelos dinámicamente con checkboxes y tooltips
// Generar lista de modelos dinámicamente - DELEGA A MODEL-SELECTOR.JS
function initModelList() {
    // Delegar a ModelSelector si está disponible (SINGLE SOURCE OF TRUTH)
    if (window.modelSelector && typeof window.modelSelector.renderModelList === 'function') {
        window.modelSelector.renderModelList();
        return;
    }
    
    // Fallback: Si ModelSelector no está disponible aún, esperar
    console.warn('⚠️ ModelSelector no disponible aún, reintentando...');
    setTimeout(() => {
        if (window.modelSelector && typeof window.modelSelector.renderModelList === 'function') {
            window.modelSelector.renderModelList();
        } else {
            console.error('❌ ModelSelector no disponible después del timeout');
        }
    }, 500);
}

// Filtrar modelos en el menú - DELEGA A MODEL-SELECTOR.JS
function filterModels(searchTerm) {
    // Delegar a ModelSelector si está disponible (SINGLE SOURCE OF TRUTH)
    if (window.modelSelector && typeof window.modelSelector.filterModels === 'function') {
        window.modelSelector.filterModels(searchTerm);
        return;
    }
    
    // Fallback: Filtrado básico si ModelSelector no está disponible
    const options = document.querySelectorAll('.model-option');
    const term = searchTerm.toLowerCase().trim();
    
    if (!term) {
        options.forEach(opt => opt.style.display = 'flex');
        return;
    }
    
    options.forEach(option => {
        const provider = option.dataset.provider || '';
        const model = option.dataset.model || '';
        const name = option.querySelector('.model-name')?.textContent || '';
        const desc = option.querySelector('.model-desc')?.textContent || '';
        
        const searchText = `${provider} ${model} ${name} ${desc}`.toLowerCase();
        option.style.display = searchText.includes(term) ? 'flex' : 'none';
    });
}

// Funciones de toggle para el menú (compatibilidad con HTML)
function toggleAutoMode(enabled) {
    if (enabled) {
        AppState.currentProvider = 'auto';
        AppState.currentModel = 'auto';
        updateModelButton('auto', 'auto');
        console.log('✅ Modo Auto activado');
    } else {
        // Mantener el modelo actual
        console.log('ℹ️ Modo Auto desactivado');
    }
}

function toggleMaxMode(enabled) {
    console.log(`ℹ️ MAX Mode ${enabled ? 'activado' : 'desactivado'}`);
    // TODO: Implementar lógica de MAX Mode si es necesario
}

function toggleMultiModel(enabled) {
    AppState.multiModel = enabled;
    localStorage.setItem('multiModel', enabled);
    console.log(`ℹ️ Multi Model ${enabled ? 'activado' : 'desactivado'}`);
    
    // Si se desactiva multi-model, seleccionar solo el modelo actual
    if (!enabled && AppState.selectedModels.length > 0) {
        const firstSelected = AppState.selectedModels[0];
        const [provider, model] = firstSelected.split(':');
        if (provider && model) {
            AppState.currentProvider = provider;
            AppState.currentModel = model;
            AppState.selectedModels = [firstSelected];
            updateModelButton(provider, model);
            initModelList(); // Refrescar lista
        }
    }
}

function showAddModelModal() {
    console.log('ℹ️ Función showAddModelModal llamada');
    // TODO: Implementar modal para agregar modelos si es necesario
    alert('Función en desarrollo. Por ahora, los modelos se configuran desde el código.');
}

// Seleccionar modelo - DELEGA A MODEL-SELECTOR.JS
function selectModel(element) {
    // Delegar a ModelSelector si está disponible (SINGLE SOURCE OF TRUTH)
    if (window.modelSelector && typeof window.modelSelector.selectModel === 'function') {
        window.modelSelector.selectModel(element);
        
        // Auto-detect vision models if images attached
        const provider = element.dataset.provider;
        const model = element.dataset.model;
        if (AppState.attachedImages.length > 0 && provider !== 'auto') {
            checkVisionCapability(provider, model);
        }
        return;
    }
    
    // Fallback: Lógica básica si ModelSelector no está disponible
    const provider = element.dataset.provider;
    const model = element.dataset.model;
    
    if (!provider || !model) return;
    
    AppState.currentProvider = provider;
    AppState.currentModel = model;
    
    // Update UI
    document.querySelectorAll('.model-option').forEach(opt => {
        opt.classList.remove('active');
    });
    element.classList.add('active');
    
    // Update button display
    updateModelButton(provider, model);
    
    // Close menu
    const menu = document.getElementById('modelMenu');
    if (menu) menu.classList.remove('show');
    
    // Auto-detect vision models if images attached
    if (AppState.attachedImages.length > 0 && provider !== 'auto') {
        checkVisionCapability(provider, model);
    }
}

// Verificar capacidad de visión del modelo (LÓGICA ANTERIOR)
function checkVisionCapability(provider, model) {
    const modelInfo = MODELS[provider]?.[model];
    
    if (!modelInfo) {
        console.warn(`⚠️ Modelo no encontrado: ${provider}:${model}`);
        return false;
    }
    
    // Si el modelo no tiene visión pero hay imágenes, sugerir cambio
    if (!modelInfo.vision && AppState.attachedImages.length > 0) {
        console.warn(`⚠️ El modelo ${modelInfo.name} no soporta visión, pero hay imágenes adjuntas.`);
        
        // Buscar un modelo con visión del mismo proveedor o de otro
        const visionModel = findVisionModel(provider);
        if (visionModel) {
            console.log(`💡 Sugerencia: Cambiar a ${visionModel.name} para procesar imágenes.`);
            // Opcional: mostrar notificación al usuario
            if (typeof showToast === 'function') {
                showToast(`💡 El modelo actual no soporta visión. Considera usar ${visionModel.name}`, 'info');
            }
        }
        return false;
    }
    
    return modelInfo.vision === true;
}

// Encontrar modelo con visión (para Auto mode)
function findVisionModel(preferredProvider = null) {
    // Buscar primero en el proveedor preferido
    if (preferredProvider && MODELS[preferredProvider]) {
        for (const [modelId, model] of Object.entries(MODELS[preferredProvider])) {
            if (model.vision) {
                return { provider: preferredProvider, modelId, ...model };
            }
        }
    }
    
    // Buscar en todos los proveedores
    for (const [provider, providerModels] of Object.entries(MODELS)) {
        for (const [modelId, model] of Object.entries(providerModels)) {
            if (model.vision) {
                return { provider, modelId, ...model };
            }
        }
    }
    
    return null;
}

function updateModelButton(provider, model) {
    // Esta función ahora delega a ModelSelector.updateButtonDisplay()
    // Mantener solo para compatibilidad con código antiguo
    if (window.modelSelector && window.modelSelector.updateButtonDisplay) {
        window.modelSelector.updateButtonDisplay();
    }
    
    // Código muerto: elementos antiguos que ya no existen
    // const providerEl = document.getElementById('modelProvider');
    // const nameEl = document.getElementById('modelName');
}

function getOptimalModel(message, hasImages = false) {
    // Auto-selection logic
    if (hasImages) {
        // Prefer vision models
        if (AppState.apiKeys.openaiKey) return { provider: 'openai', model: 'gpt-4o' };
        if (AppState.apiKeys.geminiKey) return { provider: 'gemini', model: 'gemini-pro-vision' };
        return { provider: 'ollama', model: 'qwen2.5vl:3b' };
    }
    
    const lower = message.toLowerCase();
    
    // Code detection
    if (lower.match(/código|code|función|class|debug|python|javascript|html|css/)) {
        if (AppState.apiKeys.openaiKey) return { provider: 'openai', model: 'gpt-4-turbo' };
        return { provider: 'ollama', model: 'deepseek-coder:6.7b' };
    }
    
    // Reasoning detection
    if (lower.match(/piensa|razona|analiza|explica|por qué|cómo funciona/)) {
        if (AppState.apiKeys.anthropicKey) return { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' };
        // Usar Qwen 2.5 7B como modelo por defecto (DeepSeek R1 fue descartado)
        return { provider: 'ollama', model: 'qwen2.5:7b-instruct-q4_K_M' };
    }
    
    // Default chat
    if (AppState.apiKeys.openaiKey) return { provider: 'openai', model: 'gpt-4o-mini' };
    if (AppState.apiKeys.anthropicKey) return { provider: 'anthropic', model: 'claude-3-haiku-20240307' };
    return { provider: 'ollama', model: 'qwen2.5:7b-instruct-q4_K_M' };
}

// ═══════════════════════════════════════════════════════════════════
// MODE SELECTION
// ═══════════════════════════════════════════════════════════════════

function setMode(mode) {
    AppState.mode = mode;
    // Actualizar botón Agente desplegable (única implementación)
    const agentBtn = document.getElementById('agentBtn');
    const agentIcon = document.getElementById('agentIcon');
    const agentLabel = document.getElementById('agentLabel');
    
    if (agentBtn && agentIcon && agentLabel) {
        if (mode === 'agent') {
            agentIcon.className = 'fas fa-robot';
            agentLabel.textContent = 'Agente';
        } else if (mode === 'plan') {
            agentIcon.className = 'fas fa-list-check';
            agentLabel.textContent = 'Plan';
        }
    }
    
    // Código muerto eliminado: compatibilidad con .mode-btn antiguos
}

// Funciones para el menú desplegable de Agente
function toggleAgentMenu() {
    const menu = document.getElementById('agentMenu');
    const button = document.getElementById('agentBtn');
    
    if (!menu || !button) {
        console.warn('⚠️ Elementos del menú Agente no encontrados', {
            menu: !!menu,
            button: !!button,
            readyState: document.readyState
        });
        return;
    }
    
    const isOpen = menu.classList.contains('show');
    
    if (isOpen) {
        menu.classList.remove('show');
        // Resetear todos los estilos inline
        menu.style.cssText = '';
    } else {
        // LÓGICA ANTIGUA QUE FUNCIONABA - Aplicada con estilo nuevo
        const rect = button.getBoundingClientRect();
        const menuHeight = 100; // Altura aproximada del menú
        const menuWidth = 140; // Ancho mínimo del menú
        
        // Calcular posición hacia arriba del botón (misma lógica que model-selector)
        let left = rect.left;
        let bottom = window.innerHeight - rect.top + 8; // 8px de espacio arriba del botón
        
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
        
        // Aplicar estilos directamente - MISMA LÓGICA QUE MODEL-SELECTOR
        menu.style.cssText = `
            position: fixed !important;
            left: ${left}px !important;
            bottom: ${bottom}px !important;
            top: auto !important;
            right: auto !important;
            width: auto !important;
            min-width: ${menuWidth}px !important;
            max-width: none !important;
            margin: 0 !important;
            transform: none !important;
            z-index: 99999999 !important;
            display: block !important;
            opacity: 1 !important;
            visibility: visible !important;
            pointer-events: auto !important;
        `;
        
        menu.classList.add('show');
        
        console.log('✅ Menú Agente abierto en:', {
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
            }
        });
    }
}

function selectAgentMode(mode) {
    setMode(mode);
    const menu = document.getElementById('agentMenu');
    if (menu) {
        menu.classList.remove('show');
    }
}

// Cerrar menú Agente al hacer click fuera (SINGLE SOURCE - Sin duplicados)
(function() {
    const closeAgentMenuOnOutsideClick = (e) => {
        const agentMenu = document.getElementById('agentMenu');
        const agentBtn = document.getElementById('agentBtn');
        if (agentMenu && agentBtn && !agentBtn.contains(e.target) && !agentMenu.contains(e.target)) {
            agentMenu.classList.remove('show');
            agentMenu.style.cssText = ''; // Reset estilos inline
        }
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            document.addEventListener('click', closeAgentMenuOnOutsideClick);
        });
    } else {
        document.addEventListener('click', closeAgentMenuOnOutsideClick);
    }
})();

// ═══════════════════════════════════════════════════════════════════
// MULTIMODAL HANDLING
// ═══════════════════════════════════════════════════════════════════

function handlePaste(event) {
    const items = (event.clipboardData || event.originalEvent.clipboardData).items;
    
    for (const item of items) {
        if (item.type.indexOf('image') !== -1) {
            const blob = item.getAsFile();
            handleImageFile(blob);
            event.preventDefault();
        }
    }
}

function handleGlobalPaste(event) {
    // Check if paste is in the input area
    const activeElement = document.activeElement;
    if (activeElement.id === 'chatInput') {
        handlePaste(event);
    }
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
            handleImageFile(file);
        }
    });
}

function handleImageFile(file) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
        const imageData = e.target.result;
        addAttachedImage(imageData);
    };
    
    reader.readAsDataURL(file);
}

function addAttachedImage(imageData) {
    const imageId = Date.now().toString();
    AppState.attachedImages.push({
        id: imageId,
        data: imageData,
        type: 'image'
    });
    
    updateAttachmentsUI();
    
    // Auto-select vision model if in auto mode
    if (AppState.currentProvider === 'auto') {
        const optimal = getOptimalModel('', true);
        updateModelButton(optimal.provider, optimal.model);
    }
}

function updateAttachmentsUI() {
    const container = document.getElementById('attachmentsContainer');
    const list = document.getElementById('attachmentsList');
    
    if (AppState.attachedImages.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    list.innerHTML = AppState.attachedImages.map(img => `
        <div class="attachment-item" data-id="${img.id}">
            <img src="${img.data}" class="attachment-img" alt="Attached">
            <button class="attachment-remove" onclick="removeAttachment('${img.id}')">✕</button>
        </div>
    `).join('');
}

function removeAttachment(imageId) {
    AppState.attachedImages = AppState.attachedImages.filter(img => img.id !== imageId);
    updateAttachmentsUI();
}

function attachImage() {
    document.getElementById('fileInput').click();
}

function handleFileSelect(event) {
    const files = event.target.files;
    Array.from(files).forEach(file => {
        if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
            handleImageFile(file);
        }
    });
    event.target.value = '';
}

// ═══════════════════════════════════════════════════════════════════
// CONTEXT MENU
// ═══════════════════════════════════════════════════════════════════

function showContextMenu(event) {
    event.preventDefault();
    event.stopPropagation();
    
    // Cerrar cualquier menú abierto previamente
    hideContextMenu();
    
    const contextMenu = document.getElementById('contextMenu');
    if (!contextMenu) return;
    
    // Mostrar el menú
    contextMenu.style.display = 'block';
    contextMenu.style.visibility = 'visible';
    contextMenu.style.opacity = '1';
    contextMenu.style.pointerEvents = 'auto';
    contextMenu.style.zIndex = '99999';
    contextMenu.style.position = 'fixed';
    contextMenu.style.left = event.pageX + 'px';
    contextMenu.style.top = event.pageY + 'px';
    contextMenu.classList.remove('hidden');
    
    AppState.contextMenuTarget = event.target;
    
    // Ajustar posición si se sale del viewport
    requestAnimationFrame(() => {
        const rect = contextMenu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            contextMenu.style.left = (event.pageX - rect.width) + 'px';
        }
        if (rect.bottom > window.innerHeight) {
            contextMenu.style.top = (event.pageY - rect.height) + 'px';
        }
    });
}

function hideContextMenu() {
    const contextMenu = document.getElementById('contextMenu');
    if (contextMenu) {
        contextMenu.style.display = 'none';
        contextMenu.style.visibility = 'hidden';
        contextMenu.style.opacity = '0';
        contextMenu.style.pointerEvents = 'none';
        contextMenu.style.left = '-9999px';
        contextMenu.style.top = '-9999px';
        contextMenu.classList.add('hidden');
        contextMenu.classList.remove('show');
    }
    AppState.contextMenuTarget = null;
}

function contextAction(action) {
    hideContextMenu();
    
    setTimeout(() => {
        const target = AppState.contextMenuTarget || document.activeElement;
        
        switch(action) {
            case 'copy':
                if (window.getSelection().toString()) {
                    document.execCommand('copy');
                } else if (target && target.value) {
                    target.select();
                    document.execCommand('copy');
                }
                break;
            case 'paste':
                if (target && (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT')) {
                    navigator.clipboard.readText().then(text => {
                        const start = target.selectionStart;
                        const end = target.selectionEnd;
                        const value = target.value;
                        target.value = value.substring(0, start) + text + value.substring(end);
                        target.selectionStart = target.selectionEnd = start + text.length;
                    }).catch(() => {});
                }
                break;
            case 'cut':
                if (window.getSelection().toString()) {
                    document.execCommand('cut');
                } else if (target && target.value && target.selectionStart !== target.selectionEnd) {
                    document.execCommand('cut');
                }
                break;
            case 'selectAll':
                if (target && (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT')) {
                    target.select();
                } else {
                    document.execCommand('selectAll');
                }
                break;
        }
        AppState.contextMenuTarget = null;
    }, 50);
}

async function translateWithAI(text) {
    const message = `Traduce el siguiente texto al inglés:\n\n${text}`;
    document.getElementById('chatInput').value = message;
    sendMessage();
}

async function searchWithAI(text) {
    const message = `Busca información sobre: ${text}`;
    document.getElementById('chatInput').value = message;
    sendMessage();
}

// ═══════════════════════════════════════════════════════════════════
// CHAT FUNCTIONALITY
// ═══════════════════════════════════════════════════════════════════

function handleKeydown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message && AppState.attachedImages.length === 0) return;
    if (AppState.isGenerating) return;
    
    AppState.isGenerating = true;
    updateSendButton(true);
    
    // Determine provider and model
    let provider = AppState.currentProvider;
    let model = AppState.currentModel;
    
    if (provider === 'auto') {
        const optimal = getOptimalModel(message, AppState.attachedImages.length > 0);
        provider = optimal.provider;
        model = optimal.model;
    }
    
    // Add user message to UI
    addMessage('user', message, AppState.attachedImages);
    
    // Add to messages history
    AppState.messages.push({
        role: 'user',
        content: message,
        images: AppState.attachedImages.map(img => img.data)
    });
    
    // Clear input and attachments
    input.value = '';
    input.style.height = 'auto';
    AppState.attachedImages = [];
    updateAttachmentsUI();
    
    // Show streaming indicator
    showStreaming(true);
    
    try {
        // Call appropriate API based on provider
        let response;
        switch(provider) {
            case 'openai':
                response = await callOpenAI(model, AppState.messages);
                break;
            case 'anthropic':
                response = await callAnthropic(model, AppState.messages);
                break;
            case 'gemini':
                response = await callGemini(model, AppState.messages);
                break;
            case 'groq':
                response = await callGroq(model, AppState.messages);
                break;
            case 'ollama':
                response = await callOllama(model, AppState.messages);
                break;
            default:
                throw new Error('Provider no soportado');
        }
        
        // Add assistant message to history
        AppState.messages.push({
            role: 'assistant',
            content: response
        });
        
        // Hacer hablar al avatar con la respuesta (si está disponible)
        if (window.speakWithAvatar && typeof window.speakWithAvatar === 'function') {
            try {
                await window.speakWithAvatar(response);
            } catch (avatarError) {
                console.warn('⚠️ Error haciendo hablar al avatar:', avatarError);
                // No fallar el chat si el avatar falla
            }
        }
        
    } catch (error) {
        console.error('Error:', error);
        addMessage('assistant', `Error: ${error.message}`);
    }
    
    showStreaming(false);
    AppState.isGenerating = false;
    updateSendButton(false);
}

function addMessage(role, content, images = []) {
    const container = document.getElementById('chatMessages');
    
    // Remove welcome screen if exists
    const welcome = container.querySelector('.welcome-screen');
    if (welcome) welcome.remove();
    
    const messageEl = document.createElement('div');
    messageEl.className = `message ${role}`;
    
    let html = '<div class="message-bubble">';
    
    // Add images if present
    if (images && images.length > 0) {
        html += '<div class="message-images">';
        images.forEach(img => {
            html += `<img src="${img.data || img}" class="message-image" alt="Image">`;
        });
        html += '</div>';
    }
    
    // Add text content
    if (content) {
        html += `<div class="message-text">${formatMessage(content)}</div>`;
    }
    
    html += '</div>';
    
    messageEl.innerHTML = html;
    
    // Agregar event listener para context menu en el mensaje
    messageEl.addEventListener('contextmenu', (e) => {
        showContextMenu(e);
    });
    
    container.appendChild(messageEl);
    container.scrollTop = container.scrollHeight;
    
    return messageEl;
}

function formatMessage(content) {
    // Convert markdown to HTML
    content = content
        .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
    
    return content;
}

function updateSendButton(loading) {
    const btn = document.getElementById('sendBtn');
    btn.disabled = loading;
    if (loading) {
        btn.innerHTML = '<div class="spinner"></div>';
    } else {
        btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>';
    }
}

function showStreaming(show) {
    document.getElementById('streamingBar').style.display = show ? 'flex' : 'none';
}

function stopGeneration() {
    if (AppState.abortController) {
        AppState.abortController.abort();
        AppState.abortController = null;
    }
    AppState.isGenerating = false;
    showStreaming(false);
    updateSendButton(false);
}

// ═══════════════════════════════════════════════════════════════════
// API CALLS
// ═══════════════════════════════════════════════════════════════════

async function callOpenAI(model, messages) {
    const apiKey = AppState.apiKeys.openaiKey;
    if (!apiKey) {
        const error = new Error('OpenAI API key no configurada');
        if (window.handleAPIError) {
            window.handleAPIError(error, 'callOpenAI', { model });
        }
        throw error;
    }
    
    AppState.abortController = new AbortController();
    
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: window.safeJSONStringify ? window.safeJSONStringify({
                model: model,
                messages: messages.map(m => ({
                    role: m.role,
                    content: m.images && m.images.length > 0 
                        ? [
                            { type: 'text', text: m.content },
                            ...m.images.map(img => ({
                                type: 'image_url',
                                image_url: { url: img }
                            }))
                        ]
                        : m.content
                })),
                temperature: AppState.modelConfig.temperature,
                max_tokens: AppState.modelConfig.maxTokens,
                stream: true
            }) : JSON.stringify({
                model: model,
                messages: messages.map(m => ({
                    role: m.role,
                    content: m.images && m.images.length > 0 
                        ? [
                            { type: 'text', text: m.content },
                            ...m.images.map(img => ({
                                type: 'image_url',
                                image_url: { url: img }
                            }))
                        ]
                        : m.content
                })),
                temperature: AppState.modelConfig.temperature,
                max_tokens: AppState.modelConfig.maxTokens,
                stream: true
            }),
            signal: AppState.abortController.signal
        });
        
        if (!response.ok) {
            if (window.handleAPIError) {
                window.handleAPIError(response, 'callOpenAI', { model, status: response.status });
            }
            throw new Error(`OpenAI API error: ${response.statusText}`);
        }
        
        return response;
    } catch (error) {
        if (error.name === 'AbortError') {
            throw error; // Re-lanzar abort errors sin manejar
        }
        if (window.handleAPIError) {
            window.handleAPIError(error, 'callOpenAI', { model });
        }
        throw error;
    }
    
    // Handle streaming response
    return await handleStreamResponse(response);
}

async function callAnthropic(model, messages) {
    const apiKey = AppState.apiKeys.anthropicKey;
    if (!apiKey) {
        const error = new Error('Anthropic API key no configurada');
        if (window.handleAPIError) {
            window.handleAPIError(error, 'callAnthropic', { model });
        }
        throw error;
    }
    
    AppState.abortController = new AbortController();
    
    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: window.safeJSONStringify ? window.safeJSONStringify({
                model: model,
                messages: messages.map(m => ({
                    role: m.role,
                    content: m.content
                })),
                max_tokens: AppState.modelConfig.maxTokens,
                temperature: AppState.modelConfig.temperature,
                stream: true
            }) : JSON.stringify({
                model: model,
                messages: messages.map(m => ({
                    role: m.role,
                    content: m.content
                })),
                max_tokens: AppState.modelConfig.maxTokens,
                temperature: AppState.modelConfig.temperature,
                stream: true
            }),
            signal: AppState.abortController.signal
        });
        
        if (!response.ok) {
            if (window.handleAPIError) {
                window.handleAPIError(response, 'callAnthropic', { model, status: response.status });
            }
            throw new Error(`Anthropic API error: ${response.statusText}`);
        }
        
        return response;
    } catch (error) {
        if (error.name === 'AbortError') {
            throw error;
        }
        if (window.handleAPIError) {
            window.handleAPIError(error, 'callAnthropic', { model });
        }
        throw error;
    }
    
    return await handleStreamResponse(response);
}

async function callGemini(model, messages) {
    const apiKey = AppState.apiKeys.geminiKey;
    if (!apiKey) throw new Error('Gemini API key no configurada');
    
    // Gemini implementation
    // Note: This would require the Google Generative AI SDK
    throw new Error('Gemini integration pendiente de implementación');
}

async function callGroq(model, messages) {
    const apiKey = AppState.apiKeys.groqKey;
    if (!apiKey) throw new Error('Groq API key no configurada');
    
    AppState.abortController = new AbortController();
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: model,
            messages: messages.map(m => ({
                role: m.role,
                content: m.content
            })),
            temperature: AppState.modelConfig.temperature,
            max_tokens: AppState.modelConfig.maxTokens,
            stream: true
        }),
        signal: AppState.abortController.signal
    });
    
    if (!response.ok) {
        throw new Error(`Groq API error: ${response.statusText}`);
    }
    
    return await handleStreamResponse(response);
}

async function callOllama(model, messages) {
    const baseUrl = localStorage.getItem('ollamaUrl') || 'http://localhost:11434';
    
    AppState.abortController = new AbortController();
    
    const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: model,
            messages: messages.map(m => ({
                role: m.role,
                content: m.content,
                images: m.images ? m.images.map(img => img.split(',')[1]) : undefined
            })),
            stream: true,
            options: {
                temperature: AppState.modelConfig.temperature,
                num_predict: AppState.modelConfig.maxTokens
            }
        }),
        signal: AppState.abortController.signal
    });
    
    if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
    }
    
    return await handleStreamResponse(response, 'ollama');
}

async function handleStreamResponse(response, type = 'openai') {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';
    let messageEl = null;
    
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim());
            
            for (const line of lines) {
                if (type === 'ollama') {
                    // Usar safeJSONParse
                    const data = window.safeJSONParse 
                        ? window.safeJSONParse(line, null, false) // No loggear errores de parsing en streaming
                        : (() => {
                            try {
                                return JSON.parse(line);
                            } catch (e) {
                                return null;
                            }
                        })();
                    
                    if (data && data.message?.content) {
                        fullResponse += data.message.content;
                        if (!messageEl) {
                            messageEl = addMessage('assistant', '');
                        }
                        updateMessageContent(messageEl, fullResponse);
                    }
                } else {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;
                        
                        // Usar safeJSONParse
                        const parsed = window.safeJSONParse
                            ? window.safeJSONParse(data, null, false) // No loggear errores de parsing en streaming
                            : (() => {
                                try {
                                    return JSON.parse(data);
                                } catch (e) {
                                    return null;
                                }
                            })();
                        
                        if (parsed) {
                            const content = parsed.choices?.[0]?.delta?.content || 
                                          parsed.delta?.text || '';
                            if (content) {
                                fullResponse += content;
                                if (!messageEl) {
                                    messageEl = addMessage('assistant', '');
                                }
                                updateMessageContent(messageEl, fullResponse);
                            }
                        }
                    }
                }
            }
        }
    } catch (e) {
        if (e.name !== 'AbortError') throw e;
    }
    
    return fullResponse;
}

function updateMessageContent(messageEl, content) {
    const textEl = messageEl.querySelector('.message-text');
    if (!textEl) {
        const bubble = messageEl.querySelector('.message-bubble');
        const div = document.createElement('div');
        div.className = 'message-text';
        bubble.appendChild(div);
        textEl = div;
    }
    textEl.innerHTML = formatMessage(content);
    
    // Scroll to bottom
    const container = document.getElementById('chatMessages');
    container.scrollTop = container.scrollHeight;
}

// ═══════════════════════════════════════════════════════════════════
// VOICE & RECORDING
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// DICTADO ESTILO CHATGPT CON DEEPGRAM
// ═══════════════════════════════════════════════════════════════════

async function toggleVoice() {
    if (AppState.recordingState.isRecording) {
        await stopVoiceRecording();
    } else {
        await startVoiceRecording();
    }
}

async function startVoiceRecording() {
    try {
        // Verificar API key
        const apiKey = AppState.apiKeys.deepgramKey;
        if (!apiKey) {
            showToast('Deepgram API key no configurada', 'error');
            return;
        }

        // Solicitar acceso al micrófono (sin restricciones estrictas primero)
        let stream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
        } catch (error) {
            console.error('Error accediendo al micrófono:', error);
            throw new Error('No se pudo acceder al micrófono. Verifica los permisos del navegador.');
        }

        // Iniciar Deepgram Live
        showLoadingState('Conectando con Deepgram...');
        
        // Configurar listeners de Deepgram ANTES de iniciar (limpiar listeners anteriores primero)
        window.sandra.removeDeepgramListeners?.();
        
        let deepgramReady = false;
        let deepgramError = null;
        let deepgramReadyPromise = null;
        let deepgramReadyResolver = null;
        
        // Función para actualizar el estado de Deepgram desde callbacks
        const updateDeepgramReady = (ready) => {
            deepgramReady = ready;
            if (AppState.recordingState) {
                AppState.recordingState._deepgramReady = ready;
            }
        };
        
        const updateDeepgramError = (error) => {
            deepgramError = error;
            if (AppState.recordingState) {
                AppState.recordingState._deepgramError = error;
            }
        };
        
        // Crear promesa para esperar a que Deepgram esté listo
        deepgramReadyPromise = new Promise((resolve) => {
            deepgramReadyResolver = resolve;
        });
        
        // Listener para cuando la conexión esté lista
        window.sandra.onDeepgramConnected((data) => {
            if (data.connected && !deepgramReady) {
                updateDeepgramReady(true);
                if (deepgramReadyResolver) {
                    deepgramReadyResolver();
                    deepgramReadyResolver = null;
                }
                console.log('✅ Deepgram Live listo (conexión confirmada)');
            }
        });
        
        // Listener para transcripciones
        window.sandra.onDeepgramTranscript((data) => {
            
            if (data.transcript && data.transcript.trim()) {
                if (data.isFinal) {
                    // Agregar transcripción final al texto acumulado
                    if (AppState.recordingState.transcript) {
                        AppState.recordingState.transcript += ' ' + data.transcript.trim();
                    } else {
                        AppState.recordingState.transcript = data.transcript.trim();
                    }
                    
                    // Actualizar el input con el texto acumulado
                    const input = document.getElementById('chatInput');
                    if (input) {
                        input.value = AppState.recordingState.transcript;
                        autoResize(input);
                    }
                } else {
                    // Mostrar transcripción intermedia
                    const input = document.getElementById('chatInput');
                    if (input) {
                        const currentText = AppState.recordingState.transcript || '';
                        input.value = currentText + (currentText ? ' ' : '') + data.transcript.trim();
                        autoResize(input);
                    }
                }
            }
        });
        
        window.sandra.onDeepgramError((error) => {
            console.error('Error Deepgram:', error);
            updateDeepgramError(error);
            if (deepgramReadyResolver) {
                deepgramReadyResolver(); // Resolver para no bloquear
                deepgramReadyResolver = null;
            }
            showToast('Error en Deepgram: ' + (error.message || error), 'error');
            stopVoiceRecording();
        });
        
        // Iniciar Deepgram Live
        const deepgramResult = await window.sandra.deepgramStartLive();
        
        if (!deepgramResult || !deepgramResult.success) {
            throw new Error('No se pudo iniciar Deepgram Live. Verifica tu API key.');
        }
        
        // Esperar a que la conexión esté lista (máximo 5 segundos)
        console.log('⏳ Esperando a que Deepgram Live esté listo...');
        try {
            await Promise.race([
                deepgramReadyPromise,
                new Promise(resolve => setTimeout(() => {
                    if (!deepgramReady) {
                        console.warn('⚠️ Timeout esperando conexión Deepgram, continuando...');
                        updateDeepgramReady(true);
                        if (deepgramReadyResolver) {
                            deepgramReadyResolver();
                            deepgramReadyResolver = null;
                        }
                    }
                    resolve();
                }, 5000)) // Timeout de 5 segundos
            ]);
        } catch (error) {
            console.error('Error esperando conexión Deepgram:', error);
            updateDeepgramReady(true); // Continuar de todos modos
        }
        
        if (deepgramReady) {
            console.log('✅ Deepgram Live listo para recibir audio');
        }

        // Configurar AudioContext para procesar el audio
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(stream);
        
        // Obtener la frecuencia de muestreo del stream
        const sampleRate = audioContext.sampleRate;
        console.log('Sample rate del audio:', sampleRate);
        
        // Crear ScriptProcessorNode para convertir a PCM (compatible con navegadores antiguos)
        const bufferSize = 4096;
        const processor = audioContext.createScriptProcessor(bufferSize, 1, 1);
        
        // Variable para acumular chunks de audio
        const audioChunks = [];
        let chunkCounter = 0;
        
        processor.onaudioprocess = (e) => {
            if (!AppState.recordingState.isRecording) return;
            // Usar el estado guardado en AppState para acceso desde callback asíncrono
            const isReady = AppState.recordingState._deepgramReady;
            const hasError = AppState.recordingState._deepgramError;
            if (!isReady) {
                // Acumular audio mientras esperamos
                return;
            }
            if (hasError) return; // No procesar si hay error
            
            try {
                const inputData = e.inputBuffer.getChannelData(0);
                
                // Convertir Float32Array a Int16Array (PCM linear16)
                const pcmData = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) {
                    const s = Math.max(-1, Math.min(1, inputData[i]));
                    pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                }
                
                // Convertir Int16Array a Uint8Array (little-endian)
                const uint8Array = new Uint8Array(pcmData.buffer);
                
                // Acumular chunks
                audioChunks.push(uint8Array);
                chunkCounter++;
                
                // Enviar cada 5 chunks (aproximadamente cada 0.2 segundos) para mejor latencia
                if (chunkCounter >= 5) {
                    // Combinar todos los chunks acumulados
                    const totalLength = audioChunks.reduce((sum, chunk) => sum + chunk.length, 0);
                    const combined = new Uint8Array(totalLength);
                    let offset = 0;
                    for (const chunk of audioChunks) {
                        combined.set(chunk, offset);
                        offset += chunk.length;
                    }
                    
                    // Limpiar array de chunks
                    audioChunks.length = 0;
                    chunkCounter = 0;
                    
                    // Convertir a base64
                    let binaryString = '';
                    for (let i = 0; i < combined.length; i++) {
                        binaryString += String.fromCharCode(combined[i]);
                    }
                    const base64Audio = btoa(binaryString);
                    
                    // Enviar a Deepgram (solo si está listo)
                    window.sandra.deepgramSendAudio(base64Audio)
                        .then(() => {
                            // Log solo cada 25 envíos para no saturar la consola
                            if (Math.random() < 0.04) {
                                console.log('✅ Audio enviado a Deepgram, tamaño:', base64Audio.length, 'bytes');
                            }
                        })
                        .catch(err => {
                            console.error('❌ Error enviando audio a Deepgram:', err);
                            updateDeepgramError(err);
                        });
                }
            } catch (error) {
                console.error('Error procesando audio:', error);
            }
        };
        
        source.connect(processor);
        processor.connect(audioContext.destination);
        
        // Guardar referencias (incluyendo estado de Deepgram para acceso desde callbacks)
        AppState.recordingState.audioContext = audioContext;
        AppState.recordingState.processor = processor;
        AppState.recordingState.processorNode = processor;
        AppState.recordingState.source = source;
        AppState.recordingState.stream = stream;
        AppState.recordingState.isRecording = true;
        AppState.recordingState.transcript = '';
        AppState.recordingState.startTime = Date.now();
        AppState.recordingState._audioChunks = audioChunks;
        AppState.recordingState._chunkCounter = chunkCounter;
        AppState.recordingState._deepgramReady = deepgramReady;
        AppState.recordingState._deepgramError = deepgramError;
        
        console.log('✅ AudioContext configurado, sample rate:', sampleRate);
        console.log('✅ Procesador de audio iniciado');
        
        // Actualizar UI - Nuevo diseño
        const micBtn = document.getElementById('mic-btn');
        if (micBtn) {
            micBtn.classList.add('mic-active');
            // Mostrar ecualizador cuando está grabando (llamada conversacional)
            micBtn.innerHTML = '<i class="fas fa-waveform-lines"></i>';
            micBtn.title = 'Clic para detener el dictado';
        }
        
        // También actualizar botones antiguos si existen
        const voiceBtn = document.getElementById('voiceBtn') || document.getElementById('dictateBtn');
        if (voiceBtn) {
            voiceBtn.classList.add('recording');
            voiceBtn.title = 'Clic para detener el dictado';
        }
        
        hideLoadingState();
        showToast('🎤 Dictado iniciado - Clic para detener', 'success');
        
        // Verificar límite de tiempo (20 minutos)
        AppState.recordingState.updateInterval = setInterval(() => {
            const elapsed = Date.now() - AppState.recordingState.startTime;
            if (elapsed >= AppState.recordingState.maxDuration) {
                showToast('⏱️ Tiempo máximo alcanzado (20 minutos)', 'warning');
                stopVoiceRecording();
            }
        }, 1000);
        
        // Mostrar waveform
        showAudioWaveform(stream);
        
    } catch (error) {
        console.error('Error iniciando dictado:', error);
        hideLoadingState();
        showToast('Error al iniciar dictado: ' + error.message, 'error');
        
        // Limpiar estado
        if (AppState.recordingState.stream) {
            AppState.recordingState.stream.getTracks().forEach(track => track.stop());
        }
        AppState.recordingState.isRecording = false;
    }
}

async function stopVoiceRecording() {
    if (!AppState.recordingState.isRecording) return;
    
    try {
        // Mostrar estado de carga
        showLoadingState('Procesando audio...');
        
        // Detener Deepgram Live
        await window.sandra.deepgramStopLive();
        
        // Limpiar listeners de Deepgram
        window.sandra.removeDeepgramListeners?.();
        
        // Limpiar intervalos
        if (AppState.recordingState.updateInterval) {
            clearInterval(AppState.recordingState.updateInterval);
            AppState.recordingState.updateInterval = null;
        }
        
        // Enviar cualquier chunk pendiente antes de detener
        if (AppState.recordingState._audioChunks && AppState.recordingState._audioChunks.length > 0) {
            const totalLength = AppState.recordingState._audioChunks.reduce((sum, chunk) => sum + chunk.length, 0);
            const combined = new Uint8Array(totalLength);
            let offset = 0;
            for (const chunk of AppState.recordingState._audioChunks) {
                combined.set(chunk, offset);
                offset += chunk.length;
            }
            
            let binaryString = '';
            for (let i = 0; i < combined.length; i++) {
                binaryString += String.fromCharCode(combined[i]);
            }
            const base64Audio = btoa(binaryString);
            
            await window.sandra.deepgramSendAudio(base64Audio).catch(err => {
                console.error('Error enviando audio final:', err);
            });
        }
        
        // Detener procesamiento de audio
        if (AppState.recordingState.processor) {
            AppState.recordingState.processor.disconnect();
        }
        if (AppState.recordingState.processorNode) {
            AppState.recordingState.processorNode.disconnect();
        }
        if (AppState.recordingState.source) {
            AppState.recordingState.source.disconnect();
        }
        if (AppState.recordingState.audioContext) {
            await AppState.recordingState.audioContext.close();
        }
        
        // Detener stream
        if (AppState.recordingState.stream) {
            AppState.recordingState.stream.getTracks().forEach(track => track.stop());
        }
        
        // Obtener transcripción final
        const finalTranscript = AppState.recordingState.transcript.trim();
        
        // Limpiar estado
        AppState.recordingState.isRecording = false;
        AppState.recordingState.audioContext = null;
        AppState.recordingState.processor = null;
        AppState.recordingState.source = null;
        AppState.recordingState.stream = null;
        AppState.recordingState.transcript = '';
        
        // Actualizar UI - Nuevo diseño
        const micBtn = document.getElementById('mic-btn');
        if (micBtn) {
            micBtn.classList.remove('mic-active');
            micBtn.innerHTML = '<i class="fas fa-microphone"></i>';
            micBtn.title = 'Dictar con voz';
        }
        
        // También actualizar botones antiguos si existen
        const voiceBtn = document.getElementById('voiceBtn') || document.getElementById('dictateBtn');
        if (voiceBtn) {
            voiceBtn.classList.remove('recording');
            voiceBtn.title = 'Dictar';
        }
        
        // Ocultar indicador de grabación
        const recordingIndicator = document.getElementById('recordingIndicator');
        if (recordingIndicator) {
            recordingIndicator.classList.remove('active');
        }
        
        hideAudioWaveform();
        hideLoadingState();
        
        // Si hay texto transcrito, enviarlo automáticamente (estilo ChatGPT)
        if (finalTranscript && finalTranscript.length > 0) {
            const input = document.getElementById('chatInput');
            if (input) {
                input.value = finalTranscript;
                autoResize(input);
                
                // Enviar automáticamente después de un breve delay (estilo ChatGPT)
                setTimeout(() => {
                    sendMessage();
                }, 300);
                
                showToast('✅ Mensaje enviado', 'success');
            }
        } else {
            showToast('⚠️ No se detectó audio', 'warning');
        }
        
    } catch (error) {
        console.error('Error deteniendo dictado:', error);
        hideLoadingState();
        showToast('Error al procesar audio: ' + error.message, 'error');
        
        // Limpiar estado de todos modos
        AppState.recordingState.isRecording = false;
        if (AppState.recordingState.stream) {
            AppState.recordingState.stream.getTracks().forEach(track => track.stop());
        }
    }
}

function showLoadingState(message = 'Cargando audio...') {
    const input = document.getElementById('chatInput');
    // Usar cursor-chat-bar como contenedor (nueva implementación)
    const inputWrapper = document.querySelector('.cursor-chat-bar');
    
    if (!inputWrapper) {
        console.warn('⚠️ cursor-chat-bar no encontrado para mostrar loading');
        return;
    }
    
    // Crear o actualizar indicador de carga
    let loadingIndicator = document.getElementById('audioLoadingIndicator');
    if (!loadingIndicator) {
        loadingIndicator = document.createElement('div');
        loadingIndicator.id = 'audioLoadingIndicator';
        loadingIndicator.className = 'audio-loading-indicator glass-morph';
        inputWrapper.appendChild(loadingIndicator);
    }
    
    loadingIndicator.innerHTML = `
        <div class="loading-spinner"></div>
        <span class="loading-text">${message}</span>
    `;
    loadingIndicator.style.display = 'flex';
    input.style.opacity = '0.5';
    input.disabled = true;
}

function hideLoadingState() {
    const input = document.getElementById('chatInput');
    const loadingIndicator = document.getElementById('audioLoadingIndicator');
    
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
    
    input.style.opacity = '1';
    input.disabled = false;
}

function showToast(message, type = 'info') {
    // Crear toast si no existe
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    toastContainer.appendChild(toast);
    
    // Animar entrada
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function showAudioWaveform(stream) {
    const canvas = document.getElementById('audioWaveform');
    const input = document.getElementById('chatInput');
    
    canvas.style.display = 'block';
    input.style.display = 'none';
    
    // Audio visualization logic would go here
    // This would use the Web Audio API to create a waveform visualization
}

function hideAudioWaveform() {
    const canvas = document.getElementById('audioWaveform');
    const input = document.getElementById('chatInput');
    
    canvas.style.display = 'none';
    input.style.display = 'block';
}

// Continuous recording mode (ChatGPT style)
function toggleRecording() {
    const recordBtn = document.getElementById('recordBtn');
    
    if (AppState.recordingState.isRecording) {
        stopContinuousRecording();
        recordBtn.classList.remove('recording');
    } else {
        startContinuousRecording();
        recordBtn.classList.add('recording');
    }
}

async function startContinuousRecording() {
    // Implementation for continuous recording with DeepGram streaming
    // This would maintain a persistent WebSocket connection to DeepGram
    console.log('Starting continuous recording mode...');
}

function stopContinuousRecording() {
    console.log('Stopping continuous recording mode...');
}

// ═══════════════════════════════════════════════════════════════════
// CAMERA
// ═══════════════════════════════════════════════════════════════════

let cameraStream = null;
let currentCamera = 'user'; // 'user' for front, 'environment' for back

function openCamera() {
    const modal = document.getElementById('cameraModal');
    const video = document.getElementById('cameraVideo');
    
    navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: currentCamera } 
    })
    .then(stream => {
        cameraStream = stream;
        video.srcObject = stream;
        modal.classList.add('show');
    })
    .catch(err => {
        console.error('Camera error:', err);
        alert('No se pudo acceder a la cámara');
    });
}

function closeCamera() {
    const modal = document.getElementById('cameraModal');
    const video = document.getElementById('cameraVideo');
    
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    
    video.srcObject = null;
    modal.classList.remove('show');
}

function capturePhoto() {
    const video = document.getElementById('cameraVideo');
    const canvas = document.getElementById('cameraCanvas');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    addAttachedImage(dataUrl);
    
    closeCamera();
}

function switchCamera() {
    currentCamera = currentCamera === 'user' ? 'environment' : 'user';
    
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
    }
    
    const video = document.getElementById('cameraVideo');
    navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: currentCamera } 
    })
    .then(stream => {
        cameraStream = stream;
        video.srcObject = stream;
    })
    .catch(err => {
        console.error('Switch camera error:', err);
    });
}

// ═══════════════════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════════════════

function openSettings() {
    const modal = document.getElementById('settingsModal');
    modal.classList.add('show');
    loadSettings();
}

function closeSettings() {
    const modal = document.getElementById('settingsModal');
    modal.classList.remove('show');
}

function showPanel(panelId) {
    // Update nav
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.panel === panelId);
    });
    
    // Update panels
    document.querySelectorAll('.panel').forEach(panel => {
        panel.classList.toggle('active', panel.id === `panel-${panelId}`);
    });
}

function loadSettings() {
    // Load all settings from localStorage
    const settings = {
        temperature: AppState.modelConfig.temperature,
        maxTokens: AppState.modelConfig.maxTokens,
        ollamaUrl: localStorage.getItem('ollamaUrl') || 'http://localhost:11434',
        ...AppState.apiKeys
    };
    
    // Apply to form
    Object.entries(settings).forEach(([key, value]) => {
        const element = document.getElementById(key);
        if (element) {
            element.value = value;
        }
    });
    
    // Update temperature display
    document.getElementById('tempValue').textContent = settings.temperature;
}

function saveSettings() {
    // Save all settings
    AppState.modelConfig.temperature = parseFloat(document.getElementById('temperature').value);
    AppState.modelConfig.maxTokens = parseInt(document.getElementById('maxTokens').value);
    
    // Save API keys
    const keys = [
        'openaiKey', 'anthropicKey', 'geminiKey', 'groqKey',
        'deepgramKey', 'heygenKey', 'cartesiaKey'
    ];
    
    keys.forEach(key => {
        const value = document.getElementById(key)?.value;
        if (value) {
            AppState.apiKeys[key] = value;
            localStorage.setItem(key, value);
        }
    });
    
    // Save other settings
    localStorage.setItem('ollamaUrl', document.getElementById('ollamaUrl').value);
    localStorage.setItem('deepgramModel', document.getElementById('deepgramModel')?.value || 'nova-2');
    localStorage.setItem('deepgramLanguage', document.getElementById('deepgramLanguage')?.value || 'es');
    
    closeSettings();
}

function updateTempValue(input) {
    document.getElementById('tempValue').textContent = input.value;
}

function clearCache() {
    if (confirm('¿Estás seguro de que quieres limpiar el caché?')) {
        localStorage.clear();
        location.reload();
    }
}

function resetSettings() {
    if (confirm('¿Estás seguro de que quieres restablecer toda la configuración?')) {
        localStorage.clear();
        location.reload();
    }
}

// ═══════════════════════════════════════════════════════════════════
// CHAT MANAGEMENT
// ═══════════════════════════════════════════════════════════════════

function newChat() {
    AppState.messages = [];
    AppState.currentConversationId = null;
    
    const container = document.getElementById('chatMessages');
    container.innerHTML = `
        <div class="welcome-screen glass-morph">
            <div class="welcome-logo animate-float">S</div>
            <h1 class="gradient-text">Sandra Studio Ultimate</h1>
            <p class="subtitle">Asistente IA Multimodal de Nivel Enterprise</p>
            <div class="welcome-features">
                <div class="feature-badge">
                    <span class="badge-icon">🎯</span>
                    <span>Modelos Premium</span>
                </div>
                <div class="feature-badge">
                    <span class="badge-icon">🎤</span>
                    <span>Voz Natural</span>
                </div>
                <div class="feature-badge">
                    <span class="badge-icon">👁️</span>
                    <span>Visión Avanzada</span>
                </div>
                <div class="feature-badge">
                    <span class="badge-icon">🤖</span>
                    <span>Avatar Realista</span>
                </div>
            </div>
        </div>
    `;
    
    // Clear attachments
    AppState.attachedImages = [];
    updateAttachmentsUI();
    
    // Focus input
    document.getElementById('chatInput').focus();
}

function loadConversations() {
    // Load saved conversations from localStorage
    // Usar storage-helpers para cargar conversaciones
    const saved = window.safeLocalStorageGet
        ? window.safeLocalStorageGet('conversations', null)
        : localStorage.getItem('conversations');
    
    if (saved) {
        // Usar safeJSONParse para parsear conversaciones
        const conversations = window.safeJSONParse
            ? window.safeJSONParse(saved, [])
            : (() => {
                try {
                    return JSON.parse(saved);
                } catch (e) {
                    if (window.handleStorageError) {
                        window.handleStorageError(e, 'loadConversations', { key: 'conversations' });
                    }
                    return [];
                }
            })();
        
        if (conversations && conversations.length > 0) {
            updateConversationsList(conversations);
        }
    }
}

function updateConversationsList(conversations) {
    const historyEl = document.getElementById('chatHistory');
    historyEl.innerHTML = conversations.map(conv => `
        <div class="history-item glass-morph" data-id="${conv.id}">
            <span class="history-icon">💬</span>
            <span class="history-title">${conv.title}</span>
            <span class="history-time">${formatTime(conv.timestamp)}</span>
        </div>
    `).join('');
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'ahora';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return date.toLocaleDateString();
}

// ═══════════════════════════════════════════════════════════════════
// KEYBOARD SHORTCUTS
// ═══════════════════════════════════════════════════════════════════

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K: New chat
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            newChat();
        }
        
        // Ctrl/Cmd + /: Focus input
        if ((e.ctrlKey || e.metaKey) && e.key === '/') {
            e.preventDefault();
            document.getElementById('chatInput').focus();
        }
        
        // Ctrl/Cmd + ,: Open settings
        if ((e.ctrlKey || e.metaKey) && e.key === ',') {
            e.preventDefault();
            openSettings();
        }
        
        // Escape: Close modals
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.show').forEach(modal => {
                modal.classList.remove('show');
            });
            hideContextMenu();
        }
    });
}

// ═══════════════════════════════════════════════════════════════════
// WEBSOCKET CONNECTIONS
// ═══════════════════════════════════════════════════════════════════

function initializeWebSockets() {
    // Initialize WebSocket connections for real-time features
    // This would connect to DeepGram streaming, HeyGen avatar, etc.
}

function checkModelAvailability() {
    // Check which models are available based on API keys
    const available = {
        openai: !!AppState.apiKeys.openaiKey,
        anthropic: !!AppState.apiKeys.anthropicKey,
        gemini: !!AppState.apiKeys.geminiKey,
        groq: !!AppState.apiKeys.groqKey,
        ollama: true // Always available if running locally
    };
    
    console.log('Available providers:', available);
}

// ═══════════════════════════════════════════════════════════════════
// DEEPGRAM INTEGRATION
// ═══════════════════════════════════════════════════════════════════

function initializeDeepGram() {
    // Initialize DeepGram for voice transcription
    console.log('Initializing DeepGram...');
}

// ═══════════════════════════════════════════════════════════════════
// HEYGEN AVATAR
// ═══════════════════════════════════════════════════════════════════

function initializeHeyGenAvatar() {
    // Initialize HeyGen avatar system
    console.log('Initializing HeyGen Avatar...');
}

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// EXPORTS GLOBALES - SINGLE SOURCE OF TRUTH
// ═══════════════════════════════════════════════════════════════════

// Exponer MODELS globalmente (UNA SOLA VEZ)
window.MODELS = MODELS;

// Funciones de UI
window.toggleTheme = toggleTheme;
window.toggleAgentMenu = toggleAgentMenu;
window.selectAgentMode = selectAgentMode;
window.handleKeydown = handleKeydown;
window.autoResize = autoResize;

// Funciones de modelos (delegadas a model-selector.js cuando sea posible)
// NOTA: Estas funciones se mantienen para compatibilidad con HTML onclick
// pero model-selector.js tiene su propia lógica interna
window.selectModel = selectModel;
window.filterModels = filterModels;
window.initModelList = initModelList;
window.toggleAutoMode = toggleAutoMode;
window.toggleMaxMode = toggleMaxMode;
window.toggleMultiModel = toggleMultiModel;
window.showAddModelModal = showAddModelModal;

// Funciones de modo
window.setMode = setMode;

window.autoResize = autoResize;
window.sendMessage = sendMessage;
window.stopGeneration = stopGeneration;
window.attachImage = attachImage;
window.handleFileSelect = handleFileSelect;
window.removeAttachment = removeAttachment;
window.openCamera = openCamera;
window.closeCamera = closeCamera;
window.capturePhoto = capturePhoto;
window.switchCamera = switchCamera;
window.toggleVoice = toggleVoice;
window.toggleDictation = toggleVoice; // Alias para el botón del HTML
window.toggleRecording = toggleRecording;
window.newChat = newChat;
window.openSettings = openSettings;

// Función para iniciar llamada conversacional (con ecualizador)
window.startVoiceCall = async function() {
    // Por ahora, activa el dictado (llamada conversacional)
    // En el futuro, esto puede iniciar una llamada de voz completa
    if (window.toggleDictation) {
        await window.toggleDictation();
    }
};
window.closeSettings = closeSettings;
window.showPanel = showPanel;
window.updateTempValue = updateTempValue;
window.saveSettings = saveSettings;
window.clearCache = clearCache;
window.resetSettings = resetSettings;
// Funciones del menú contextual deshabilitadas - usar menú nativo
window.showContextMenu = showContextMenu;
window.hideContextMenu = hideContextMenu;
window.contextAction = contextAction;
window.handlePaste = handlePaste;

// Sandra window controls
window.sandra = {
    minimize: () => {
        if (window.electronAPI) {
            window.electronAPI.minimize();
        }
    },
    maximize: () => {
        if (window.electronAPI) {
            window.electronAPI.maximize();
        }
    },
    close: () => {
        if (window.electronAPI) {
            window.electronAPI.close();
        }
    }
};

// ═══════════════════════════════════════════════════════════════════
// MINI APLICACIÓN DE VIDELLAMADA/AVATAR (Solo diseño visual)
// ═══════════════════════════════════════════════════════════════════

// Inicialización de la mini app (solo visual, sin lógica de botones todavía)
document.addEventListener('DOMContentLoaded', () => {
    // La mini app está en el HTML, solo necesitamos asegurar que se vea correctamente
    const miniApp = document.getElementById('call-mini-app');
    if (miniApp) {
        console.log('✅ Mini aplicación de videollamada cargada (solo diseño visual)');
    }
    
    // Actualizar indicador de grabación
    const micBtn = document.getElementById('mic-btn');
    const recordingIndicator = document.getElementById('recordingIndicator');
    
    if (micBtn) {
        // Conectar con toggleDictation existente
        micBtn.addEventListener('click', () => {
            if (window.toggleDictation) {
                window.toggleDictation();
            }
        });
    }
    
    // Actualizar indicador de grabación periódicamente
    setInterval(() => {
        if (AppState && AppState.recordingState && AppState.recordingState.isRecording && recordingIndicator) {
            const elapsed = Date.now() - AppState.recordingState.startTime;
            const sec = Math.floor((elapsed / 1000) % 60);
            const min = Math.floor(elapsed / 60000);
            recordingIndicator.textContent = `Grabando... ${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
            recordingIndicator.classList.add('active');
        } else if (recordingIndicator) {
            recordingIndicator.classList.remove('active');
        }
        
        // Actualizar estado del botón de micrófono
        if (micBtn) {
            if (AppState && AppState.recordingState && AppState.recordingState.isRecording) {
                micBtn.classList.add('mic-active');
                // Mostrar ecualizador cuando está grabando (llamada conversacional)
                micBtn.innerHTML = '<i class="fas fa-waveform-lines"></i>';
            } else {
                micBtn.classList.remove('mic-active');
                micBtn.innerHTML = '<i class="fas fa-microphone"></i>';
            }
        }
    }, 1000);
});


