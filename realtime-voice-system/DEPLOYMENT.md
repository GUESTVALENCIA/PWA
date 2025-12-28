# Deployment Guide - Realtime Voice System

Complete deployment guide for all platforms (PWA, Mobile, Docker, Cloud).

## Table of Contents

1. [Quick Start](#quick-start)
2. [Local Development](#local-development)
3. [Docker Deployment](#docker-deployment)
4. [Cloud Deployment](#cloud-deployment)
5. [PWA Installation](#pwa-installation)
6. [Mobile Apps](#mobile-apps)
7. [Production Checklist](#production-checklist)

---

## Quick Start

### Development (Local)

```bash
# 1. Clone repository
git clone https://github.com/yourusername/realtime-voice-system.git
cd realtime-voice-system

# 2. Start backend server
cd core/server
npm install
cp .env.example .env
# Edit .env with your API keys
npm start

# Server runs on: http://localhost:8080

# 3. In new terminal: Start PWA
cd platforms/pwa
npm install
npm run dev

# PWA runs on: http://localhost:5173
```

### Production (Docker)

```bash
# Build and run with Docker Compose
docker-compose up -d

# Access at: https://yourdomain.com
```

---

## Local Development

### Prerequisites

- **Node.js** 18+
- **npm** 9+
- Modern browser (Chrome, Firefox, Safari, Edge)

### Backend Setup

```bash
cd core/server

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your API keys:
# - DEEPGRAM_API_KEY
# - GEMINI_API_KEY
# - ANTHROPIC_API_KEY
# - OPENAI_API_KEY
# - MIVOZ_API_KEY
# - CARTESIA_API_KEY
# - ELEVENLABS_API_KEY

nano .env  # or use your editor

# Start development server
npm start

# Output: ✅ Server running on http://localhost:8080
```

### Frontend Setup

#### PWA (Recommended for Development)

```bash
cd platforms/pwa

# Install dependencies
npm install

# Start development server
npm run dev

# Output: ➜ Local: http://localhost:5173/
```

**Test on Mobile:**

```bash
# 1. Get your computer's IP
# macOS/Linux:
ifconfig | grep inet | grep -v 127

# Windows:
ipconfig | findstr IPv4

# 2. On mobile, visit: http://<YOUR_IP>:5173
# 3. Test microphone permissions
# 4. Add to home screen (iOS/Android)
```

### Common Issues

#### Port Already in Use

```bash
# Find process using port 8080
lsof -i :8080
kill -9 <PID>

# Or use different port
PORT=3000 npm start
```

#### Microphone Not Working

```bash
# Check browser permissions
# Chrome: chrome://settings/content/microphone
# Safari: System Preferences > Security & Privacy > Microphone

# Test WebAudio API
npx node -e "
const ctx = new (window.AudioContext || window.webkitAudioContext)();
console.log('WebAudio OK')
"
```

#### CORS Issues

Backend already has CORS enabled for:
- `http://localhost:*`
- `http://127.0.0.1:*`
- Production domain (when deployed)

---

## Docker Deployment

### Single-Container (Simple)

**Dockerfile:**

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY core/server/package*.json ./
RUN npm install --production

# Copy application
COPY core/server ./

# Copy PWA
COPY platforms/pwa/dist ./public

# Environment
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)}).on('error', (e) => {throw e})"

CMD ["node", "src/index.js"]
```

**Build and Run:**

```bash
# Build image
docker build -t realtime-voice-system:latest .

# Run container
docker run -d \
  --name realtime-voice \
  -p 8080:8080 \
  -e DEEPGRAM_API_KEY=xxx \
  -e GEMINI_API_KEY=xxx \
  -e ANTHROPIC_API_KEY=xxx \
  -e OPENAI_API_KEY=xxx \
  realtime-voice-system:latest

# View logs
docker logs -f realtime-voice

# Stop container
docker stop realtime-voice
docker rm realtime-voice
```

### Multi-Container (Recommended)

**docker-compose.yml:**

```yaml
version: '3.8'

services:
  # Realtime Voice Server
  server:
    build:
      context: .
      dockerfile: Dockerfile.server
    container_name: realtime-voice-server
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      NODE_ENV: production
      PORT: 8080
      DEEPGRAM_API_KEY: ${DEEPGRAM_API_KEY}
      GEMINI_API_KEY: ${GEMINI_API_KEY}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      MIVOZ_API_KEY: ${MIVOZ_API_KEY}
      CARTESIA_API_KEY: ${CARTESIA_API_KEY}
      ELEVENLABS_API_KEY: ${ELEVENLABS_API_KEY}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 5s
    volumes:
      - ./logs:/app/logs
    networks:
      - realtime-voice

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: realtime-voice-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - ./platforms/pwa/dist:/usr/share/nginx/html:ro
    depends_on:
      - server
    networks:
      - realtime-voice

networks:
  realtime-voice:
    driver: bridge
```

**docker-compose.env:**

```env
DEEPGRAM_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
MIVOZ_API_KEY=your_key_here
CARTESIA_API_KEY=your_key_here
ELEVENLABS_API_KEY=your_key_here
```

**Deploy:**

```bash
# Create .env file
cp docker-compose.env .env

# Start all services
docker-compose up -d

# View status
docker-compose ps

# View logs
docker-compose logs -f server

# Stop services
docker-compose down
```

### Nginx Configuration

**nginx.conf:**

```nginx
upstream realtime_voice_server {
    server server:8080;
}

server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # PWA static files (cache-first)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root /usr/share/nginx/html;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Service Worker (network-first)
    location = /service-worker.js {
        root /usr/share/nginx/html;
        add_header Cache-Control "no-cache";
    }

    # Manifest (network-first)
    location = /manifest.json {
        root /usr/share/nginx/html;
        add_header Cache-Control "no-cache";
        add_header Content-Type "application/manifest+json";
    }

    # index.html (network-first)
    location = / {
        root /usr/share/nginx/html;
        add_header Cache-Control "no-cache";
        try_files $uri /index.html;
    }

    # API endpoints (proxy to backend)
    location /api {
        proxy_pass http://realtime_voice_server;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }

    # WebSocket (proxy to backend)
    location / {
        proxy_pass http://realtime_voice_server;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;

        # Try static file first
        try_files $uri $uri/ =404;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://realtime_voice_server;
        access_log off;
    }
}
```

---

## Cloud Deployment

### Render

**1. Connect Repository**
- Push code to GitHub
- Connect Render to GitHub

**2. Create Web Service**
```
Build Command: cd core/server && npm install
Start Command: npm start
Environment Variables:
  - DEEPGRAM_API_KEY
  - GEMINI_API_KEY
  - ANTHROPIC_API_KEY
  - OPENAI_API_KEY
  - MIVOZ_API_KEY
  - CARTESIA_API_KEY
  - ELEVENLABS_API_KEY
```

**3. Deploy PWA**
- Build: `npm run build` in `platforms/pwa/`
- Deploy `dist/` to Render Static Site

### Heroku

**Procfile:**
```
web: cd core/server && npm start
```

**Deploy:**
```bash
heroku login
heroku create realtime-voice-system
heroku config:set DEEPGRAM_API_KEY=xxx
heroku config:set GEMINI_API_KEY=xxx
# ... other keys
git push heroku main
```

### Railway

**1. Create New Project**
- Connect GitHub repository

**2. Add Environment Variables**
- DEEPGRAM_API_KEY
- All other API keys

**3. Configure Start Command**
```
cd core/server && npm start
```

### AWS EC2

**1. Launch EC2 Instance**
```bash
# Connect to instance
ssh -i key.pem ec2-user@instance-ip

# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install nodejs

# Clone repository
git clone https://github.com/yourusername/realtime-voice-system.git
cd realtime-voice-system

# Setup environment
cd core/server
npm install
cp .env.example .env
# Edit .env with API keys
```

**2. Use PM2 for Process Management**
```bash
npm install -g pm2

# Start server
pm2 start src/index.js --name "realtime-voice"

# Configure to start on boot
pm2 startup
pm2 save

# View logs
pm2 logs realtime-voice
```

**3. Configure SSL**
```bash
# Install Certbot
sudo yum install certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com

# Configure Nginx with SSL
# (See nginx.conf above)
```

---

## PWA Installation

### Desktop (Any OS)

1. **Open Browser** - Chrome, Firefox, Safari, or Edge
2. **Visit URL** - `https://yourdomain.com`
3. **Install Prompt** - Click "Install" or use browser menu
4. **Access** - Appears as regular desktop app

### iOS (iPhone/iPad)

1. **Open Safari**
2. **Visit URL** - `https://yourdomain.com`
3. **Tap Share** - Bottom toolbar
4. **Select** - "Add to Home Screen"
5. **Confirm** - Tap "Add"
6. **Access** - On home screen as regular app

### Android (Phone/Tablet)

**Chrome/Edge:**
1. **Open Chrome** or Edge
2. **Visit URL** - `https://yourdomain.com`
3. **Tap Menu** - Three dots, top right
4. **Select** - "Install app" or "Add to Home Screen"
5. **Confirm** - Follow prompts
6. **Access** - On home screen as regular app

**Samsung Internet:**
1. **Open Samsung Internet**
2. **Visit URL**
3. **Tap Menu** - Three dots
4. **Select** - "Add to home screen"
5. **Confirm**
6. **Access** - On home screen

---

## Mobile Apps

### iOS (Native App)

Coming in Q2 2025
- React Native implementation
- Distribution via App Store

### Android (Native App)

Coming in Q2 2025
- React Native implementation
- Distribution via Google Play Store

---

## Production Checklist

### Pre-Deployment

- [ ] All API keys configured in environment
- [ ] SSL/TLS certificates installed
- [ ] Nginx reverse proxy configured
- [ ] Health check endpoints verified
- [ ] Rate limiting configured
- [ ] Monitoring and logging setup

### Deployment

- [ ] Database backups configured
- [ ] Docker images built and tested
- [ ] Services running and healthy
- [ ] Health checks passing
- [ ] Logs being collected
- [ ] Monitoring alerts configured

### Post-Deployment

- [ ] Test all features on production
- [ ] Verify PWA installation on mobile
- [ ] Test voice calls end-to-end
- [ ] Monitor performance metrics
- [ ] Check error logs for issues
- [ ] Monitor API key usage
- [ ] Review security headers

### Monitoring

**Key Metrics:**
- Server uptime
- Response time (< 300ms target)
- Error rate (< 0.1% target)
- API key usage
- WebSocket connection count
- Memory usage
- CPU usage
- Disk usage

**Tools:**
- Uptime Robot (monitoring)
- New Relic (APM)
- Datadog (infrastructure)
- CloudWatch (AWS)
- Sentry (error tracking)

### Scaling

**Horizontal Scaling:**
- Use load balancer (Nginx, HAProxy)
- Run multiple server instances
- Use Redis for session sharing

**Vertical Scaling:**
- Upgrade server resources
- Optimize database queries
- Cache responses
- Compress payloads

---

## Troubleshooting

### Server Won't Start

```bash
# Check logs
cat logs/realtime-voice.log

# Verify API keys
grep -E 'DEEPGRAM|GEMINI|ANTHROPIC|OPENAI' .env

# Check port availability
lsof -i :8080

# Test connectivity
curl http://localhost:8080/health
```

### WebSocket Connection Issues

```bash
# Check WebSocket support
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  http://localhost:8080/ws

# Verify Nginx config
nginx -t

# Check firewall
sudo iptables -L | grep 8080
```

### High Memory Usage

```bash
# Check running processes
ps aux | grep node

# Limit Node memory
NODE_OPTIONS=--max_old_space_size=512 npm start

# Enable garbage collection monitoring
node --expose-gc src/index.js
```

---

## Support

For deployment issues:
- Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- Review [API.md](./API.md)
- Open GitHub issue with deployment logs

---

## License

MIT - See [LICENSE](./LICENSE)

---

**Last Updated**: 2025-01-01
**Version**: 1.0.0
**Maintainer**: GuestsValencia
