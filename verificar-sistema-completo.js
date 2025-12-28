#!/usr/bin/env node
/**
 * Verificación completa del sistema antes de pruebas
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFICACIÓN COMPLETA DEL SISTEMA\n');
console.log('='.repeat(60));

// 1. Verificar archivos críticos
console.log('\n📁 1. Verificando archivos críticos...');
const archivosCriticos = [
  'index.html',
  'assets/js/galaxy/WIDGET_INYECTABLE.js',
  'assets/js/websocket-stream-client.js',
  'api/config.js',
  'vercel.json'
];

let archivosOk = true;
archivosCriticos.forEach(archivo => {
  if (fs.existsSync(archivo)) {
    console.log(`   ✅ ${archivo}`);
  } else {
    console.log(`   ❌ ${archivo} - NO ENCONTRADO`);
    archivosOk = false;
  }
});

// 2. Verificar que no hay widgets duplicados
console.log('\n🔍 2. Verificando widgets duplicados...');
const indexContent = fs.readFileSync('index.html', 'utf-8');
const widgetMatches = indexContent.match(/WIDGET_INYECTABLE|sandra-widget|SandraWidget/g);
if (widgetMatches && widgetMatches.length > 2) {
  console.log(`   ⚠️  Posibles widgets duplicados: ${widgetMatches.length} referencias`);
} else {
  console.log('   ✅ Sin widgets duplicados detectados');
}

// 3. Verificar que el widget Galaxy tiene la lógica de llamada
console.log('\n📋 3. Verificando lógica de llamada en widget Galaxy...');
const widgetContent = fs.readFileSync('assets/js/galaxy/WIDGET_INYECTABLE.js', 'utf-8');
const tieneStartCall = widgetContent.includes('async startCall()');
const tieneWebSocket = widgetContent.includes('window.websocketStreamClient');
const tieneEndCall = widgetContent.includes('async endCall(');
const tieneDisconnect = widgetContent.includes('wsClient.disconnect()');

console.log(`   ${tieneStartCall ? '✅' : '❌'} Método startCall() presente`);
console.log(`   ${tieneWebSocket ? '✅' : '❌'} Usa websocketStreamClient`);
console.log(`   ${tieneEndCall ? '✅' : '❌'} Método endCall() presente`);
console.log(`   ${tieneDisconnect ? '✅' : '❌'} Usa disconnect() correctamente`);

// 4. Verificar WebSocket client
console.log('\n🔌 4. Verificando WebSocket client...');
const wsClientContent = fs.readFileSync('assets/js/websocket-stream-client.js', 'utf-8');
const tieneAudioRoute = wsClientContent.includes("case 'audio':");
const tienePlayBase64 = wsClientContent.includes('playBase64Audio');
const tieneHandleAudio = wsClientContent.includes('handleAudioResponse');

console.log(`   ${tieneAudioRoute ? '✅' : '❌'} Maneja route: 'audio'`);
console.log(`   ${tienePlayBase64 ? '✅' : '❌'} Función playBase64Audio() presente`);
console.log(`   ${tieneHandleAudio ? '✅' : '❌'} Función handleAudioResponse() presente`);

// 5. Verificar configuración de Vercel
console.log('\n⚙️  5. Verificando configuración...');
const vercelJson = JSON.parse(fs.readFileSync('vercel.json', 'utf-8'));
console.log(`   ✅ vercel.json válido`);
console.log(`   📋 Rewrites: ${vercelJson.rewrites?.length || 0}`);

// 6. Resumen
console.log('\n' + '='.repeat(60));
console.log('📊 RESUMEN DE VERIFICACIÓN\n');

const todosOk = archivosOk && tieneStartCall && tieneWebSocket && tieneEndCall && 
                tieneDisconnect && tieneAudioRoute && tienePlayBase64 && tieneHandleAudio;

if (todosOk) {
  console.log('✅ SISTEMA LISTO PARA PRUEBAS');
  console.log('\n📝 PRÓXIMOS PASOS:');
  console.log('   1. Hacer commit y push de los cambios');
  console.log('   2. Esperar deploy en Vercel');
  console.log('   3. Probar en https://guestsvalencia.es');
  console.log('   4. Verificar:');
  console.log('      - Widget Galaxy se carga correctamente');
  console.log('      - Botón de llamada funciona');
  console.log('      - Audio se reproduce correctamente');
  console.log('      - WebSocket se conecta a wss://pwa-imbf.onrender.com');
} else {
  console.log('⚠️  HAY PROBLEMAS QUE CORREGIR');
}

console.log('\n' + '='.repeat(60));

