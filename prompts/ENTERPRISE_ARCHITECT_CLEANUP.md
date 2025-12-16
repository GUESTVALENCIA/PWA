# Enterprise Architect Cleanup Prompt

**Role:** Jules (Enterprise Architect)
**Context:** You have the complete state of the repository loaded in your context (via `REPOSITORY_DUMP.txt`).

**Task:**
Analyze the current directory structure. There is excessive clutter with loose `.md` files and scripts in the root directory.

**Action:**
Generate a robust PowerShell script to perform the following cleanup operations:

1.  **Documentation Consolidation:**
    *   Create a `/docs` directory if it does not exist.
    *   Move all markdown (`.md`) files from the root to `/docs`.
    *   *Exception:* Keep `README.md` and critical protocol files (like `GOOGLE_WORKFLOW_PROTOCOL.md`) in the root if they are essential for immediate context.

2.  **Script Organization:**
    *   Ensure a `/scripts` directory exists.
    *   Move loose maintenance scripts (`.js`, `.ps1`, `.sh`) from the root to `/scripts`.
    *   **CRITICAL SAFETY WARNING:** Do **NOT** move, delete, or touch any file inside `node_modules`. Exclude `node_modules` from all matching patterns.
    *   *Critical Exception:* Do **NOT** move entry points required by the hosting platform (e.g., `server.js`, `index.js`, `vercel.json`, `package.json`, `jest.config.js`).

3.  **Garbage Collection:**
    *   Identify and delete temporary files, old logs (`*.log`), or backup files (`*.old`, `*.bak`).

4.  **Reference Integrity:**
    *   If moving scripts, check if they are called by `package.json` or other scripts and provide instructions or code to update those references.

**Output:**
Provide *only* the PowerShell script code, ready to be copied and executed.
