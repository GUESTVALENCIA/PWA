#!/usr/bin/env node

/**
 * Crear extensión vector en Neon DB
 * Usa las credenciales de NEON_DATABASE_URL del entorno
 */

const { neon } = require('@neondatabase/serverless');
const https = require('https');

// Obtener URL de conexión desde variables de entorno o usar la URL directa
const databaseUrl = process.env.NEON_DATABASE_URL || 
                    process.env.DATABASE_URL ||
                    'postgresql://neondb_owner:npg_G2baKCg4FlyN@ep-fragrant-meadow-ah27lbiy-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require';

if (!databaseUrl) {
  console.error('❌ Error: NEON_DATABASE_URL o DATABASE_URL no configurada');
  console.error('   Configura la variable de entorno antes de ejecutar este script');
  process.exit(1);
}

async function createVectorExtension() {
  console.log('='.repeat(70));
  console.log('🔧 CREAR EXTENSIÓN VECTOR EN NEON DB');
  console.log('='.repeat(70));
  console.log('\n📋 Conectando a Neon DB...\n');

  try {
    const sql = neon(databaseUrl);
    
    // Verificar si la extensión ya existe
    console.log('🔍 Verificando si la extensión vector ya existe...');
    const checkResult = await sql`
      SELECT EXISTS(
        SELECT 1 FROM pg_extension WHERE extname = 'vector'
      ) as exists;
    `;
    
    if (checkResult && checkResult[0] && checkResult[0].exists) {
      console.log('✅ La extensión vector ya existe en la base de datos');
      return true;
    }
    
    // Crear la extensión
    console.log('📦 Creando extensión vector...');
    await sql`CREATE EXTENSION IF NOT EXISTS vector;`;
    
    // Verificar que se creó correctamente
    console.log('🔍 Verificando que la extensión se creó...');
    const verifyResult = await sql`
      SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';
    `;
    
    if (verifyResult && verifyResult.length > 0) {
      console.log(`\n✅ Extensión vector creada exitosamente`);
      console.log(`   Versión: ${verifyResult[0].extversion || 'N/A'}`);
      return true;
    } else {
      console.error('❌ Error: La extensión no se creó correctamente');
      return false;
    }
    
  } catch (error) {
    console.error('\n❌ Error creando extensión vector:');
    console.error(`   Código: ${error.code || 'N/A'}`);
    console.error(`   Mensaje: ${error.message}`);
    
    if (error.message.includes('does not exist')) {
      console.error('\n💡 Solución:');
      console.error('   La extensión pgvector puede no estar disponible en tu plan de Neon.');
      console.error('   Verifica en el dashboard de Neon si tu plan soporta extensiones.');
      console.error('   O contacta con soporte de Neon para habilitar pgvector.');
    }
    
    return false;
  }
}

async function main() {
  const success = await createVectorExtension();
  
  console.log('\n' + '='.repeat(70));
  if (success) {
    console.log('✅ PROCESO COMPLETADO');
    console.log('='.repeat(70));
    console.log('\n💡 La extensión vector está lista para usar.');
    console.log('   El adaptador Neon de IA-SANDRA ahora debería funcionar correctamente.\n');
  } else {
    console.log('❌ PROCESO FALLIDO');
    console.log('='.repeat(70));
    console.log('\n⚠️  Revisa los errores arriba y toma las acciones necesarias.\n');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('\n❌ Error fatal:', error);
  process.exit(1);
});
