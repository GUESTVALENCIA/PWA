/**
 * LLM Provider Selector Widget
 * ============================
 * UI component for switching between LLM providers
 * Supports: OpenAI, Groq, Anthropic, Google Gemini
 */

class LLMProviderSelector {
  constructor(containerId = 'llm-provider-selector') {
    this.containerId = containerId;
    this.currentProvider = localStorage.getItem('llm_provider') || 'openai';
    this.init();
  }

  init() {
    // Wait for websocket client to be ready
    const waitForClient = setInterval(() => {
      if (window.websocketStreamClient && window.websocketStreamClient.isConnected) {
        clearInterval(waitForClient);
        this.render();
        this.attachEventListeners();
      }
    }, 100);

    // Timeout after 10 seconds
    setTimeout(() => clearInterval(waitForClient), 10000);
  }

  render() {
    let container = document.getElementById(this.containerId);

    // Si no existe el contenedor, créalo dinámicamente
    if (!container) {
      container = document.createElement('div');
      container.id = this.containerId;
      container.style.cssText = `
        position: fixed;
        bottom: 100px;
        right: 20px;
        z-index: 999;
        max-width: 380px;
      `;
      document.body.appendChild(container);
    }

    const availableProviders = window.websocketStreamClient.availableProviders || ['openai'];
    const currentProvider = window.websocketStreamClient.llmProvider;

    const html = `
      <div class="llm-provider-container" style="
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 12px;
        padding: 16px;
        margin: 16px 0;
        color: white;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
      ">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
          <div>
            <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">
              🤖 Modelo de IA
            </h3>
            <p style="margin: 0; font-size: 12px; opacity: 0.9;">
              Proveedor actual: <strong>${currentProvider.toUpperCase()}</strong>
            </p>
          </div>

          <select id="llm-provider-select" style="
            padding: 8px 12px;
            border-radius: 6px;
            border: none;
            background: white;
            color: #333;
            font-weight: 500;
            cursor: pointer;
            min-width: 150px;
          ">
            ${availableProviders.map(provider => `
              <option value="${provider}" ${provider === currentProvider ? 'selected' : ''}>
                ${this.getProviderLabel(provider)}
              </option>
            `).join('')}
          </select>
        </div>

        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.2);">
          <div style="font-size: 11px; opacity: 0.85;">
            <div style="margin-bottom: 6px;">
              ${this.getProviderInfo(currentProvider)}
            </div>
            <div style="font-size: 10px; opacity: 0.7;">
              ℹ️ Cambio automático sin reinicio
            </div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  getProviderLabel(provider) {
    const labels = {
      'openai': '🔴 OpenAI (gpt-4o-mini)',
      'groq': '⚡ Groq (Free!)',
      'anthropic': '🧠 Anthropic (Claude)',
      'gemini': '🔵 Google Gemini'
    };
    return labels[provider] || provider;
  }

  getProviderInfo(provider) {
    const info = {
      'openai': '💰 Modelo: gpt-4o-mini | Costo: $0.30/llamada | Calidad: ⭐⭐⭐⭐⭐',
      'groq': '✅ Modelo: mixtral-8x7b | Costo: GRATIS | Latencia: 1-2s ⚡',
      'anthropic': '💎 Modelo: claude-3.5 sonnet | Costo: $0.20/llamada | Calidad: ⭐⭐⭐⭐⭐',
      'gemini': '💰 Modelo: gemini-1.5-flash | Costo: $0.008/llamada | Rápido: ⚡'
    };
    return info[provider] || `Proveedor: ${provider}`;
  }

  attachEventListeners() {
    const select = document.getElementById('llm-provider-select');
    if (!select) return;

    select.addEventListener('change', (e) => {
      const provider = e.target.value;
      console.log(`[SELECTOR] Cambiando a ${provider}...`);

      window.websocketStreamClient.setProvider(provider);

      // Re-render to update info
      setTimeout(() => this.render(), 500);

      console.log(`[SELECTOR] ✅ Proveedor cambiado a ${provider}`);
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.llmProviderSelector = new LLMProviderSelector();
  });
} else {
  window.llmProviderSelector = new LLMProviderSelector();
}

console.log('[LLM-SELECTOR] ✅ Selector de proveedores cargado');
