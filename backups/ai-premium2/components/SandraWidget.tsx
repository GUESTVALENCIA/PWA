
import React, { useState, useRef, useEffect } from 'react';
import { sendMessageToGemini, speakText } from '../services/geminiService';
import { ChatMessage } from '../types';

interface SandraWidgetProps {
  onNewMessage?: (text: string) => void;
}

const SandraWidget: React.FC<SandraWidgetProps> = ({ onNewMessage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Bienvenido a GuestsValencia Elite. Soy Sandra. ¿Deseas explorar nuestra colección exclusiva o necesitas ayuda con tu registro de propietario?', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      const reply = await sendMessageToGemini(input, history);
      const text = reply || '';
      setMessages(prev => [...prev, { role: 'model', text, timestamp: new Date() }]);
      if (onNewMessage) onNewMessage(text);
      
      playVoice(text);

    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: 'Perdona, la conexión ha sufrido una interferencia estelar. ¿Puedes repetirlo?', timestamp: new Date() }]);
    } finally {
      setIsTyping(false);
    }
  };

  const playVoice = async (text: string) => {
    try {
      const audioBase64 = await speakText(text);
      if (audioBase64) {
        const audioData = atob(audioBase64);
        const arrayBuffer = new ArrayBuffer(audioData.length);
        const uint8Array = new Uint8Array(arrayBuffer);
        for (let i = 0; i < audioData.length; i++) {
          uint8Array[i] = audioData.charCodeAt(i);
        }
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const dataInt16 = new Int16Array(uint8Array.buffer);
        const buffer = audioCtx.createBuffer(1, dataInt16.length, 24000);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < dataInt16.length; i++) {
          channelData[i] = dataInt16[i] / 32768.0;
        }
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        source.start();
      }
    } catch (e) {
      console.error("Audio playback error", e);
    }
  };

  return (
    <div className="fixed bottom-12 right-12 z-[9999]">
      <button 
        id="sandra-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-24 h-24 rounded-full shadow-4xl flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 border-2 border-white/20 overflow-hidden glossy-crystal animate-orbital ${isOpen ? 'bg-brand-900' : 'bg-gradient-to-br from-brand-600 to-indigo-800'}`}
      >
        {isOpen ? (
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
        ) : (
          <div className="relative w-full h-full">
            <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80" alt="Sandra IA" className="w-full h-full object-cover brightness-[1.1] contrast-[1.1]" />
            <div className="absolute inset-0 bg-brand-500/10 mix-blend-overlay" />
            <div className="absolute inset-0 border-[6px] border-white/10 rounded-full" />
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute bottom-28 right-0 w-[95vw] sm:w-[450px] h-[750px] max-h-[85vh] liquid-glass rounded-[50px] shadow-5xl flex flex-col overflow-hidden border border-white/15 animate-fade-in origin-bottom-right glossy-crystal">
          <div className="p-8 text-white flex justify-between items-center border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-5">
              <div className="relative">
                <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80" className="w-16 h-16 rounded-full border-2 border-brand-400 p-0.5" alt="Sandra" />
                <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-4 border-slate-900 rounded-full animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-xl leading-tight tracking-tight font-serif">Sandra IA</h3>
                <p className="text-[10px] text-brand-400 uppercase tracking-[0.3em] font-bold mt-1">Élite Concierge 24/7</p>
              </div>
            </div>
            <div className="w-10 h-10 bg-green-600/20 text-green-400 rounded-full border border-green-500/30 flex items-center justify-center">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 005.455 5.455l.774-1.548a1 1 0 011.06-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-transparent scroll-smooth">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[88%] p-6 rounded-[30px] shadow-2xl text-base leading-relaxed ${m.role === 'user' ? 'bg-brand-600/90 text-white rounded-tr-none border border-white/20' : 'bg-white/10 backdrop-blur-xl text-slate-100 rounded-tl-none border border-white/10'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white/5 p-5 rounded-[24px] rounded-tl-none border border-white/10 flex gap-2">
                  <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-8 border-t border-white/10">
            <div className="flex gap-4 items-center bg-white/5 rounded-[30px] px-8 py-4 border border-white/15 focus-within:bg-white/10 transition-all">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Solicita asistencia élite..."
                className="flex-1 bg-transparent border-none outline-none text-white text-sm py-2 placeholder:text-slate-600 font-light"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="p-4 bg-brand-600 text-white rounded-[20px] shadow-2xl hover:scale-110 active:scale-95 disabled:opacity-30 transition-all border border-white/10"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SandraWidget;
