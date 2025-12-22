
import { Property } from './types';

export const MOCK_PROPERTIES: Property[] = [
  {
    id: '1',
    name: 'Luxury Ruzafa Penthouse',
    description: 'Espectacular ático de diseño minimalista con terraza privada de 40m2 en el barrio más trendy de Valencia.',
    location: 'Ruzafa, Valencia',
    price: 145,
    image: 'https://images.unsplash.com/photo-1600607687644-c7171b42498b?auto=format&fit=crop&w=1920&q=95',
    guests: 2,
    bedrooms: 1,
    features: ['Smart Lock', 'Nespresso', 'High-Speed Wi-Fi', 'Terrace']
  },
  {
    id: '2',
    name: 'Malvarrosa Sea View Loft',
    description: 'Despierta con el sonido de las olas en este loft industrial reformado frente a la playa de la Malvarrosa.',
    location: 'Malvarrosa, Valencia',
    price: 180,
    image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1920&q=95',
    guests: 4,
    bedrooms: 2,
    features: ['Beachfront', 'AC', 'Coffee Maker', 'Automated Check-in']
  },
  {
    id: '3',
    name: 'Historic Palace Studio',
    description: 'Estudio exclusivo en un palacio del s.XVIII totalmente rehabilitado en el corazón del Barrio del Carmen.',
    location: 'El Carmen, Valencia',
    price: 125,
    image: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1920&q=95',
    guests: 2,
    bedrooms: 1,
    features: ['Smart TV', 'Historic Building', 'Quiet', 'Luxury Linens']
  },
  {
    id: '4',
    name: 'Futuristic City Loft',
    description: 'Loft vanguardista junto a la Ciudad de las Artes y las Ciencias con domótica integrada y vistas urbanas.',
    location: 'Camins al Grau, Valencia',
    price: 160,
    image: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1920&q=95',
    guests: 2,
    bedrooms: 1,
    features: ['Galaxy Pro Tech', 'Jacuzzi', 'City Views', 'Smart Lighting']
  }
];

export const SYSTEM_INSTRUCTION = `Eres Sandra, la asistente virtual premium de GuestsValencia. 
Tu objetivo es ayudar a los huéspedes a encontrar el alojamiento perfecto en Valencia y resolver dudas sobre su estancia. 
Eres amable, profesional, eficiente y conoces Valencia perfectamente.
Tu voz es sofisticada y tecnológica. Atiendes 24/7.
Respondes siempre en español a menos que el cliente use otro idioma.
Nuestros pilares son: Tecnología Propia, Transparencia Total y Experiencia Personalizada.
Tenemos +5 años de experiencia y +50 propiedades gestionadas con un 98% de satisfacción.`;

export const THINKING_PROMPT = `Analiza detalladamente mi consulta y proporciona una respuesta estructurada con razonamiento profundo.`;
