#!/usr/bin/env node

/**
 * Service Protection Validation Script
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Purpose: Verify that protected services are properly configured
 * Usage: node validate-protection.js
 *
 * This script checks:
 * ✅ Port 4042 availability
 * ✅ Endpoint configurations
 * ✅ File integrity
 * ✅ Required environment variables
 * ✅ Service dependencies
 */

const fs = require('fs');
const path = require('path');
const net = require('net');
const crypto = require('crypto');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

const checks = {
  passed: 0,
  failed: 0,
  warnings: 0
};

// Helper functions
function log(level, message) {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const prefix = {
    '✅': `${colors.green}✅${colors.reset}`,
    '❌': `${colors.red}❌${colors.reset}`,
    '⚠️': `${colors.yellow}⚠️${colors.reset}`,
    'ℹ️': `${colors.cyan}ℹ️${colors.reset}`
  };

  console.log(`[${timestamp}] ${prefix[level]} ${message}`);
}

function printSection(title) {
  console.log(`\n${colors.blue}${'='.repeat(80)}${colors.reset}`);
  console.log(`${colors.blue}${title}${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(80)}${colors.reset}\n`);
}

function checkResult(condition, passMsg, failMsg) {
  if (condition) {
    log('✅', passMsg);
    checks.passed++;
  } else {
    log('❌', failMsg);
    checks.failed++;
  }
}

function checkWarning(condition, msg) {
  if (!condition) {
    log('⚠️', msg);
    checks.warnings++;
  }
}

// Validation functions
function validateFiles() {
  printSection('📁 FILE INTEGRITY CHECK');

  const requiredFiles = [
    'mcp-server/index.js',
    'assets/js/websocket-stream-client.js',
    'assets/js/sandra-gateway.js',
    'mcp-server/routes/sandra.js',
    'mcp-server/routes/conserje.js',
    'mcp-server/services/deepgram-streaming.js',
    'mcp-server/services/tts-streaming.js',
    'mcp-server/services/llm-streaming.js'
  ];

  requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    const exists = fs.existsSync(filePath);
    checkResult(exists, `Found: ${file}`, `Missing: ${file}`);
  });
}

function validateConfiguration() {
  printSection('⚙️  CONFIGURATION CHECK');

  // Check mcp-server/index.js
  const indexPath = path.join(__dirname, 'index.js');
  if (fs.existsSync(indexPath)) {
    const content = fs.readFileSync(indexPath, 'utf8');

    checkResult(
      content.includes('PROTECTED_SERVICES'),
      'Protection layer defined',
      'Protection layer NOT found'
    );

    checkResult(
      content.includes('generateConfigHash'),
      'Config hash function present',
      'Config hash function NOT found'
    );

    checkResult(
      content.includes('logProtectionWarnings'),
      'Protection warnings function present',
      'Protection warnings function NOT found'
    );

    checkResult(
      content.includes("'wss://pwa-imbf.onrender.com'"),
      'Render production URL configured',
      'Render URL NOT configured'
    );

    checkResult(
      content.includes('localhost:4042'),
      'Local development port configured',
      'Local port NOT configured correctly'
    );
  }

  // Check sandra-gateway.js
  const gatewayPath = path.join(__dirname, '..', 'assets/js/sandra-gateway.js');
  if (fs.existsSync(gatewayPath)) {
    const content = fs.readFileSync(gatewayPath, 'utf8');

    checkResult(
      content.includes('localhost:4042'),
      'Sandra gateway uses port 4042',
      'Sandra gateway using WRONG port'
    );

    checkWarning(
      !content.includes('localhost:4040'),
      'Old port 4040 still found (deprecated)'
    );
  }
}

function validatePortAllocation() {
  printSection('🔌 PORT ALLOCATION CHECK');

  // Check if port 4042 is in environment or config
  const indexPath = path.join(__dirname, 'index.js');
  if (fs.existsSync(indexPath)) {
    const content = fs.readFileSync(indexPath, 'utf8');

    checkResult(
      content.includes('PORT || 4042') || content.includes('4042'),
      'Port 4042 allocated correctly',
      'Port 4042 NOT properly allocated'
    );
  }

  // Test port availability
  const server = net.createServer();
  server.once('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      log('ℹ️', 'Port 4042 is in use (server running)');
    }
  });

  server.once('listening', () => {
    log('ℹ️', 'Port 4042 is available');
    server.close();
  });

  server.listen(4042, '127.0.0.1');
}

