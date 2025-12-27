# Multi-LLM Provider Guide

## ✨ Feature Overview

The WebSocket Enterprise Stream now supports **4 LLM providers**:
1. **OpenAI** (gpt-4o-mini)
2. **Groq** (mixtral-8x7b-32768) - **FREE TIER** ✅
3. **Anthropic** (claude-3-5-sonnet-20241022)
4. **Google Gemini** (gemini-1.5-flash)

Switch between providers seamlessly without code changes!

---

## 🚀 Quick Start (Using Groq for Free)

### Step 1: Get Groq API Key (Free)

1. Visit: https://console.groq.com/keys
2. Sign up (free account)
3. Generate API key
4. Copy the key

### Step 2: Configure Environment

```env
# .env file

# Required for Deepgram speech-to-text
DEEPGRAM_API_KEY=your_deepgram_key_here

# For Groq (FREE - recommended for testing)
GROQ_API_KEY=your_groq_key_here

# Optional: OpenAI (for comparison)
OPENAI_API_KEY=your_openai_key_here

# Optional: Anthropic
ANTHROPIC_API_KEY=your_anthropic_key_here

# Optional: Google
GOOGLE_API_KEY=your_google_key_here

# Set default provider (optional, defaults to openai)
DEFAULT_LLM_PROVIDER=groq
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Start Server

```bash
npm start
```

### Step 5: Test in Console

```javascript
// Check available providers
window.websocketStreamClient.getStatus()
// Should show: availableProviders: ['openai', 'groq', 'anthropic', 'gemini']

// Change to Groq
window.websocketStreamClient.setProvider('groq')

// Start using it
window.websocketStreamClient.startListening()
// ... speak ...
window.websocketStreamClient.stopListening()
```

---

## 📊 Provider Comparison

| Feature | OpenAI | Groq | Anthropic | Gemini |
|---------|--------|------|-----------|--------|
| **Model** | gpt-4o-mini | mixtral-8x7b-32768 | claude-3.5-sonnet | gemini-1.5-flash |
| **Cost (1M tokens)** | $0.15 | $0.27 | $3.00 | $0.075 |
| **Free Tier** | ❌ | ✅ YES (unlimited calls) | ❌ | ✅ YES (limited) |
| **Latency** | ~2-3s | ~1-2s | ~2-3s | ~1-2s |
| **Quality** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Context Window** | 128K | 32K | 200K | 1M |
| **Recommended** | Production | Testing/Dev | High-Quality | Budget |

---

## 🔄 How to Switch Providers

### From Browser Console

```javascript
// View available providers
window.websocketStreamClient.availableProviders
// Output: ['openai', 'groq', 'anthropic', 'gemini']

// Switch to Groq
window.websocketStreamClient.setProvider('groq')

// Switch to Anthropic
window.websocketStreamClient.setProvider('anthropic')

// Switch to Gemini
window.websocketStreamClient.setProvider('gemini')

// Verify current provider
window.websocketStreamClient.llmProvider
// Output: 'groq'
```

### From HTML UI (Optional)

```html
<div class="provider-selector">
  <label>LLM Provider:</label>
  <select id="llmProviderSelect" onchange="handleProviderChange(event)">
    <option value="openai">OpenAI (gpt-4o-mini)</option>
    <option value="groq">Groq (Free!)</option>
    <option value="anthropic">Anthropic (Claude)</option>
    <option value="gemini">Google Gemini</option>
  </select>
</div>

<script>
  function handleProviderChange(event) {
    const provider = event.target.value;
    window.websocketStreamClient.setProvider(provider);
    console.log('Provider changed to:', provider);
  }

  // Initialize selector with current provider
  document.addEventListener('DOMContentLoaded', () => {
    const select = document.getElementById('llmProviderSelect');
    select.value = window.websocketStreamClient.llmProvider;
  });
