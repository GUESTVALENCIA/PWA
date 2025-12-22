// ═══════════════════════════════════════════════════════════════════
// CONTEXT CALCULATOR - Calcula el porcentaje de contexto usado
// Estilo Cursor
// ═══════════════════════════════════════════════════════════════════

class ContextCalculator {
    constructor() {
        this.updateInterval = null;
        this.init();
    }
    
    init() {
        // Calcular contexto inicial
        this.updateContextUsage();
        
        // Actualizar cada 2 segundos
        this.updateInterval = setInterval(() => {
            this.updateContextUsage();
        }, 2000);
    }
    
    calculateContextUsage() {
        if (!window.AppState || !window.AppState.messages) {
            return { used: 0, total: 0, percent: 0 };
        }
        
        const messages = window.AppState.messages;
        const currentProvider = window.AppState.currentProvider || 'auto';
        const currentModel = window.AppState.currentModel || 'auto';
        
        // Obtener límite de tokens del modelo actual
        let maxTokens = 128000; // Default
        
        if (currentProvider !== 'auto' && window.MODELS && window.MODELS[currentProvider]) {
            const modelInfo = window.MODELS[currentProvider][currentModel];
            if (modelInfo && modelInfo.tokens) {
                // Convertir tokens string a número (ej: "128K" -> 128000)
                const tokensStr = modelInfo.tokens.toString();
                if (tokensStr.includes('K')) {
                    maxTokens = parseFloat(tokensStr) * 1000;
                } else if (tokensStr.includes('M')) {
                    maxTokens = parseFloat(tokensStr) * 1000000;
                } else {
                    maxTokens = parseFloat(tokensStr);
                }
            }
        }
        
        // Estimar tokens usados (aproximación: 1 token ≈ 4 caracteres)
        let totalChars = 0;
        messages.forEach(msg => {
            if (msg.content) {
                totalChars += msg.content.length;
            }
            if (msg.images && msg.images.length > 0) {
                // Imágenes consumen más tokens (estimación: ~85 tokens por imagen)
                totalChars += msg.images.length * 340; // 85 tokens * 4 chars
            }
        });
        
        const usedTokens = Math.ceil(totalChars / 4);
        const percent = Math.min((usedTokens / maxTokens) * 100, 100);
        
        return {
            used: usedTokens,
            total: maxTokens,
            percent: Math.round(percent * 10) / 10 // Redondear a 1 decimal
        };
    }
    
    updateContextUsage() {
        const context = this.calculateContextUsage();
        const indicator = document.getElementById('contextIndicator');
        const percentEl = document.getElementById('contextPercent');
        const progressCircle = document.querySelector('.context-progress');
        
        if (!indicator || !percentEl || !progressCircle) return;
        
        // Actualizar porcentaje
        percentEl.textContent = `${context.percent}%`;
        
        // Actualizar círculo SVG
        const circumference = 2 * Math.PI * 16; // radio = 16
        const offset = circumference - (context.percent / 100) * circumference;
        progressCircle.style.strokeDashoffset = offset;
        
        // Cambiar color según uso
        if (context.percent >= 90) {
            progressCircle.style.stroke = '#ef4444'; // Rojo
            indicator.style.color = '#ef4444';
        } else if (context.percent >= 75) {
            progressCircle.style.stroke = '#f59e0b'; // Naranja
            indicator.style.color = '#f59e0b';
        } else if (context.percent >= 50) {
            progressCircle.style.stroke = '#eab308'; // Amarillo
            indicator.style.color = '#eab308';
        } else {
            progressCircle.style.stroke = '#4a9eff'; // Azul
            indicator.style.color = '#4a9eff';
        }
        
        // Actualizar tooltip
        indicator.title = `Contexto usado: ${context.used.toLocaleString()} / ${context.total.toLocaleString()} tokens (${context.percent}%)`;
    }
    
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }
}

// Inicializar cuando el DOM esté listo
let contextCalculator = null;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            contextCalculator = new ContextCalculator();
            window.contextCalculator = contextCalculator;
        }, 500);
    });
} else {
    setTimeout(() => {
        contextCalculator = new ContextCalculator();
        window.contextCalculator = contextCalculator;
    }, 500);
}

