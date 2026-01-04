/**
 * Tool Verifier - Sistema de verificación de tools
 * Verifica que todas las tools estén correctamente registradas y funcionando
 */

import logger from './logger.js';

class ToolVerifier {
  constructor(toolHandler) {
    this.toolHandler = toolHandler;
  }

  /**
   * Verificar todas las tools registradas
   */
  verifyAllTools() {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b4f2170f-70ea-47f0-9d5c-aacf6fad5aad',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tool-verifier.js:16',message:'verifyAllTools entry',data:{hasToolHandler:!!this.toolHandler,hasTools:!!this.toolHandler?.tools,hasGetToolParameters:typeof this.toolHandler?.getToolParameters==='function',toolHandlerMethods:Object.getOwnPropertyNames(this.toolHandler||{}).filter(m=>typeof this.toolHandler[m]==='function')},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    const results = {
      total: 0,
      registered: 0,
      withHandlers: 0,
      withSchemas: 0,
      errors: []
    };

    if (!this.toolHandler || !this.toolHandler.tools) {
      logger.error('[TOOL VERIFIER] ❌ ToolHandler no disponible');
      return results;
    }

    const tools = Array.from(this.toolHandler.tools.keys());
    results.total = tools.length;

    logger.info(`[TOOL VERIFIER] 🔍 Verificando ${results.total} tools...`);

    tools.forEach(toolName => {
      const tool = this.toolHandler.tools.get(toolName);
      
      if (!tool) {
        results.errors.push(`Tool '${toolName}' no encontrada en Map`);
        return;
      }

      results.registered++;

      // Verificar handler
      if (tool.handler && typeof tool.handler === 'function') {
        results.withHandlers++;
      } else {
        results.errors.push(`Tool '${toolName}' no tiene handler válido`);
      }

      // Verificar schema
      try {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b4f2170f-70ea-47f0-9d5c-aacf6fad5aad',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tool-verifier.js:52',message:'Before getToolParameters call',data:{toolName,hasGetToolParameters:typeof this.toolHandler?.getToolParameters==='function',hasGetToolsSchema:typeof this.toolHandler?.getToolsSchema==='function',toolHandlerType:typeof this.toolHandler,toolHandlerMethods:Object.getOwnPropertyNames(this.toolHandler||{}).filter(m=>typeof this.toolHandler[m]==='function')},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        
        // Verificación defensiva: asegurar que el método existe
        if (!this.toolHandler || typeof this.toolHandler.getToolParameters !== 'function') {
          const availableMethods = this.toolHandler ? Object.getOwnPropertyNames(this.toolHandler).filter(m => typeof this.toolHandler[m] === 'function') : [];
          throw new Error(`getToolParameters no está disponible. Métodos disponibles: ${availableMethods.join(', ')}`);
        }
        
        const schema = this.toolHandler.getToolParameters(toolName);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b4f2170f-70ea-47f0-9d5c-aacf6fad5aad',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tool-verifier.js:60',message:'After getToolParameters call',data:{toolName,schemaExists:!!schema,hasProperties:!!(schema?.properties),propertiesCount:Object.keys(schema?.properties||{}).length},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        if (schema && schema.properties) {
          results.withSchemas++;
        } else {
          results.errors.push(`Tool '${toolName}' no tiene schema válido`);
        }
      } catch (error) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b4f2170f-70ea-47f0-9d5c-aacf6fad5aad',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tool-verifier.js:68',message:'Error in getToolParameters',data:{toolName,errorMessage:error.message,errorStack:error.stack?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        results.errors.push(`Error obteniendo schema de '${toolName}': ${error.message}`);
      }
    });

    // Log resultados
    if (results.errors.length === 0) {
      logger.info(`[TOOL VERIFIER] ✅ Todas las tools verificadas correctamente`);
      logger.info(`[TOOL VERIFIER] 📊 Resumen: ${results.total} tools, ${results.withHandlers} handlers, ${results.withSchemas} schemas`);
    } else {
      logger.warn(`[TOOL VERIFIER] ⚠️ ${results.errors.length} errores encontrados`);
      results.errors.forEach(error => logger.warn(`[TOOL VERIFIER] ⚠️ ${error}`));
    }

    return results;
  }

  /**
   * Verificar servicios disponibles
   */
  verifyServices() {
    const services = this.toolHandler?.services || {};
    const results = {
      total: 0,
      available: 0,
      missing: []
    };

    const requiredServices = [
      'neonService',
      'uiControlService',
      'bridgeDataService',
      'priceCalendarService',
      'twilioService'
    ];

    results.total = requiredServices.length;

    requiredServices.forEach(serviceName => {
      if (services[serviceName]) {
        results.available++;
        logger.info(`[TOOL VERIFIER] ✅ Servicio '${serviceName}' disponible`);
      } else {
        results.missing.push(serviceName);
        logger.warn(`[TOOL VERIFIER] ⚠️ Servicio '${serviceName}' no disponible`);
      }
    });

    return results;
  }

  /**
   * Verificación completa del sistema
   */
  verifyComplete() {
    logger.info('[TOOL VERIFIER] 🚀 Iniciando verificación completa del sistema...');

    const toolResults = this.verifyAllTools();
    const serviceResults = this.verifyServices();

    const summary = {
      tools: toolResults,
      services: serviceResults,
      status: 'ok',
      timestamp: new Date().toISOString()
    };

    // Determinar estado general
    if (toolResults.errors.length > 0 || serviceResults.missing.length > 0) {
      summary.status = 'warning';
    }

    if (toolResults.total === 0) {
      summary.status = 'error';
    }

    logger.info(`[TOOL VERIFIER] 📊 Verificación completa: ${summary.status.toUpperCase()}`);
    
    return summary;
  }
}

export default ToolVerifier;
