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
    *   *Exception:* Keep `README.md` and critical protocol files (like `GOOGLE_WORKFLOW_PROTOCOL.md`) in the root if they are essential for immediate context, or move them and create a symlink/reference.

2.  **Script Organization:**
    *   Ensure a `/scripts` directory exists.
    *   Move loose maintenance scripts (`.js`, `.ps1`, `.sh`) from the root to `/scripts`.
    *   *Critical Exception:* Do **NOT** move entry points required by the hosting platform (e.g., `server.js`, `index.js`, `vercel.json`, `package.json`, `jest.config.js`).
    *   *Specifics:* Scripts like `GENERATE_DUMP.ps1` or `JULES_EXECUTIVE_SYNC.ps1` should probably remain in root for ease of access, OR be moved to `scripts/` with a root shortcut/alias. (Decision: Move to `scripts/` and instruct user to run `scripts/SCRIPT_NAME.ps1` or keep "Executive" scripts in root. *Preference: Keep Executive scripts in root, move helpers to /scripts*).

3.  **Garbage Collection:**
    *   Identify and delete temporary files, old logs (`*.log`), or backup files (`*.old`, `*.bak`).

4.  **Reference Integrity:**
    *   If moving scripts, check if they are called by `package.json` or other scripts and provide instructions or code to update those references.

**Output:**
Provide *only* the PowerShell script code, ready to be copied and executed.
