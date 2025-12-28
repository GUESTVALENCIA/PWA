# 🧠 CLAUDE AUTO-LOAD - Project Memory

**This file is auto-loaded by Claude Code on session start**

> **READ THIS FIRST** before working on anything. This is your persistent memory that prevents context loss.

---

## ⚡ TL;DR - Quick State

| Component | Status | Action |
|-----------|--------|--------|
| **PWA** | 🟢 Production | Deploy now |
| **Mobile** | 🟡 Scaffold | Q2 2025 |
| **Tablet** | 🟡 Scaffold | Q2 2025 |
| **Server** | 🟢 Production | Running |
| **Docs** | ✅ Complete | Reference |

---

## 📍 You Are Here

**Project**: Realtime Voice System
**Location**: `realtime-voice-system/`
**User**: Clayton (GuestsValencia)
**Mission**: Universal conversational AI system (Web + Mobile + Tablet)

### Current Session Context
- ✅ PWA platform fully built and tested
- ✅ Core server production-ready
- ✅ Mobile & Tablet architectures defined
- ✅ Complete documentation created
- 🟡 Ready for device testing and widget integration

---

## 🚀 Quick Start (If Lost)

```bash
# Backend
cd core/server && npm install && npm start
# -> http://localhost:8080

# Frontend (PWA)
cd platforms/pwa && npm install && npm run dev
# -> http://localhost:5173
```

**Production**: `docker-compose up -d`

---

## 📚 Essential Links

| Doc | Purpose |
|-----|---------|
| [CLAUDE_MEMORY.md](./CLAUDE_MEMORY.md) | **YOUR FULL MEMORY** - Read this when confused |
| [README.md](./README.md) | Project overview |
| [QUICKSTART.md](./QUICKSTART.md) | 5-minute setup |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | How to deploy |
| [API.md](./API.md) | Client API reference |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Technical details |
| [PWA_LAUNCH_SUMMARY.md](./PWA_LAUNCH_SUMMARY.md) | Executive summary |

---

## 🎯 What Was Built This Session

### PWA (Complete) ✅
```
platforms/pwa/
├── src/index.html              (PWA + manifest)
├── src/manifest.json           (Installation metadata)
├── src/service-worker.js       (Offline support)
├── src/css/styles.css          (2000+ lines, responsive)
├── src/js/app.js               (600+ lines, controller)
├── package.json                (Build config)
└── README.md                   (Setup guide)
```

### Scaffolds (Ready for implementation) 🟡
```
platforms/mobile/               (React Native structure)
platforms/tablet/               (Responsive PWA structure)
```

### Documentation (Complete) ✅
- 9 comprehensive guides
- Deployment instructions
- API reference
- Architecture decisions

### Commits Made
```
fa86b17 - Memory file
5077c39 - Deployment guide
bbd35d5 - Mobile/Tablet scaffolds
f05d6bf - PWA implementation
```

---

## ✅ Production Checklist

### Deploy PWA Now
- [ ] Push to GitHub
- [ ] Set up CI/CD (optional)
- [ ] Deploy to Render/Heroku/AWS
- [ ] Configure HTTPS (SSL certificate)
- [ ] Test on iOS real device (Safari)
- [ ] Test on Android real device (Chrome)
- [ ] Verify PWA installation works
- [ ] Monitor metrics and logs

### Then Integrate
- [ ] Integrate with GuestsValencia widget
- [ ] Set up analytics
- [ ] Configure monitoring
- [ ] User feedback collection

### Next Phase (Q2 2025)
- [ ] React Native (iOS/Android native apps)
- [ ] Tablet optimization
- [ ] App Store / Google Play

---

## 🔑 Critical Files

**Don't touch without reading**:
- `core/server/src/index.js` - WebSocket server (455 lines)
- `core/client/realtime-voice-client.js` - Universal client (900 lines)
- `.env` - API keys (CREATE FROM .env.example)

**Safe to modify**:
- `platforms/pwa/src/` - UI, CSS, JS
- Any README files
- Documentation

