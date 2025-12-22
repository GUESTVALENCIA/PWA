import React, { useState, useEffect, useCallback } from 'react';
import { MOCK_PROPERTIES } from './constants';
import { AppNotification, Property } from './types';
import PropertyCard from './components/PropertyCard';
import SandraWidget from './components/SandraWidget';
import NotificationCenter from './components/NotificationCenter';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('gv_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('gv_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    const timer = setTimeout(() => {
      addNotification({
        title: "Sandra Concierge",
        message: "¡Hola! Soy Sandra. ¿En qué puedo ayudarte hoy en Valencia?",
        type: 'alert'
      });
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  const addNotification = useCallback((n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: AppNotification = {
      ...n,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  }, []);

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleClearAll = () => setNotifications([]);

  const handleBook = (property: Property) => {
    setTimeout(() => {
      addNotification({
        title: "Reserva Confirmada",
        message: `Tu estancia en "${property.name}" ha sido confirmada. Sandra te enviará los detalles.`,
        type: 'booking'
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* NAVBAR - CORRECTED ALIGNMENT AND OFFICIAL SECTIONS */}
      <nav className="fixed top-0 left-0 right-0 z-[100] h-24 liquid-glass border-b border-white/10 px-6 xl:px-12">
        <div className="max-w-[1440px] mx-auto h-full flex items-center justify-between gap-4">
          {/* Logo */}
          <div 
            className="flex items-center gap-1 font-serif text-2xl xl:text-3xl font-bold tracking-tight cursor-pointer flex-shrink-0" 
            onClick={() => setActiveTab('home')}
          >
            <span className="text-brand-400 text-glow">Guests</span>
            <span className="text-white">Valencia</span>
          </div>
          
          {/* Menu - Flexible and properly spaced */}
          <div className="hidden lg:flex items-center gap-6 xl:gap-10 text-[11px] xl:text-[12px] font-bold uppercase tracking-[0.2em] text-slate-300">
            <button onClick={() => setActiveTab('home')} className={`nav-link ${activeTab === 'home' ? 'text-brand-400 text-glow' : 'hover:text-white'}`}>Inicio</button>
            <button onClick={() => setActiveTab('accommodations')} className={`nav-link ${activeTab === 'accommodations' ? 'text-brand-400 text-glow' : 'hover:text-white'}`}>Alojamientos</button>
            <button className="nav-link hover:text-white">Servicios</button>
            <button className="nav-link hover:text-white">Propietarios</button>
            <button className="nav-link hover:text-white">Quiénes Somos</button>
            <button className="nav-link hover:text-white">Contacto</button>
            <button className="text-brand-400 flex items-center gap-2 bg-brand-900/40 px-5 py-2 rounded-full border border-brand-500/20 hover:bg-brand-900/60 transition-all flex-shrink-0">
              <span className="text-sm">📱</span> App
            </button>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <NotificationCenter 
              notifications={notifications}
              onMarkAsRead={handleMarkAsRead}
              onClearAll={handleClearAll}
            />
            <button className="hidden sm:block px-8 py-3 rounded-full text-[10px] xl:text-[11px] font-bold uppercase tracking-[0.2em] bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all glossy-crystal">
              Registrarse
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <>
            {/* HERO SECTION */}
            <section className="relative h-screen flex items-end justify-center overflow-hidden pb-20">
              <div className="absolute inset-0 z-0">
                <img 
                  src="https://images.unsplash.com/photo-1600607687644-c7171b42498b?auto=format&fit=crop&w=1920&q=95" 
                  className="w-full h-full object-cover brightness-[0.7] saturate-[1.1]"
                  alt="Valencia Luxury"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-[#030712] opacity-80" />
              </div>
              
              <div className="relative z-10 text-center px-6 w-full max-w-6xl mx-auto flex flex-col items-center">
                <span className="inline-block bg-brand-600/10 backdrop-blur-2xl px-5 py-2 rounded-full text-brand-300 text-[10px] font-bold uppercase tracking-[0.4em] mb-10 border border-brand-500/30">
                  Spectacular Luxury Living
                </span>
                <h1 className="text-5xl md:text-7xl xl:text-8xl font-serif font-bold text-white mb-10 drop-shadow-2xl leading-[1.1]">
                  Valencia, <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-white to-indigo-300">Inteligente</span> y Exclusiva.
                </h1>
                <p className="text-lg md:text-xl xl:text-2xl text-slate-200 mb-14 max-w-3xl mx-auto font-light leading-relaxed opacity-90">
                  Experimenta el futuro del alojamiento con llegada autónoma y asistencia 24h personalizada por nuestra IA Sandra.
                </p>
                
                {/* ACTION AREA - FIXED ALIGNMENT */}
                <div id="search-container" className="liquid-glass p-3 rounded-[40px] w-full flex flex-col md:flex-row gap-3 border border-white/10 glossy-crystal shadow-crystal">
                  <div className="flex-1 flex gap-3 min-w-0">
                    <input 
                      type="text" 
                      placeholder="¿A dónde viajas? Ej: Ruzafa..." 
                      className="flex-1 px-8 py-5 rounded-[32px] bg-white/5 border-none outline-none text-white font-medium placeholder:text-slate-500 focus:bg-white/10 transition-all text-sm"
                    />
                    <div className="hidden sm:flex items-center bg-white/5 px-6 rounded-[32px] border border-white/10">
                       <span className="text-slate-400 text-[11px] font-bold uppercase tracking-widest whitespace-nowrap">2 Pers.</span>
                    </div>
                  </div>
                  <div className="flex gap-3 w-full md:w-auto">
                    <button className="flex-1 md:flex-none px-12 py-5 luxury-btn text-white font-bold rounded-[32px] transition-all text-[11px] uppercase tracking-[0.2em] whitespace-nowrap">
                      Buscar
                    </button>
                    <button 
                      onClick={() => document.getElementById('sandra-toggle-btn')?.click()}
                      className="flex-1 md:flex-none px-8 py-5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-[32px] transition-all flex items-center justify-center gap-3 border border-green-400/30 shadow-2xl group"
                    >
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 005.455 5.455l.774-1.548a1 1 0 011.06-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                        </svg>
                      </div>
                      <span className="text-[12px] uppercase tracking-[0.2em] whitespace-nowrap">Hablar con Sandra</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTIONS RECREATION FROM OFFICIAL DATA */}
            <section className="py-40 px-8">
               <div className="max-w-7xl mx-auto">
                <div className="text-center mb-24">
                  <span className="text-brand-400 font-bold tracking-[0.4em] uppercase text-[10px] mb-6 block">Nuestros Pilares</span>
                  <h2 className="text-4xl md:text-6xl font-serif font-bold text-white mb-8">Tecnología y Transparencia</h2>
                  <p className="text-slate-400 max-w-2xl mx-auto text-xl font-light leading-relaxed">
                    Elevamos el estándar de la gestión de apartamentos turísticos mediante IA y atención personalizada.
                  </p>
                </div>
                <div className="grid md:grid-cols-3 gap-10">
                  <div className="liquid-glass p-12 rounded-[50px] border border-white/5 glossy-crystal group transition-all duration-500 hover:scale-[1.02]">
                    <div className="w-20 h-20 bg-brand-600/10 rounded-3xl flex items-center justify-center mb-10 border border-brand-500/20 group-hover:bg-brand-600 transition-all duration-700 shadow-brand-900/20">
                      <svg className="w-10 h-10 text-brand-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-6 font-serif">Sandra IA Concierge</h3>
                    <p className="text-slate-400 leading-relaxed font-light text-base">Asistencia 24/7 mediante videollamada conversacional para una estancia inmersiva.</p>
                  </div>
                  <div className="liquid-glass p-12 rounded-[50px] border border-white/5 glossy-crystal group transition-all duration-500 hover:scale-[1.02]">
                    <div className="w-20 h-20 bg-indigo-600/10 rounded-3xl flex items-center justify-center mb-10 border border-indigo-500/20 group-hover:bg-indigo-600 transition-all duration-700 shadow-indigo-900/20">
                      <svg className="w-10 h-10 text-indigo-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-6 font-serif">Transparencia Galaxy</h3>
                    <p className="text-slate-400 leading-relaxed font-light text-base">Toda la información de tus propiedades y reservas accesible en un solo click.</p>
                  </div>
                  <div className="liquid-glass p-12 rounded-[50px] border border-white/5 glossy-crystal group transition-all duration-500 hover:scale-[1.02]">
                    <div className="w-20 h-20 bg-purple-600/10 rounded-3xl flex items-center justify-center mb-10 border border-purple-500/20 group-hover:bg-purple-600 transition-all duration-700 shadow-purple-900/20">
                      <svg className="w-10 h-10 text-purple-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-6 font-serif">Máxima Rentabilidad</h3>
                    <p className="text-slate-400 leading-relaxed font-light text-base">Optimizamos tus ingresos con tecnología avanzada de precios dinámicos.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* STATS SECTION */}
            <section className="py-24 liquid-glass mx-8 rounded-[80px] border-none glossy-crystal relative">
              <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-20 text-center">
                <div className="space-y-4">
                  <div className="text-7xl font-serif font-bold text-brand-400 text-glow">+5</div>
                  <div className="text-slate-400 uppercase tracking-[0.4em] font-bold text-[11px]">Años de Experiencia</div>
                </div>
                <div className="space-y-4">
                  <div className="text-7xl font-serif font-bold text-brand-400 text-glow">+50</div>
                  <div className="text-slate-400 uppercase tracking-[0.4em] font-bold text-[11px]">Propiedades de Lujo</div>
                </div>
                <div className="space-y-4">
                  <div className="text-7xl font-serif font-bold text-brand-400 text-glow">98%</div>
                  <div className="text-slate-400 uppercase tracking-[0.4em] font-bold text-[11px]">Satisfacción Rate</div>
                </div>
              </div>
            </section>

            {/* FEATURED PROPERTIES */}
            <section className="py-40 max-w-[1400px] mx-auto px-8">
              <div className="flex justify-between items-end mb-20">
                <div>
                  <span className="text-brand-400 font-bold uppercase tracking-[0.4em] text-[10px] mb-4 block">The Selection</span>
                  <h2 className="text-4xl md:text-6xl font-serif font-bold text-white">Alojamientos Destacados</h2>
                </div>
                <button onClick={() => setActiveTab('accommodations')} className="text-brand-400 font-bold hover:text-white transition-all uppercase tracking-widest text-[11px] border-b border-brand-400/30 pb-2">Ver todo el catálogo →</button>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
                {MOCK_PROPERTIES.slice(0, 3).map(p => (
                  <PropertyCard key={p.id} property={p} onBook={handleBook} />
                ))}
              </div>
            </section>
          </>
        )}

        {activeTab === 'accommodations' && (
          <section className="py-40 max-w-[1400px] mx-auto px-8 animate-fade-in">
            <h1 className="text-6xl font-serif font-bold text-white mb-24">Nuestra Colección</h1>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
              {MOCK_PROPERTIES.map(p => (
                <PropertyCard key={p.id} property={p} onBook={handleBook} />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* FOOTER - RECREATING OFFICIAL INDEX DATA */}
      <footer className="bg-[#030712] text-white py-40 px-8 border-t border-white/5 mt-40">
        <div className="max-w-[1400px] mx-auto grid md:grid-cols-4 gap-24">
          <div className="col-span-2">
            <div className="font-serif text-5xl font-bold mb-10">
              <span className="text-brand-400">Guests</span>Valencia
            </div>
            <p className="text-slate-400 max-w-md mb-12 font-light leading-relaxed text-xl">
              Redefiniendo el hospitality de lujo en Valencia mediante tecnología propia e inteligencia artificial de vanguardia.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-10 uppercase tracking-[0.4em] text-[10px] text-brand-400">Navegación</h4>
            <ul className="space-y-8 text-slate-400 text-[14px] font-medium uppercase tracking-widest">
              <li><button onClick={() => setActiveTab('home')} className="hover:text-white transition-all">Inicio</button></li>
              <li><button onClick={() => setActiveTab('accommodations')} className="hover:text-white transition-all">Alojamientos</button></li>
              <li><button className="hover:text-white transition-all">Propietarios</button></li>
              <li><button className="hover:text-white transition-all">Servicios</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-10 uppercase tracking-[0.4em] text-[10px] text-brand-400">Valencia Office</h4>
            <ul className="space-y-8 text-slate-400 text-sm font-light">
              <li className="flex gap-4"><span>📍</span> Calle de la Paz, 15, Valencia</li>
              <li className="flex gap-4"><span>✉️</span> hola@guestsvalencia.es</li>
              <li className="flex gap-4"><span>📞</span> +34 624 020 085</li>
            </ul>
          </div>
        </div>
        <div className="max-w-[1400px] mx-auto mt-40 pt-16 border-t border-white/5 text-slate-600 text-[9px] uppercase tracking-[0.4em] flex flex-col md:flex-row justify-between items-center gap-10">
          <p>© 2024 GuestsValencia AI Elite. All rights reserved.</p>
          <div className="flex gap-12">
            <button className="hover:text-white transition-all">Privacidad</button>
            <button className="hover:text-white transition-all">Términos de Lujo</button>
            <button className="hover:text-white transition-all">Cookies</button>
          </div>
        </div>
      </footer>

      {/* THE SANDRA WIDGET */}
      <SandraWidget onNewMessage={(text) => addNotification({ 
        title: "Sandra", 
        message: text.length > 60 ? text.substring(0, 60) + "..." : text, 
        type: 'message' 
      })} />
    </div>
  );
};

export default App;