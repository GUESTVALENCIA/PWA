const config = require('../config/config');

const verifyMCPSecret = (req, res, next) => {
  const mcpSecret = req.headers['mcp-secret'];
  if (mcpSecret !== config.mcpSecretKey) {
    return res.status(401).json({ error: 'Invalid MCP secret' });
  }
  next();
};

module.exports = verifyMCPSecret;