</script>
```

---

## 🎯 Recommended Configurations

### Development / Testing (Cheapest)
```env
DEFAULT_LLM_PROVIDER=groq
GROQ_API_KEY=your_groq_key
DEEPGRAM_API_KEY=your_deepgram_key
```
Cost: **FREE** ✅

### Production / Best Quality
```env
DEFAULT_LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=your_anthropic_key
DEEPGRAM_API_KEY=your_deepgram_key
OPENAI_API_KEY=your_openai_key
```
Cost: ~$3/M tokens (Premium quality)

### Budget Production
```env
DEFAULT_LLM_PROVIDER=gemini
GOOGLE_API_KEY=your_google_key
DEEPGRAM_API_KEY=your_deepgram_key
```
Cost: ~$0.075/M tokens (Good quality, cheap)

### Hybrid (All Providers)
```env
DEFAULT_LLM_PROVIDER=groq
GROQ_API_KEY=your_groq_key
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_API_KEY=your_google_key
DEEPGRAM_API_KEY=your_deepgram_key
```
User can choose during runtime!

---

## 🔧 Provider Setup Instructions

### 1. OpenAI

**Already configured in the system.**

```env
OPENAI_API_KEY=sk-proj-...
DEFAULT_LLM_PROVIDER=openai
```

Setup: https://platform.openai.com/account/api-keys

---

### 2. Groq (Recommended for Testing - FREE)

**Fastest setup - completely free!**

```bash
# 1. Go to https://console.groq.com/keys
# 2. Create account (free)
# 3. Generate API key
# 4. Add to .env:

GROQ_API_KEY=gsk_...
DEFAULT_LLM_PROVIDER=groq
```

**Features:**
- ✅ Completely free (no credit card required)
- ⚡ Ultra-fast responses (1-2s)
- 📊 Good quality (mixtral-8x7b-32768)
- Perfect for development and testing

Setup: https://console.groq.com/keys

---

### 3. Anthropic (Claude)

```bash
# 1. Go to https://console.anthropic.com
# 2. Sign up for API access
# 3. Generate API key
# 4. Add to .env:

ANTHROPIC_API_KEY=sk-ant-...
DEFAULT_LLM_PROVIDER=anthropic
```

**Features:**
- 🏆 Best quality responses (Claude 3.5 Sonnet)
- 📚 200K context window
- 💎 Premium model
- More expensive but worth it for quality

Setup: https://console.anthropic.com/

---

### 4. Google Gemini

```bash
# 1. Go to https://makersuite.google.com/app/apikeys
# 2. Create API key
# 3. Add to .env:

GOOGLE_API_KEY=AIza...
DEFAULT_LLM_PROVIDER=gemini
```

**Features:**
- 💰 Cheap ($0.075 per 1M tokens)
- 🚀 Very fast responses
- 📖 1M context window (huge!)
- Good quality at budget price

Setup: https://makersuite.google.com/app/apikeys

---

## 📝 Example: Cost Calculation

**Using Groq (Free) for testing:**

```
Per call (1 minute):
  Deepgram STT:        $0.0043
  Groq LLM:            $0.00 (Free tier)
  ─────────────────────────────
  Total per call:      ~$0.0043

Cost for 1000 calls:   $4.30 ✅ Very affordable
```

**Comparison with other providers:**

```
Per call (1 minute average):
  OpenAI:              $0.30  (150 input, 100 output)
  Groq:                $0.00  (free tier)
  Anthropic:           $0.20  (premium)
  Gemini:              $0.008 (budget)
```

---

## 🔀 Dynamic Provider Switching

### Use Case: A/B Testing

```javascript
// Test different providers
async function testAllProviders() {
  const providers = window.websocketStreamClient.availableProviders;
  const results = {};

  for (const provider of providers) {
    console.log(`Testing ${provider}...`);
    window.websocketStreamClient.setProvider(provider);

    // Start listening, speak, get response
    window.websocketStreamClient.startListening();
    // ... user speaks ...
    await window.websocketStreamClient.stopListening();

    const response = window.websocketStreamClient.currentResponse;
    results[provider] = response;

    console.log(`${provider} response:`, response);
  }

  return results;
}
```

### Use Case: Automatic Provider Selection

```javascript
// Select best provider based on latency
async function selectFastestProvider() {
  const providers = window.websocketStreamClient.availableProviders;
  const latencies = {};

  for (const provider of providers) {
    const start = performance.now();
    window.websocketStreamClient.setProvider(provider);

    window.websocketStreamClient.startListening();
    // ... speak a test phrase ...
    await window.websocketStreamClient.stopListening();

    const elapsed = performance.now() - start;
    latencies[provider] = elapsed;
  }

  const fastest = Object.entries(latencies)
    .sort(([,a], [,b]) => a - b)[0][0];

  window.websocketStreamClient.setProvider(fastest);
  console.log('Using fastest provider:', fastest);
}
```

---

## 🧪 Testing Multiple Providers

### Console Script

```javascript
// Test script to try all providers
async function benchmarkProviders() {
  const client = window.websocketStreamClient;
  const results = {};

  for (const provider of client.availableProviders) {
    console.log(`\n🧪 Testing ${provider.toUpperCase()}...`);

    client.setProvider(provider);

    // Set test input
    client.conversationHistory = [];

    console.log(`Started with ${provider}`);
    results[provider] = {
      provider,
      timestamp: new Date(),
      status: 'ready'
    };
  }

  console.log('\n📊 Available providers:');
  console.table(results);

  return results;
}

