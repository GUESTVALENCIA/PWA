const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class McpService {

  async executeCommand(command) {
    console.log(` [MCP] Executing command: ${command}`);
    // Security warning: verify command injection in production!
    const { stdout, stderr } = await execPromise(command, { timeout: 10000 });
    return { success: true, output: stdout, stderr };
  }

  async readFile(filePath) {
    console.log(` [MCP] Reading file: ${filePath}`);
    const content = await fs.readFile(filePath, 'utf-8');
    return {
      success: true,
      content,
      path: filePath,
      size: content.length
    };
  }

  async writeFile(filePath, content) {
    console.log(` [MCP] Writing file: ${filePath}`);
    const dirPath = path.dirname(filePath);
    await fs.mkdir(dirPath, { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
    return {
      success: true,
      path: filePath,
      size: content.length
    };
  }

  async listFiles(dirPath = '.') {
    console.log(` [MCP] Listing directory: ${dirPath}`);
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    const files = items.map(item => ({
      name: item.name,
      type: item.isDirectory() ? 'directory' : 'file',
      path: path.join(dirPath, item.name)
    }));
    return {
      success: true,
      files,
      count: files.length,
      directory: dirPath
    };
  }

  async copyPath(source, destination) {
      console.log(` [MCP] Copying: ${source} -> ${destination}`);
      const destDir = path.dirname(destination);
      await fs.mkdir(destDir, { recursive: true });

      const stats = await fs.stat(source);
      if (stats.isDirectory()) {
        await this.copyDirRecursive(source, destination);
      } else {
        await fs.copyFile(source, destination);
      }
      return { success: true, source, destination };
  }

  async copyDirRecursive(source, destination) {
    await fs.mkdir(destination, { recursive: true });
    const items = await fs.readdir(source, { withFileTypes: true });

    for (const item of items) {
      const srcPath = path.join(source, item.name);
      const destPath = path.join(destination, item.name);

      if (item.isDirectory()) {
        await this.copyDirRecursive(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }
}

module.exports = new McpService();
