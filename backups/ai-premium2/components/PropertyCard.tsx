import React from 'react';
import { Property } from '../types';

interface PropertyCardProps {
  property: Property;
  onBook: (property: Property) => void;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property, onBook }) => {
  return (
    <div className="liquid-glass rounded-[40px] overflow-hidden group glossy-crystal shadow-crystal">
      <div className="relative h-72 overflow-hidden">
        <img 
          src={property.image} 
          alt={property.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s] ease-out brightness-[0.9] group-hover:brightness-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-transparent opacity-80" />
        <div className="absolute top-6 right-6 bg-brand-600/90 backdrop-blur-xl px-5 py-2 rounded-full text-xs font-bold text-white shadow-2xl border border-white/20">
          {property.price}€ / noche
        </div>
      </div>
      <div className="p-10">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-serif text-2xl font-bold text-white leading-tight">{property.name}</h3>
          <span className="text-[10px] text-brand-400 uppercase tracking-[0.2em] font-bold bg-brand-900/40 px-3 py-1.5 rounded-lg border border-brand-500/20">
            {property.location}
          </span>
        </div>
        <p className="text-slate-400 text-sm mb-8 leading-relaxed font-light opacity-80">
          {property.description}
        </p>
        <div className="flex flex-wrap gap-3 mb-10">
          {property.features.slice(0, 3).map((f, i) => (
            <span key={i} className="text-[9px] bg-white/5 text-slate-300 px-3 py-1.5 rounded-full font-bold border border-white/5 uppercase tracking-[0.1em]">
              {f}
            </span>
          ))}
        </div>
        <button 
          onClick={() => onBook(property)}
          className="w-full py-5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold rounded-[24px] transition-all shadow-xl shadow-brand-900/40 hover:scale-[1.02] active:scale-[0.98] border border-white/10 uppercase tracking-[0.2em] text-[11px]"
        >
          Reservar Ahora
        </button>
      </div>
    </div>
  );
};

export default PropertyCard;