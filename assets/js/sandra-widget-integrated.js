
// sandra-widget-integrated.js
// Integrates UI with Netlify Functions Gateway (MCP)

import { SandraGateway } from './sandra-gateway.js';

class SandraWidget {
    constructor() {
        this.gateway = new SandraGateway();
        this.isOpen = false;
        this.isRecording = false;

        this.init();
    }

    init() {
        this.createWidgetUI();
        this.bindEvents();
    }

    createWidgetUI() {
        const widgetHTML = `
            <div id="sandra-widget-root" class="fixed bottom-4 right-4 z-50 font-sans">
                <!-- Floating Button -->
                <button id="sandra-toggle-btn" class="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl hover:scale-105 transition-transform flex items-center justify-center group overflow-hidden border-2 border-white/20">
                    <span class="text-2xl group-hover:hidden"></span>
                    <img src="/assets/images/sandra-avatar.png" onerror="this.style.display='none'" class="hidden group-hover:block w-full h-full object-cover">
                    <!-- Status Indicator -->
                    <span class="absolute top-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                </button>

                <!-- Chat Window -->
                <div id="sandra-chat-window" class="hidden absolute bottom-16 right-0 w-[320px] h-[450px] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 transform origin-bottom-right transition-all duration-300 scale-95 opacity-0">
                    <!-- Header -->
                    <div class="p-3 bg-gradient-to-r from-[#0F172A] to-[#1E293B] text-white flex justify-between items-center">
                        <div class="flex items-center gap-2">
                            <div class="relative">
                                <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-400 to-purple-500 flex items-center justify-center text-sm font-bold">S</div>
                                <div class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-[#0F172A] rounded-full animate-pulse"></div>
                            </div>
                            <div>
                                <h3 class="font-bold text-xs">Sandra IA</h3>
                                <p class="text-[10px] text-blue-200">Asistente Virtual 24/7</p>
                            </div>
                        </div>
                        <button id="sandra-close-btn" class="text-white/60 hover:text-white transition-colors text-lg leading-none"></button>
                    </div>

                    <!-- Role Selector -->
                    <div class="bg-indigo-50 px-3 py-1.5 border-b border-indigo-100 flex items-center gap-2">
                        <span class="text-[10px] font-bold text-indigo-800 uppercase tracking-wider">Modo:</span>
                        <select id="sandra-role-select" class="bg-transparent text-xs font-medium text-indigo-900 focus:outline-none cursor-pointer">
                            <option value="hospitality"> Hospitality</option>
                            <option value="luxury"> Concierge Lujo</option>
                            <option value="support"> Soporte Técnico</option>
                        </select>
                    </div>

                    <!-- Messages Area -->
                    <div id="sandra-messages" class="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50 scroll-smooth">
                        <!-- Welcome Message -->
                        <div class="flex gap-2">
                            <div class="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-400 to-purple-500 flex-shrink-0 flex items-center justify-center text-[10px] text-white font-bold">S</div>
                            <div class="bg-white p-2.5 rounded-xl rounded-tl-none shadow-sm border border-slate-100 text-xs text-slate-700 max-w-[85%]">
                                <p>¡Hola! Soy Sandra. Bienvenid@ a GuestsValencia. ¿En qué puedo ayudarte hoy?</p>
                            </div>
                        </div>
                    </div>

                    <!-- Typing Indicator -->
                    <div id="sandra-typing" class="hidden px-3 py-1.5 text-[10px] text-slate-400 italic">
                        Sandra está escribiendo...
                    </div>

                    <!-- Input Area -->
                    <div class="p-3 bg-white border-t border-slate-100">
                        <div class="relative flex items-center gap-1.5">
                            <input type="text" id="sandra-input" placeholder="Escribe tu mensaje..." class="flex-1 bg-slate-100 border-0 rounded-full px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all">
                            
                            <!-- Voice Button -->
                            <button id="sandra-mic-btn" class="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-600 transition-colors">
                                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                            </button>

                            <!-- Send Button -->
                            <button id="sandra-send-btn" class="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-blue-500/30 transition-all">
                                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                            </button>
                        </div>
                        <div class="text-[9px] text-center text-slate-400 mt-1">
                            Powered by Gemini & GPT-4o
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', widgetHTML);
    }

    bindEvents() {
        const toggleBtn = document.getElementById('sandra-toggle-btn');
        const closeBtn = document.getElementById('sandra-close-btn');
        const chatWindow = document.getElementById('sandra-chat-window');
        const sendBtn = document.getElementById('sandra-send-btn');
        const input = document.getElementById('sandra-input');

        const toggleChat = () => {
            this.isOpen = !this.isOpen;
            if (this.isOpen) {
                chatWindow.classList.remove('hidden');
                setTimeout(() => {
                    chatWindow.classList.remove('scale-95', 'opacity-0');
                    chatWindow.classList.add('scale-100', 'opacity-100');
                    input.focus();
                }, 10);
            } else {
                chatWindow.classList.remove('scale-100', 'opacity-100');
                chatWindow.classList.add('scale-95', 'opacity-0');
                setTimeout(() => chatWindow.classList.add('hidden'), 300);
            }
        };

        toggleBtn.addEventListener('click', toggleChat);
        closeBtn.addEventListener('click', toggleChat);

        const sendMessage = async () => {
            const text = input.value.trim();
            if (!text) return;

            // Add user message
            this.addMessage(text, 'user');
            input.value = '';

            // Show typing
            this.showTyping(true);

            // Call Gateway
            try {
                const response = await this.gateway.sendMessage(text);
                this.showTyping(false);
                this.addMessage(response, 'bot');
            } catch (error) {
                this.showTyping(false);
                this.addMessage("Lo siento, tuve un problema de conexión. Inténtalo de nuevo.", 'bot');
            }
        };

        sendBtn.addEventListener('click', sendMessage);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }

    addMessage(text, type) {
        const messagesContainer = document.getElementById('sandra-messages');
        const isUser = type === 'user';

        const html = `
            <div class="flex gap-2 ${isUser ? 'flex-row-reverse' : ''}">
                ${!isUser ? '<div class="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-400 to-purple-500 flex-shrink-0 flex items-center justify-center text-[10px] text-white font-bold">S</div>' : ''}
                <div class="${isUser ? 'bg-blue-600 text-white' : 'bg-white border border-slate-100 text-slate-700'} p-2.5 rounded-xl ${isUser ? 'rounded-tr-none' : 'rounded-tl-none'} shadow-sm text-xs max-w-[85%]">
                    <p>${text}</p>
                </div>
            </div>
        `;

        messagesContainer.insertAdjacentHTML('beforeend', html);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    showTyping(show) {
        const typing = document.getElementById('sandra-typing');
        if (show) typing.classList.remove('hidden');
        else typing.classList.add('hidden');
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    new SandraWidget();
});
