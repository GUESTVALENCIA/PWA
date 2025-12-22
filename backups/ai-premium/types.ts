
export interface Property {
  id: string;
  name: string;
  description: string;
  location: string;
  price: number;
  image: string;
  guests: number;
  bedrooms: number;
  features: string[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export type GenerationStatus = 'idle' | 'generating' | 'success' | 'error';

export interface GeneratedAsset {
  type: 'image' | 'video';
  url: string;
  prompt: string;
}

export type NotificationType = 'booking' | 'message' | 'alert';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: Date;
  read: boolean;
}