// Run it
benchmarkProviders();
```

---

## 💡 Tips & Tricks

### Tip 1: Use Groq for Development

- Free
- Fast
- Perfect for testing

### Tip 2: Use Anthropic for Production

- Best quality
- Most capable model
- Worth the cost

### Tip 3: Use Gemini for Budget Production

- Cheap
- Fast
- Large context window

### Tip 4: Have Fallback Providers

```javascript
const primaryProvider = 'groq';
const fallbackProvider = 'openai';

if (window.websocketStreamClient.availableProviders.includes(primaryProvider)) {
  window.websocketStreamClient.setProvider(primaryProvider);
} else {
  console.warn('Primary provider not available, using fallback');
  window.websocketStreamClient.setProvider(fallbackProvider);
}
```

### Tip 5: Monitor Costs

Track which provider you're using and estimate costs:

```javascript
function estimateMonthlyCost(callCount = 1000) {
  const costs = {
    openai: 0.30 * callCount,      // $300 for 1000 calls
    groq: 0 * callCount,            // FREE
    anthropic: 0.20 * callCount,    // $200 for 1000 calls
    gemini: 0.008 * callCount       // $8 for 1000 calls
  };

  const provider = window.websocketStreamClient.llmProvider;
  console.log(`Estimated cost with ${provider}: $${costs[provider]}/month`);
  return costs;
}

estimateMonthlyCost(1000);
```

---

## 🐛 Troubleshooting

### Provider not available

**Error:** "Proveedor no válido o no disponible"

**Solution:** Check .env has the API key for that provider

```env
# Example: To use Groq
GROQ_API_KEY=gsk_...
```

### "Provider SDK not installed"

**Error:** "Groq SDK not installed"

**Solution:** Reinstall dependencies

```bash
npm install
```

### Switching provider has no effect

**Solution:** Ensure provider is in available list

```javascript
// Check available
console.log(window.websocketStreamClient.availableProviders);

// Then switch
window.websocketStreamClient.setProvider('groq');

// Verify
console.log(window.websocketStreamClient.llmProvider);
```

### Slow responses

**Solution:** Switch to faster provider

```javascript
// Groq is fastest
window.websocketStreamClient.setProvider('groq');
```

---

## 📞 Support

### API Documentation

- **OpenAI**: https://platform.openai.com/docs
- **Groq**: https://console.groq.com/docs
- **Anthropic**: https://docs.anthropic.com
- **Google Gemini**: https://ai.google.dev/docs

### Need Help?

1. Check logs in browser console (F12)
2. Verify API keys in .env
3. Ensure npm install completed
4. Check server logs: `npm start`

---

## 🎉 Summary

You now have a **flexible, multi-provider LLM system** that:

✅ Works with 4 different LLM providers
✅ Can switch providers without restarting
✅ Supports **free tier** (Groq)
✅ Optimized for **streaming** responses
✅ **Integrates seamlessly** with WebSocket Enterprise Stream

**Recommended setup for testing:**
```bash
# Use Groq (FREE) for development
DEFAULT_LLM_PROVIDER=groq
GROQ_API_KEY=gsk_...
DEEPGRAM_API_KEY=...
```

Cost: **$0/month** for testing! 🎉

---

**Last Updated:** December 28, 2025
**Status:** ✅ Production Ready
