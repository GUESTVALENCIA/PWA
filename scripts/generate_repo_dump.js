const fs = require('fs');
const path = require('path');

// CONFIGURACIÓN
const OUTPUT_FILE = 'REPOSITORY_DUMP.txt';
const IGNORE_DIRS = [
    'node_modules',
    '.git',
    '.github',
    'coverage',
    'dist',
    'build',
    'logs',
    '.continue'
];
const IGNORE_FILES = [
    'package-lock.json',
    '.DS_Store',
    'Thumbs.db',
    OUTPUT_FILE,
    '.env',
    '.env.production',
    'start_log.txt',
    'start_log_2.txt'
];
const INCLUDE_EXTENSIONS = [
    '.js', '.json', '.md', '.html', '.css', '.txt', '.ps1', '.yaml', '.yml', '.sh'
];

// HEADER DEL PROMPT DE SISTEMA
const SYSTEM_PROMPT = `
================================================================================
CONTEXTO DE SISTEMA - GUESTSVALENCIA GALAXY (ENTERPRISE EDITION)
================================================================================
FECHA DE EXTRACCIÓN: ${new Date().toISOString()}
ROL: Eres el Arquitecto de Software Principal del proyecto GuestsValencia.
MISIÓN: Utiliza este contexto para planificar migraciones, refactorizaciones y scripts de mantenimiento.
ESTRICTAMENTE PROHIBIDO: Alucinar archivos que no existen en este volcado.

ESTRUCTURA DE ARCHIVOS:
`;

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function(file) {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (!IGNORE_DIRS.includes(file)) {
                arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
            }
        } else {
            if (!IGNORE_FILES.includes(file) && INCLUDE_EXTENSIONS.includes(path.extname(file))) {
                arrayOfFiles.push(fullPath);
            }
        }
    });

    return arrayOfFiles;
}

function generateDump() {
    console.log('🚀 Iniciando extracción de contexto para Google AI Studio...');
    const rootDir = path.join(__dirname, '..');
    const allFiles = getAllFiles(rootDir);

    let content = SYSTEM_PROMPT;

    // 1. Agregar Estructura de Directorios
    content += '\nLISTADO DE ARCHIVOS:\n';
    allFiles.forEach(f => {
        const relativePath = path.relative(rootDir, f);
        content += `- ${relativePath}\n`;
    });
    content += '\n================================================================================\n\n';

    // 2. Agregar Contenido de Archivos
    let fileCount = 0;
    allFiles.forEach(f => {
        const relativePath = path.relative(rootDir, f);
        console.log(`📄 Procesando: ${relativePath}`);

        try {
            const fileContent = fs.readFileSync(f, 'utf8');
            content += `\n--- INICIO ARCHIVO: ${relativePath} ---\n`;
            content += fileContent;
            content += `\n--- FIN ARCHIVO: ${relativePath} ---\n`;
            fileCount++;
        } catch (err) {
            console.error(`⚠️ Error leyendo ${relativePath}: ${err.message}`);
        }
    });

    const outputPath = path.join(rootDir, OUTPUT_FILE);
    fs.writeFileSync(outputPath, content);

    console.log('\n================================================================================');
    console.log(`✅ EXTRACCIÓN COMPLETADA EXITOSAMENTE`);
    console.log(`📦 Archivos procesados: ${fileCount}`);
    console.log(`💾 Archivo generado: ${OUTPUT_FILE}`);
    console.log(`📍 Ubicación: ${outputPath}`);
    console.log('================================================================================');
    console.log('👉 AHORA: Sube este archivo a Google AI Studio y activa "Context Caching".');
}

generateDump();
