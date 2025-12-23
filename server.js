const app = require('./src/app');
const config = require('./src/config/config');

app.listen(config.port, () => {
  console.log(` Galaxy Server running on http://localhost:${config.port}`);
  console.log(` API available at http://localhost:${config.port}/api/sandra/chat`);
  console.log(` Voice API available at http://localhost:${config.port}/api/sandra/voice`);
  console.log(` Transcribe API available at http://localhost:${config.port}/api/sandra/transcribe`);
  console.log(` PWA available at http://localhost:${config.port}`);
  console.log(` Galaxy System adapted for Gemini (Enterprise Edition)`);
});
