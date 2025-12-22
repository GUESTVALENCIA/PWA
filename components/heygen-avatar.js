// ═══════════════════════════════════════════════════════════════════
// HEYGEN AVATAR INTEGRATION - Real-time Avatar System con SDK
// Sandra Studio Ultimate - Enterprise Edition
// Usando @heygen/streaming-avatar SDK v1.0.11
// ═══════════════════════════════════════════════════════════════════

// Importar SDK de HeyGen desde CDN
import StreamingAvatar, { AvatarQuality, TaskType } from 'https://cdn.jsdelivr.net/npm/@heygen/streaming-avatar@1.0.11/+esm';

// ═══════════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════════

const AVATAR_ID = 'e710fd953c094f398dd7e94c3554254f'; // Elena - Avatar público de HeyGen
const VOICE_ID = '2d5b0e6cf361460aa7fc47e3cee4b30c'; // Voz en español

// ═══════════════════════════════════════════════════════════════════
// CLASE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════

class HeyGenAvatarSystem {
    constructor() {
        this.apiKey = null;
        this.avatar = null;
        this.token = null;
        this.isInitialized = false;
        this.isActive = false;
        
        // UI Elements
        this.avatarVideo = null;
        this.avatarPlaceholder = null;
        
        // Estado
        this.state = {
            isConnected: false,
            isSpeaking: false,
            isPaused: false
        };
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // INICIALIZACIÓN
    // ═══════════════════════════════════════════════════════════════════
    
    async initialize() {
        try {
            // Obtener API Key desde localStorage
            this.apiKey = localStorage.getItem('heygenKey');
            
            // Si no está en localStorage, intentar obtener desde .env.pro vía IPC
            if (!this.apiKey && window.sandra && window.sandra.getHeyGenKey) {
                try {
                    this.apiKey = await window.sandra.getHeyGenKey();
                    if (this.apiKey) {
                        localStorage.setItem('heygenKey', this.apiKey);
                    }
                } catch (error) {
                    console.warn('⚠️ No se pudo obtener HeyGen key desde IPC:', error);
                }
            }
            
            if (!this.apiKey) {
                console.warn('⚠️ HeyGen API Key no configurada');
                return false;
            }
        
            // Obtener elementos del DOM
        this.avatarVideo = document.getElementById('avatarVideo');
            this.avatarPlaceholder = document.getElementById('avatarPlaceholder');
            
            if (!this.avatarVideo) {
                console.error('❌ Elemento avatarVideo no encontrado en el DOM');
                return false;
            }
            
            console.log('✅ HeyGen Avatar System inicializado');
            this.isInitialized = true;
            return true;
            
        } catch (error) {
            console.error('❌ Error inicializando HeyGen Avatar:', error);
            return false;
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // OBTENER TOKEN DE ACCESO
    // ═══════════════════════════════════════════════════════════════════
    
    async fetchAccessToken() {
        try {
            console.log('🔄 Obteniendo token de acceso de HeyGen...');
            
            const response = await fetch('https://api.heygen.com/v1/streaming.task', {
                method: 'POST',
                headers: {
                    'X-Api-Key': this.apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    avatar_name: AVATAR_ID,
                    quality: 'high'
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Error obteniendo token: ${response.status} - ${errorData.message || response.statusText}`);
            }
            
            const data = await response.json();
            
            // El token puede venir en diferentes formatos según la API
            if (data.data && data.data.token) {
                this.token = data.data.token;
            } else if (data.token) {
                this.token = data.token;
            } else if (data.data && data.data.session_id) {
                // Si no hay token directo, usar session_id para crear el avatar
                this.token = data.data.session_id;
            } else {
                throw new Error('Token no encontrado en la respuesta de HeyGen');
            }
            
            console.log('✅ Token obtenido correctamente');
            return this.token;
            
        } catch (error) {
            console.error('❌ Error obteniendo token:', error);
            throw error;
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // INICIAR AVATAR
    // ═══════════════════════════════════════════════════════════════════
    
    async startAvatar() {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }
            
            if (this.isActive) {
                console.log('⚠️ Avatar ya está activo');
                return true;
            }
            
            // 1. Obtener token
            await this.fetchAccessToken();
            
            if (!this.token) {
                throw new Error('No se pudo obtener el token de acceso');
            }
            
            // 2. Crear instancia del SDK
            console.log('🔄 Inicializando SDK de HeyGen...');
            this.avatar = new StreamingAvatar({ token: this.token });
            
            // 3. Iniciar sesión de avatar
            console.log('🔄 Iniciando sesión de avatar...');
            const sessionData = await this.avatar.createStartAvatar({
                quality: AvatarQuality.High,
                avatarName: AVATAR_ID
            });
            
            // 4. Conectar el stream de video al elemento HTML
            if (this.avatar.stream) {
                this.avatarVideo.srcObject = this.avatar.stream;
                await this.avatarVideo.play();
                
                // Mostrar video y ocultar placeholder
                if (this.avatarPlaceholder) {
                    this.avatarPlaceholder.style.display = 'none';
                }
                this.avatarVideo.style.display = 'block';
                this.avatarVideo.classList.add('active');
                
                console.log('✅ Avatar iniciado correctamente');
                this.isActive = true;
                this.state.isConnected = true;
                
                return true;
            } else {
                throw new Error('No se recibió stream de video del avatar');
            }
            
        } catch (error) {
            console.error('❌ Error iniciando avatar:', error);
            this.isActive = false;
            this.state.isConnected = false;
            throw error;
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // HABLAR CON EL AVATAR
    // ═══════════════════════════════════════════════════════════════════
    
    async speak(text) {
        try {
            if (!this.isActive || !this.avatar) {
                console.warn('⚠️ Avatar no está activo, iniciando...');
                await this.startAvatar();
            }
            
            if (!this.avatar) {
                throw new Error('Avatar no inicializado');
            }
            
            console.log(`🗣️ Avatar hablando: "${text.substring(0, 50)}..."`);
            
            this.state.isSpeaking = true;
            this.avatarVideo?.classList.add('speaking');
            
            // Usar el método speak del SDK
            await this.avatar.speak({
                text: text,
                task_type: TaskType.TALK
            });
            
            // Esperar a que termine de hablar (aproximado)
            // Nota: El SDK debería emitir eventos cuando termine, pero por ahora usamos un timeout
            setTimeout(() => {
                this.state.isSpeaking = false;
                this.avatarVideo?.classList.remove('speaking');
            }, text.length * 50); // Estimación: ~50ms por carácter
            
            return true;
            
        } catch (error) {
            console.error('❌ Error haciendo hablar al avatar:', error);
            this.state.isSpeaking = false;
            this.avatarVideo?.classList.remove('speaking');
            throw error;
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // DETENER AVATAR
    // ═══════════════════════════════════════════════════════════════════
    
    async stopAvatar() {
        try {
            if (!this.avatar || !this.isActive) {
                return true;
            }
            
            console.log('🛑 Deteniendo avatar...');
            
            // Detener el avatar usando el SDK
            if (this.avatar.stopAvatar) {
                await this.avatar.stopAvatar();
            }
            
            // Limpiar stream
            if (this.avatarVideo) {
                this.avatarVideo.srcObject = null;
                this.avatarVideo.style.display = 'none';
                this.avatarVideo.classList.remove('active', 'speaking');
            }
            
            // Mostrar placeholder
            if (this.avatarPlaceholder) {
                this.avatarPlaceholder.style.display = 'flex';
            }
            
            // Limpiar instancia
            this.avatar = null;
            this.token = null;
            this.isActive = false;
            this.state.isConnected = false;
            this.state.isSpeaking = false;
            
            console.log('✅ Avatar detenido correctamente');
            return true;
            
        } catch (error) {
            console.error('❌ Error deteniendo avatar:', error);
            return false;
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // INTERRUMPIR (para barge-in)
    // ═══════════════════════════════════════════════════════════════════
    
    async interrupt() {
        try {
            if (!this.avatar || !this.state.isSpeaking) {
                return true;
            }
            
            console.log('⏸️ Interrumpiendo avatar...');
            
            // El SDK debería tener un método para interrumpir
            if (this.avatar.interrupt) {
                await this.avatar.interrupt();
            } else if (this.avatar.stopAvatar) {
                // Fallback: detener y reiniciar
                await this.stopAvatar();
                await this.startAvatar();
            }
            
            this.state.isSpeaking = false;
            this.avatarVideo?.classList.remove('speaking');
            
            return true;
            
        } catch (error) {
            console.error('❌ Error interrumpiendo avatar:', error);
            return false;
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // ESTADO Y UTILIDADES
    // ═══════════════════════════════════════════════════════════════════
    
    getState() {
        return {
            isInitialized: this.isInitialized,
            isActive: this.isActive,
            isConnected: this.state.isConnected,
            isSpeaking: this.state.isSpeaking
        };
    }
    
    isReady() {
        return this.isInitialized && this.isActive && this.state.isConnected;
    }
}

// ═══════════════════════════════════════════════════════════════════
// INSTANCIA GLOBAL
// ═══════════════════════════════════════════════════════════════════

const heygenAvatar = new HeyGenAvatarSystem();
    
    // ═══════════════════════════════════════════════════════════════════
// FUNCIÓN GLOBAL PARA HABLAR CON EL AVATAR
    // ═══════════════════════════════════════════════════════════════════
    
window.speakWithAvatar = async function(text) {
    try {
        if (!heygenAvatar.isReady()) {
            console.log('🔄 Iniciando avatar antes de hablar...');
            await heygenAvatar.startAvatar();
        }
        
        await heygenAvatar.speak(text);
    } catch (error) {
        console.error('❌ Error en speakWithAvatar:', error);
    }
};
    
    // ═══════════════════════════════════════════════════════════════════
// AUTO-INICIALIZACIÓN
    // ═══════════════════════════════════════════════════════════════════
    
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Inicializando HeyGen Avatar System...');
    await heygenAvatar.initialize();
});

// ═══════════════════════════════════════════════════════════════════
// EXPORTAR PARA USO GLOBAL
// ═══════════════════════════════════════════════════════════════════

window.heygenAvatar = heygenAvatar;

// Exportar para módulos ES6
export default heygenAvatar;
