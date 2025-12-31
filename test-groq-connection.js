/**
 * Test script to verify Groq API connection and response
 * Run: node test-groq-connection.js
 */

const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY) {
  console.error('❌ GROQ_API_KEY no está configurada');
  console.log('Por favor, configura la variable de entorno:');
  console.log('export GROQ_API_KEY=tu_api_key');
  process.exit(1);
}

async function testGroqConnection() {
  console.log('🧪 Probando conexión con Groq API...\n');

  const systemPrompt = `Eres Sandra, la asistente virtual de Guests Valencia, especializada en hospitalidad y turismo.
Responde SIEMPRE en español neutro, con buena ortografía y gramática.
Actúa como una experta en Hospitalidad y Turismo.
Sé breve: máximo 4 frases salvo que se pida detalle.
Sé amable, profesional y útil.`;

  const userMessage = 'Hola Sandra, ¿cómo estás?';

  try {
    console.log('📤 Enviando mensaje a Groq...');
    console.log(`Usuario: "${userMessage}"\n`);

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'qwen2.5-72b-instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error en la respuesta de Groq:');
      console.error(`Status: ${response.status}`);
      console.error(`Error: ${errorText}`);
      process.exit(1);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('❌ Respuesta inválida de Groq:', JSON.stringify(data, null, 2));
      process.exit(1);
    }

    const aiResponse = data.choices[0].message.content;
    const model = data.model;
    const usage = data.usage;

    console.log('✅ ¡Conexión exitosa con Groq!\n');
    console.log('📥 Respuesta del modelo:');
    console.log(`Modelo: ${model}`);
    console.log(`Respuesta: "${aiResponse}"\n`);
    console.log('📊 Uso de tokens:');
    console.log(`  - Prompt: ${usage.prompt_tokens}`);
    console.log(`  - Completion: ${usage.completion_tokens}`);
    console.log(`  - Total: ${usage.total_tokens}\n`);

    // Verificar que la respuesta es en español
    if (aiResponse.trim().length > 0) {
      console.log('✅ El modelo respondió correctamente');
      console.log('✅ Listo para integrar en el servidor\n');
      return true;
    } else {
      console.error('❌ El modelo no generó una respuesta');
      return false;
    }

  } catch (error) {
    console.error('❌ Error al conectar con Groq:');
    console.error(error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Ejecutar test
testGroqConnection()
  .then((success) => {
    if (success) {
      console.log('🎉 Test completado exitosamente');
      process.exit(0);
    } else {
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('❌ Error inesperado:', error);
    process.exit(1);
  });
