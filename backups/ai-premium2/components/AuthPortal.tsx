
import React, { useState } from 'react';
import { User, UserRole } from '../types';

interface AuthPortalProps {
  onClose: () => void;
  onSuccess: (user: User) => void;
}

const AuthPortal: React.FC<AuthPortalProps> = ({ onClose, onSuccess }) => {
  const [role, setRole] = useState<UserRole>('guest');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    onSuccess({
      id: Math.random().toString(),
      name,
      email,
      role
    });
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
      <div 
        className="absolute inset-0 bg-galaxy-deep/80 backdrop-blur-md"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-lg liquid-glass rounded-[50px] border border-white/20 overflow-hidden glossy-crystal shadow-5xl animate-fade-in">
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 text-slate-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-12">
          <h2 className="text-3xl font-serif font-bold text-white mb-4 text-center">Únete a GuestsValencia</h2>
          <p className="text-slate-400 text-sm text-center mb-10 font-light">Acceso exclusivo a los mejores alojamientos de Valencia.</p>

          <div className="flex bg-white/5 p-1 rounded-3xl mb-10 border border-white/10">
            <button 
              onClick={() => setRole('guest')}
              className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-2xl transition-all ${role === 'guest' ? 'bg-brand-600 text-white shadow-xl' : 'text-slate-400 hover:text-white'}`}
            >
              Huésped
            </button>
            <button 
              onClick={() => setRole('owner')}
              className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-2xl transition-all ${role === 'owner' ? 'bg-brand-600 text-white shadow-xl' : 'text-slate-400 hover:text-white'}`}
            >
              Propietario
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <input 
                type="text" 
                placeholder="Nombre Completo"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-3xl px-8 py-5 outline-none focus:border-brand-500 transition-all text-white placeholder:text-slate-600"
                required
              />
            </div>
            <div className="space-y-2">
              <input 
                type="email" 
                placeholder="Email corporativo"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-3xl px-8 py-5 outline-none focus:border-brand-500 transition-all text-white placeholder:text-slate-600"
                required
              />
            </div>
            <button 
              type="submit"
              className="w-full py-5 luxury-btn text-white font-bold rounded-[32px] uppercase tracking-widest text-[12px] shadow-2xl mt-4"
            >
              Crear Cuenta Élite
            </button>
          </form>

          <p className="mt-8 text-center text-[10px] text-slate-500 uppercase tracking-widest leading-loose">
            Al registrarte aceptas los <br/> <span className="text-brand-400 cursor-pointer">Términos de Servicio de Lujo</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPortal;
