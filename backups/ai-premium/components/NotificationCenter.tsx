
import React, { useState, useEffect } from 'react';
import { AppNotification } from '../types';

interface NotificationCenterProps {
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  notifications, 
  onMarkAsRead, 
  onClearAll 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = () => setIsOpen(false);
    if (isOpen) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => window.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center text-green-400 border border-green-500/30">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>;
      case 'message':
        return <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center text-brand-400 border border-brand-500/30">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
        </div>;
      default:
        return <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 border border-amber-500/30">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>;
    }
  };

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-3 text-slate-300 hover:text-white transition-all bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 glossy-finish"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center rounded-lg border-2 border-galaxy-deep transform -translate-y-1 translate-x-1 animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-6 w-80 sm:w-96 liquid-glass rounded-3xl shadow-4xl border border-white/10 overflow-hidden animate-fade-in origin-top-right z-50 glossy-finish">
          <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/5">
            <h3 className="font-bold text-white uppercase tracking-widest text-xs">Centro de Control</h3>
            {notifications.length > 0 && (
              <button 
                onClick={onClearAll}
                className="text-[10px] text-brand-400 font-bold hover:text-white transition-colors"
              >
                BORRAR TODO
              </button>
            )}
          </div>
          
          <div className="max-h-[450px] overflow-y-auto bg-transparent">
            {notifications.length === 0 ? (
              <div className="p-16 text-center">
                <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Todo en orden</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {notifications.map((n) => (
                  <div 
                    key={n.id} 
                    className={`p-5 flex gap-5 hover:bg-white/5 transition-colors cursor-pointer ${!n.read ? 'bg-brand-400/5' : ''}`}
                    onClick={() => onMarkAsRead(n.id)}
                  >
                    {getIcon(n.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className={`text-sm font-bold truncate ${!n.read ? 'text-white' : 'text-slate-400'}`}>
                          {n.title}
                        </h4>
                        <span className="text-[9px] text-slate-500 whitespace-nowrap ml-2 uppercase font-bold tracking-tighter">
                          {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                        {n.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
