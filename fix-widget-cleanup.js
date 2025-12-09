const fs = require('fs');

const filePath = './index.html';
let content = fs.readFileSync(filePath, 'utf8');

// Encontrar el inicio del código muerto
const startMarker = '// === CÓDIGO ELIMINADO: Clase SandraWidget antigua (causaba conflictos) ===';
const endMarker = '// === FIN DE CÓDIGO ELIMINADO (clase antigua causaba conflictos) ===';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  // Obtener todo hasta el inicio
  const before = content.substring(0, startIndex);
  // Encontrar el final del marcador de inicio (incluye líneas de comentario)
  const startMarkerEnd = content.indexOf('\n', startIndex) + 1;
  const startMarkerEnd2 = content.indexOf('\n', startMarkerEnd) + 1;
  const startMarkerEnd3 = content.indexOf('\n', startMarkerEnd2) + 1;
  
  // Obtener todo después del final
  const after = content.substring(endIndex);
  
  // Reemplazar todo el bloque con solo los comentarios
  const cleaned = before + 
    '    // === CÓDIGO ELIMINADO: Clase SandraWidget antigua (causaba conflictos) ===\n' +
    '    // La clase correcta está en assets/js/sandra-widget.js y se carga desde el archivo externo\n' +
    '    // Todo el código muerto de la clase antigua ha sido eliminado\n\n' +
    after;
  
  fs.writeFileSync(filePath, cleaned, 'utf8');
  console.log('✅ Código muerto eliminado correctamente');
  console.log(`   Eliminadas aproximadamente ${endIndex - startIndex} caracteres de código`);
} else {
  console.error('❌ No se encontraron los marcadores');
}