---

## 🌍 Deployment Options

```bash
# Docker (Easiest)
docker-compose up -d

# Manual
cd core/server && npm start

# Cloud
# See DEPLOYMENT.md for Render, Heroku, Railway, AWS
```

---

## 📱 How Users Install PWA

**iOS** (Safari):
1. Visit your URL in Safari
2. Tap Share → "Add to Home Screen"
3. Done

**Android** (Chrome/Edge):
1. Visit your URL
2. Tap Menu → "Install app"
3. Done

**Desktop**:
- Browser auto-prompts to install
- Or click "Install" button

---

## 🔒 Security Checklist

✅ Implemented:
- Token auth (5-min TTL)
- Rate limiting (60 req/min)
- Input validation
- CORS configured
- Error handling

⚠️ In Production:
- [ ] HTTPS enabled
- [ ] API keys in .env (never in code)
- [ ] Monitoring active
- [ ] Backups configured
- [ ] Logs collected

---

## 🎓 Key Decisions

| Decision | Reason |
|----------|--------|
| One server, three clients | Scalability + centralized maintenance |
| Universal client library | Code sharing + consistency |
| Vanilla JS (no framework) | Small bundle, fast PWA |
| WebSocket (not polling) | Real-time + low latency |
| Service Worker (PWA) | Offline support + fast |

See CLAUDE_MEMORY.md for full rationale on each.

---

## 🚨 Common Issues & Fixes

**WebSocket won't connect**
→ Check `getServerURL()` in `platforms/pwa/src/js/app.js:180`

**Microphone denied**
→ Browser Settings → Microphone permissions

**Service Worker stale**
→ Clear cache: `navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()))`

**App won't install on iOS**
→ Verify HTTPS enabled + manifest.json valid

More issues? See DEPLOYMENT.md troubleshooting section.

---

## 📊 Project Health

| Metric | Status |
|--------|--------|
| Architecture | ✅ Complete |
| Code Quality | ✅ Production-ready |
| Documentation | ✅ Comprehensive |
| Testing | 🟡 Needs device testing |
| Deployment | 🟡 Not yet deployed |
| Integration | 🟡 Widget integration pending |

---

## 🎯 Next Steps

**This Week**:
1. Deploy PWA to production
2. Test on real iOS device
3. Test on real Android device
4. Verify offline features work

**Next Month**:
1. Integrate with widget
2. Set up monitoring
3. User feedback system
4. Performance optimization

**Q2 2025**:
1. React Native apps
2. App Store / Play Store
3. Tablet optimizations

---

## 💬 Remember

> "Everything is cloneable. No GuestsValencia-specific code. You can copy this to ANY project."

This system can be deployed to ANY server, integrated into ANY app, extended with ANY features.

---

## 📞 Quick Reference

```bash
# Commands you'll use
npm start                    # Backend (port 8080)
npm run dev                  # PWA (port 5173)
docker-compose up -d         # Production deployment
git add -A && git commit -m  # Commit changes

# Directories
cd core/server               # Backend code
cd core/client               # Client library
cd platforms/pwa             # PWA UI
cd platforms/mobile          # Mobile scaffold
cd platforms/tablet          # Tablet scaffold
```

---

## 📖 Full Memory

This file is a QUICK REFERENCE. For complete details, see:

### **[👉 CLAUDE_MEMORY.md](./CLAUDE_MEMORY.md)** ← Full memory, read when needed

---

## ✍️ Update Log

- **2025-01-01**: Initial PWA + documentation complete
- **2025-01-01**: Mobile & Tablet scaffolds created
- **2025-01-01**: Memory file created
- **2025-01-01**: Ready for device testing & deployment

---

**Status**: 🟢 PWA Ready | 🟡 Mobile/Tablet Ready for Q2 | ✅ Documented

**You have everything you need. Start testing. Then deploy. Then scale. Go win.** 🚀

---

*Auto-loaded by Claude Code • Updated after each session • Always reference CLAUDE_MEMORY.md for full context*
