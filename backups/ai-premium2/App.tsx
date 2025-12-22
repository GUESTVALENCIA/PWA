

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MOCK_PROPERTIES } from './constants';
import { AppNotification, Property, User, CallState } from './types';
import PropertyCard from './components/PropertyCard';
import NotificationCenter from './components/NotificationCenter';
import AuthPortal from './components/AuthPortal';
import { connectLiveSession, decodeBase64, pcmToAudioBuffer } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [callState, setCallState] = useState<CallState>('IDLE');
  const [heroMedia, setHeroMedia] = useState<{url: string, type: 'image' | 'video'} | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  
  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const liveSessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef(0);

  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
  };

  const playTone = (freq: number, duration: number, start: number) => {
    const ctx = audioContextRef.current!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration);
  };

  const startCallProcedure = async () => {
    initAudio();
    setCallState('RINGING');
    
    const now = audioContextRef.current!.currentTime;
    // Ringtones: dos ciclos
    [0, 1.5, 3.5, 5].forEach((offset) => {
      playTone(425, 1, now + offset);
    });

    // Click descolgar a los 6.5s
    setTimeout(async () => {
      playTone(800, 0.05, audioContextRef.current!.currentTime);
      try {
        const session = await connectLiveSession({
          onAudioChunk: async (base64) => {
            const bytes = decodeBase64(base64);
            const buffer = await pcmToAudioBuffer(bytes, audioContextRef.current!);
            const source = audioContextRef.current!.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContextRef.current!.destination);
            const playTime = Math.max(nextStartTimeRef.current, audioContextRef.current!.currentTime);
            source.start(playTime);
            nextStartTimeRef.current = playTime + buffer.duration;
          },
          onInterrupted: () => {
            // Manejar interrupción si es necesario
          },
          onClose: () => setCallState('IDLE')
        });
        liveSessionRef.current = session;
        setCallState('CONNECTED');
      } catch (err) {
        console.error("Failed to connect to live session", err);
        setCallState('IDLE');
      }
    }, 6500);
  };

  const handleHangup = () => {
    if (liveSessionRef.current) liveSessionRef.current.close();
    setCallState('IDLE');
    nextStartTimeRef.current = 0;
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setHeroMedia({ url, type: file.type.startsWith('video') ? 'video' : 'image' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-brand-500/30">
      <nav className="fixed top-0 left-0 right-0 z-[100] h-24 liquid-glass border-b border-white/10 px-6 xl:px-12">
        <div className="max-w-[1440px] mx-auto h-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-1 font-serif text-2xl xl:text-3xl font-bold tracking-tight cursor-pointer" onClick={() => setActiveTab('home')}>
            <span className="text-brand-400 text-glow">Guests</span>
            <span className="text-white">Valencia</span>
          </div>
          <div className="hidden lg:flex items-center gap-8 text-[12px] font-bold uppercase tracking-[0.2em] text-slate-300">
            {['home', 'accommodations', 'services', 'owners', 'about', 'contact'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`nav-link ${activeTab === tab ? 'text-brand-400 text-glow' : ''}`}>
                {tab === 'home' ? 'Inicio' : tab === 'accommodations' ? 'Alojamientos' : tab === 'about' ? 'Quiénes Somos' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <NotificationCenter notifications={notifications} onMarkAsRead={() => {}} onClearAll={() => {}} />
            <button onClick={() => setShowAuth(true)} className="px-8 py-3 rounded-full text-[11px] font-bold uppercase tracking-[0.2em] bg-white/5 border border-white/10 text-white hover:bg-white/10 glossy-crystal">
              {user ? user.name.split(' ')[0] : 'Registrarse'}
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 pt-24">
        {activeTab === 'home' && (
          <HomeSection 
            onBook={() => setActiveTab('accommodations')} 
            onCall={startCallProcedure}
            callState={callState}
            heroMedia={heroMedia}
            onMediaUpload={handleMediaUpload}
          />
        )}
        {/* Otras secciones... */}
      </main>

      {/* Barra Inferior de Llamada */}
      {(callState === 'CONNECTED' || callState === 'RINGING') && (
        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-[1000] flex gap-4 p-4 liquid-glass rounded-full border border-white/20 animate-fade-in shadow-5xl">
          <button onClick={handleHangup} className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-500 transition-all shadow-xl">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12a9 9 0 1018 0 9 9 0 00-18 0z" /></svg>
          </button>
          <button className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 text-white border border-white/10">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6M14 9v6" /></svg>
          </button>
          <button className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 text-white border border-white/10">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
          </button>
          <button className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 text-white border border-white/10">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          </button>
        </div>
      )}

      {showAuth && <AuthPortal onClose={() => setShowAuth(false)} onSuccess={(u) => { setUser(u); setShowAuth(false); }} />}
      
      {/* SandraWidget desactivado según requerimiento A */}
      {/* <SandraWidget /> */}
    </div>
  );
};

const HomeSection: React.FC<{ 
  onBook: () => void, 
  onCall: () => void, 
  callState: CallState, 
  heroMedia: any, 
  onMediaUpload: any 
}> = ({ onBook, onCall, callState, heroMedia, onMediaUpload }) => (
  <section className="relative h-screen flex items-end justify-center overflow-hidden pb-24">
    <div className="absolute inset-0 z-0">
      {heroMedia?.type === 'video' ? (
        <video src={heroMedia.url} autoPlay loop muted className="w-full h-full object-cover brightness-[0.6]" />
      ) : (
        <img 
          src={heroMedia?.url || "https://images.unsplash.com/photo-1600607687644-c7171b42498b?auto=format&fit=crop&w=1920&q=95"} 
          className="w-full h-full object-cover brightness-[0.6] saturate-[1.2]"
          alt="Valencia Luxury"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-[#030712] opacity-80" />
      
      {/* Selector de carga Hero */}
      <label className="absolute top-32 right-12 z-20 cursor-pointer bg-white/10 hover:bg-white/20 p-4 rounded-full border border-white/20 backdrop-blur-md transition-all group">
        <input type="file" className="hidden" accept="image/*,video/*" onChange={onMediaUpload} />
        <svg className="w-6 h-6 text-white group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
      </label>
    </div>
    
    <div className="relative z-10 text-center px-6 w-full max-w-6xl mx-auto flex flex-col items-center">
      {callState === 'CONNECTED' && (
        <div className="w-48 h-48 rounded-full mb-10 border-4 border-brand-500 overflow-hidden shadow-4xl animate-pulse">
           <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80" className="w-full h-full object-cover" alt="Sandra" />
        </div>
      )}
      
      <div className={`${callState === 'CONNECTED' ? 'opacity-50 blur-sm pointer-events-none' : ''} transition-all duration-700 flex flex-col items-center`}>
        <span className="inline-block bg-brand-600/10 backdrop-blur-2xl px-5 py-2 rounded-full text-brand-300 text-[10px] font-bold uppercase tracking-[0.4em] mb-10 border border-brand-500/30">
          Smart Luxury Lifestyle
        </span>
        <h1 className="text-5xl md:text-7xl xl:text-8xl font-serif font-bold text-white mb-10 drop-shadow-2xl leading-[1.1]">
          Valencia, <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-white to-indigo-300">Inteligente</span> y Exclusiva.
        </h1>
      </div>
      
      {/* Search Bar - Se difumina durante llamada */}
      <div id="search-container" className={`liquid-glass p-3 rounded-[40px] w-full flex flex-col md:flex-row gap-3 border border-white/10 glossy-crystal shadow-crystal transition-all duration-700 ${callState !== 'IDLE' ? 'opacity-0 blur-2xl pointer-events-none transform translate-y-10' : ''}`}>
        <input type="text" placeholder="¿Buscas algo especial en Valencia?" className="flex-1 px-8 py-5 rounded-[32px] bg-white/5 border-none outline-none text-white font-medium placeholder:text-slate-500 text-sm" />
        <button onClick={onBook} className="px-12 py-5 luxury-btn text-white font-bold rounded-[32px] transition-all text-[11px] uppercase tracking-[0.2em]">Buscar</button>
        <button onClick={onCall} className="px-8 py-5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-[32px] transition-all flex items-center justify-center gap-3 border border-green-400/30 shadow-2xl group">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 005.455 5.455l.774-1.548a1 1 0 011.06-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
          </div>
          <span className="text-[12px] uppercase tracking-[0.2em]">Hablar con Sandra</span>
        </button>
      </div>
    </div>
  </section>
);

export default App;