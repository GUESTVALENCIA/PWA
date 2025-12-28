/**
 * SKILL UNIVERSAL MCP - Compatible con todos los editores
 * Se ejecuta ANTES de cualquier lectura/escritura de archivo
 */

export class ProjectOrchestratorSkill {
  constructor(mcpServerUrl = 'http://localhost:3000') {
    this.mcpServerUrl = mcpServerUrl;
    this.projectId = null;
    this.agentName = null;
  }

  /**
   * Detecta proyecto desde path del archivo
   */
  detectProjectFromPath(filePath) {
    const match = filePath.match(/([^\\\/]+)(?:[\\\/]src|[\\\/]index|[\\\/])/);
    return match ? match[1] : null;
  }

  /**
   * INTERCEPTOR: Antes de LEER
   */
  async beforeFileRead(filePath) {
    this.projectId = this.detectProjectFromPath(filePath);

    if (!this.projectId) {
      throw new Error('❌ No se detectó proyecto del path');
    }

    try {
      const response = await fetch(
        `${this.mcpServerUrl}/api/projects/${this.projectId}/read`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.getApiKey()}`,
            'X-Agent': this.agentName
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        allowed: data.permissions.read,
        message: `✅ Lectura permitida en ${this.projectId}`
      };
    } catch (error) {
      console.error('Error en beforeFileRead:', error);
      throw error;
    }
  }

  /**
   * INTERCEPTOR: Antes de ESCRIBIR
   * Bloquea escritura directa y redirige a propuesta
   */
  async beforeFileWrite(filePath, content) {
    this.projectId = this.detectProjectFromPath(filePath);

    // Intentar escribir bloqueará y redirigirá a propuesta
    try {
      const response = await fetch(
        `${this.mcpServerUrl}/api/projects/${this.projectId}/propose`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.getApiKey()}`,
            'Content-Type': 'application/json',
            'X-Agent': this.agentName
          },
          body: JSON.stringify({
            title: `Cambio en ${filePath}`,
            files: [{
              path: filePath,
              proposedContent: content
            }],
            reasoning: `Propuesta de ${this.agentName || 'unknown'}`
          })
        }
      );

      const proposal = await response.json();

      return {
        blocked: true,
        message: `📋 Propuesta #${proposal.id.substring(0, 8)} creada`,
        proposalId: proposal.id,
        action: 'REDIRECT_TO_PROPOSAL'
      };
    } catch (error) {
      console.error('Error creando propuesta:', error);
      throw error;
    }
  }

  /**
   * MCP Tool: Leer proyecto
   */
  async tool_project_read({ projectId, filePath }) {
    const response = await fetch(
      `${this.mcpServerUrl}/api/projects/${projectId}/read`,
      {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${this.getApiKey()}` }
      }
    );
    return response.json();
  }

  /**
   * MCP Tool: Crear propuesta
   */
  async tool_project_propose({ projectId, title, files, reasoning }) {
    const response = await fetch(
      `${this.mcpServerUrl}/api/projects/${projectId}/propose`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getApiKey()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, files, reasoning })
      }
    );
    return response.json();
  }

  /**
   * MCP Tool: Revisar propuesta
   */
  async tool_proposal_review({ proposalId, assessment, suggestions, score }) {
    const response = await fetch(
      `${this.mcpServerUrl}/api/proposals/${proposalId}/review`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getApiKey()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ assessment, suggestions, score })
      }
    );
    return response.json();
  }

  /**
   * MCP Tool: Unificar propuestas
   */
  async tool_plan_unify({ proposalIds, strategy }) {
    const response = await fetch(
      `${this.mcpServerUrl}/api/proposals/unify`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getApiKey()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ proposalIds, strategy })
      }
    );
    return response.json();
  }

  /**
   * MCP Tool: Implementar plan
   */
  async tool_plan_implement({ planId, agentId }) {
    const response = await fetch(
      `${this.mcpServerUrl}/api/plans/${planId}/implement`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getApiKey()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ agentId })
      }
    );
    return response.json();
  }

  getApiKey() {
    return process.env.API_KEY || this.agentName;
  }
}

export default ProjectOrchestratorSkill;
