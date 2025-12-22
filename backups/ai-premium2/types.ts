

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

export type CallState = 'IDLE' | 'RINGING' | 'CONNECTED' | 'PAUSED' | 'ENDING';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'booking' | 'message' | 'alert' | 'auth';
  timestamp: Date;
  read: boolean;
}

export type UserRole = 'guest' | 'owner' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

// Added for AI Studio support
export type GenerationStatus = 'idle' | 'generating' | 'success' | 'error';

export interface GeneratedAsset {
  type: 'image' | 'video';
  url: string;
  prompt: string;
}