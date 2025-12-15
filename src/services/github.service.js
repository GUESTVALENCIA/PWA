const { handleRequest } = require('../utils/apiClient');

class GitHubService {
  async fetchFile(owner, repo, path, branch = 'main') {
    const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
    // Using fetch directly as we want text response
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`GitHub Error: ${response.status} - ${url}`);
    }
    return await response.text();
  }
}

module.exports = new GitHubService();