function validateEnvironment() {
  printSection('🌍 ENVIRONMENT VARIABLES CHECK');

  const requiredEnvVars = [
    'NODE_ENV',
    'PORT'
  ];

  const optionalEnvVars = [
    'MCP_SERVER_URL',
    'MCP_TOKEN',
    'DEEPGRAM_API_KEY',
    'CARTESIA_API_KEY'
  ];

  requiredEnvVars.forEach(envVar => {
    const value = process.env[envVar];
    checkWarning(
      value !== undefined,
      `${envVar} not set (will use defaults)`
    );
  });

  optionalEnvVars.forEach(envVar => {
    const value = process.env[envVar];
    if (value) {
      log('ℹ️', `${envVar} is configured`);
    } else {
      log('⚠️', `${envVar} not set (optional)`);
      checks.warnings++;
    }
  });
}

function validateProtectionMetadata() {
  printSection('🔐 PROTECTION METADATA CHECK');

  // Check for PROTECTED_SERVICES.md
  const protectedMdPath = path.join(__dirname, 'PROTECTED_SERVICES.md');
  checkResult(
    fs.existsSync(protectedMdPath),
    'PROTECTED_SERVICES.md found',
    'PROTECTED_SERVICES.md NOT found'
  );

  // Check for SERVICE_PROTECTION_CONFIG.json
  const protectionConfigPath = path.join(__dirname, 'SERVICE_PROTECTION_CONFIG.json');
  checkResult(
    fs.existsSync(protectionConfigPath),
    'SERVICE_PROTECTION_CONFIG.json found',
    'SERVICE_PROTECTION_CONFIG.json NOT found'
  );

  if (fs.existsSync(protectionConfigPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(protectionConfigPath, 'utf8'));
      checkResult(
        config.protection_level === 'MAXIMUM',
        'Protection level: MAXIMUM',
        'Protection level NOT set to MAXIMUM'
      );
    } catch (e) {
      log('❌', 'SERVICE_PROTECTION_CONFIG.json is malformed');
      checks.failed++;
    }
  }

  // Check for warning file
  const warningPath = path.join(__dirname, '⚠️_CRITICAL_NO_TOQUES_ESTO.txt');
  checkResult(
    fs.existsSync(warningPath),
    'Warning file found',
    'Warning file NOT found'
  );
}

function validateServiceEndpoints() {
  printSection('🔗 SERVICE ENDPOINTS CHECK');

  const indexPath = path.join(__dirname, 'index.js');
  if (fs.existsSync(indexPath)) {
    const content = fs.readFileSync(indexPath, 'utf8');

    checkResult(
      content.includes("app.get('/api/config'"),
      '/api/config endpoint defined',
      '/api/config endpoint NOT found'
    );

    checkResult(
      content.includes("wss.on('connection'"),
      'WebSocket handler defined',
      'WebSocket handler NOT found'
    );
  }

  const sandraPath = path.join(__dirname, 'routes/sandra.js');
  if (fs.existsSync(sandraPath)) {
    const content = fs.readFileSync(sandraPath, 'utf8');
    checkWarning(
      content.includes("'/chat'") || content.includes('/chat'),
      'Chat endpoint check (inspect file manually)'
    );
  }

  const conserjiePath = path.join(__dirname, 'routes/conserje.js');
  if (fs.existsSync(conserjiePath)) {
    const content = fs.readFileSync(conserjiePath, 'utf8');
    checkWarning(
      content.includes("'/message'") || content.includes('/message'),
      'Conserje message endpoint check (inspect file manually)'
    );
  }
}

function printSummary() {
  printSection('📊 VALIDATION SUMMARY');

  console.log(`${colors.green}✅ Passed: ${checks.passed}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${checks.failed}${colors.reset}`);
  console.log(`${colors.yellow}⚠️  Warnings: ${checks.warnings}${colors.reset}`);

  const total = checks.passed + checks.failed;
  const percentage = total > 0 ? Math.round((checks.passed / total) * 100) : 0;

  console.log(`\nOverall Score: ${colors.cyan}${percentage}%${colors.reset}`);

  if (checks.failed === 0) {
    console.log(`\n${colors.green}✅ PROTECTION SYSTEM IS HEALTHY${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`\n${colors.red}❌ PROTECTION SYSTEM HAS ISSUES - FIX BEFORE PRODUCTION${colors.reset}`);
    process.exit(1);
  }
}

// Main execution
function main() {
  console.log(`\n${colors.magenta}${'='.repeat(80)}${colors.reset}`);
  console.log(`${colors.magenta}SERVICE PROTECTION VALIDATION${colors.reset}`);
  console.log(`${colors.magenta}${'='.repeat(80)}${colors.reset}`);
  console.log(`Started: ${new Date().toISOString()}\n`);

  validateFiles();
  validateConfiguration();
  validatePortAllocation();
  validateEnvironment();
  validateProtectionMetadata();
  validateServiceEndpoints();
  printSummary();
}

main();
