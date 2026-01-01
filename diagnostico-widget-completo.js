/**
 * DIAGNÓSTICO COMPLETO DEL WIDGET DE VOZ
 * ========================================
 * Este script verifica:
 * 1. Variables de entorno (API Keys)
 * 2. Conexión WebSocket
 * 3. Audio de prueba (simula el flujo completo)
 */

import dotenv from 'dotenv';
import WebSocket from 'ws';
import fs from 'fs';
import path from 'path';

// Cargar variables de entorno desde .env.local
dotenv.config({ path: '.env.local' });

const WS_URL = process.env.MCP_SERVER_URL || 'wss://pwa-imbf.onrender.com';

console.log('\n🔍 DIAGNÓSTICO COMPLETO DEL WIDGET DE VOZ\n');
console.log('═'.repeat(60));

// PASO 1: Verificar variables de entorno
console.log('\n📋 PASO 1: Variables de Entorno\n');
console.log('━'.repeat(60));

const requiredVars = {
  'DEEPGRAM_API_KEY': process.env.DEEPGRAM_API_KEY,
  'GROQ_API_KEY': process.env.GROQ_API_KEY,
  'MCP_SERVER_URL': WS_URL
};

let allConfigured = true;
for (const [key, value] of Object.entries(requiredVars)) {
  const status = value ? '✅' : '❌';
  const display = value 
    ? (key.includes('KEY') ? `${value.substring(0, 8)}...` : value)
    : 'NO CONFIGURADA';
  
  console.log(`${status} ${key.padEnd(20)} : ${display}`);
  
  if (!value) allConfigured = false;
}

if (!allConfigured) {
  console.log('\n⚠️  FALTAN VARIABLES DE ENTORNO');
  console.log('   Crea un archivo .env.local con:');
  console.log('   DEEPGRAM_API_KEY=tu_api_key');
  console.log('   GROQ_API_KEY=tu_api_key');
  process.exit(1);
}

// PASO 2: Probar conexión WebSocket
console.log('\n\n📡 PASO 2: Conexión WebSocket\n');
console.log('━'.repeat(60));
console.log(`   URL: ${WS_URL}\n`);

const ws = new WebSocket(WS_URL);
let connectionEstablished = false;
let capabilitiesReceived = false;
let welcomeAudioReceived = false;

const timeout = setTimeout(() => {
  if (!connectionEstablished) {
    console.log('\n❌ TIMEOUT: No se pudo conectar al servidor');
    console.log('   Verifica que el servidor esté corriendo en:');
    console.log(`   ${WS_URL}`);
    process.exit(1);
  }
}, 10000);

ws.on('open', () => {
  console.log('✅ WebSocket conectado');
  connectionEstablished = true;
  
  // Enviar mensaje ready para solicitar saludo
  console.log('\n📤 Enviando mensaje "ready"...');
  ws.send(JSON.stringify({
    route: 'conserje',
    action: 'message',
    payload: { type: 'ready', message: 'Cliente listo' }
  }));
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    
    // Ignorar errores de "Unknown message type"
    if (message.type === 'error' && message.error?.includes('Unknown message type')) {
      return;
    }
    
    console.log('\n📥 Mensaje recibido:', JSON.stringify(message, null, 2).substring(0, 300));
    
    // Verificar capabilities
    if (message.type === 'connection_established' && message.capabilities) {
      capabilitiesReceived = true;
      console.log('\n✅ Capacidades del servidor:');
      console.log(`   STT Disponible: ${message.capabilities.stt ? '✅' : '❌'}`);
      
      if (!message.capabilities.stt) {
        console.log('\n⚠️  STT NO DISPONIBLE');
        console.log('   Verifica que DEEPGRAM_API_KEY esté configurada en el servidor');
      }
    }
    
    // Verificar audio de bienvenida
    if (message.route === 'audio' && message.action === 'tts' && message.payload?.audio) {
      welcomeAudioReceived = true;
      const audioLength = message.payload.audio.length;
      console.log(`\n✅ Audio de bienvenida recibido: ${audioLength} bytes`);
      
      // Intentar decodificar el audio
      try {
        const decoded = Buffer.from(message.payload.audio, 'base64');
        console.log(`   Audio decodificado: ${decoded.length} bytes`);
        
        if (decoded.length < 1000) {
          console.log('   ⚠️  Audio muy pequeño, podría estar corrupto');
        }
      } catch (err) {
        console.log('   ❌ Error decodificando audio:', err.message);
      }
      
      // PASO 3: Simular envío de audio
      console.log('\n\n🎤 PASO 3: Simulación de Audio del Usuario\n');
      console.log('━'.repeat(60));
      simulateAudioChunks(ws);
    }
    
  } catch (err) {
    console.error('❌ Error parseando mensaje:', err.message);
  }
});

ws.on('error', (err) => {
  console.error('\n❌ Error WebSocket:', err.message);
  process.exit(1);
});

ws.on('close', () => {
  clearTimeout(timeout);
  console.log('\n\n🔌 WebSocket cerrado');
  
  // Resumen final
  console.log('\n═'.repeat(60));
  console.log('📊 RESUMEN DEL DIAGNÓSTICO\n');
  console.log(`✅ Variables configuradas: ${allConfigured ? 'SÍ' : 'NO'}`);
  console.log(`✅ Conexión establecida: ${connectionEstablished ? 'SÍ' : 'NO'}`);
  console.log(`✅ Capacidades recibidas: ${capabilitiesReceived ? 'SÍ' : 'NO'}`);
  console.log(`✅ Audio de bienvenida: ${welcomeAudioReceived ? 'SÍ' : 'NO'}`);
  console.log('═'.repeat(60));
  
  process.exit(0);
});

// Simular envío de chunks de audio
function simulateAudioChunks(ws) {
  console.log('📤 Enviando chunks de audio de prueba...\n');
  
  // Simular 5 chunks de 1 segundo cada uno
  let chunksSent = 0;
  const totalChunks = 5;
  
  const sendChunk = () => {
    if (chunksSent >= totalChunks) {
      console.log(`\n✅ ${totalChunks} chunks enviados`);
      console.log('⏳ Esperando respuesta del servidor...');
      
      // Esperar 10 segundos para ver si llega respuesta
      setTimeout(() => {
        console.log('\n⚠️  No se recibió respuesta después de 10 segundos');
        console.log('   PROBLEMA IDENTIFICADO: El servidor no procesa el audio');
        console.log('\n   Posibles causas:');
        console.log('   1. Deepgram no está transcribiendo (API key inválida)');
        console.log('   2. Formato de audio incompatible');
        console.log('   3. Chunks muy pequeños (< 2KB)');
        ws.close();
      }, 10000);
      return;
    }
    
    // Crear un chunk de audio WebM falso (simulación)
    // En producción, esto sería audio real del micrófono
    const fakeAudio = Buffer.alloc(3000); // 3KB chunk
    const base64Audio = fakeAudio.toString('base64');
    
    ws.send(JSON.stringify({
      route: 'audio',
      action: 'stt',
      payload: {
        audio: base64Audio,
        format: 'webm',
        mimeType: 'audio/webm;codecs=opus'
      }
    }));
    
    chunksSent++;
    console.log(`   Chunk ${chunksSent}/${totalChunks} enviado (${base64Audio.length} bytes)`);
    
    setTimeout(sendChunk, 1000); // Enviar cada 1 segundo
  };
  
  sendChunk();
}