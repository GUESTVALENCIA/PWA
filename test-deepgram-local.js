const TranscriberService = require('./mcp-server/services/transcriber');

async function testDeepgram() {
    console.log('Testing Deepgram Transcriber...');
    const transcriber = new TranscriberService();

    // Dummy base64 audio (1 second of silence or noise)
    // This is a minimal valid opus frame or similar to test connectivity
    /* 
       We can't easily fake valid opus audio without a file. 
       But we can try to init the service and check config.
    */

    if (!process.env.DEEPGRAM_API_KEY) {
        console.error('❌ DEEPGRAM_API_KEY is missing in env');
        return;
    }

    console.log('Deepgram Service Initialized. API Key Present:', !!transcriber.apiKey);
    console.log('Status:', transcriber.getStatus());

    // We won't actually call the API without real audio, but we verified the code path.
}

testDeepgram();
