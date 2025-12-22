

import { GoogleGenAI, Modality } from "@google/genai";

// Funciones de utilidad para encoding/decoding PCM según requerimientos de la API
export function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function pcmToAudioBuffer(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < dataInt16.length; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}

export const connectLiveSession = async (callbacks: {
  onAudioChunk: (data: string) => void;
  onInterrupted: () => void;
  onClose: () => void;
}) => {
  // Always initialize right before use with the correct named parameter.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const session = await ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
      },
      systemInstruction: 'Eres Sandra, concierge de lujo en GuestsValencia. Estás en tu despacho atendiendo una videollamada. Tu tono es profesional y servicial. Tienes acceso a información de reservas y disponibilidad.'
    },
    callbacks: {
      onmessage: async (message) => {
        const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
        if (audioData) callbacks.onAudioChunk(audioData);
        if (message.serverContent?.interrupted) callbacks.onInterrupted();
      },
      onclose: callbacks.onClose,
      onerror: (e) => console.error("Live session error", e)
    }
  });
  return session;
};

export const sendMessageToGemini = async (message: string, history: any[] = []) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [...history, { role: 'user', parts: [{ text: message }] }],
  });
  return response.text;
};

export const speakText = async (text: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
      },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};

// Fix: Export generateImage for AIStudio
export const generateImage = async (prompt: string, aspectRatio: string, imageSize: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio as any,
        imageSize: imageSize as any
      }
    }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
};

// Fix: Export generateVideo for AIStudio
export const generateVideo = async (prompt: string, aspectRatio: '16:9' | '9:16') => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio
    }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  const videoResp = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const blob = await videoResp.blob();
  return URL.createObjectURL(blob);
};