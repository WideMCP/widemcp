# Development quality: model + CI + linters + scanners + Git MCP

This doc ties together the **repeatable** checks (CI, ESLint, tests, Semgrep, audit) with **agent** workflows (Cursor / Claude + optional Git MCP).

---

## 1. What runs where

| Layer | Role | Command / location |
|--------|------|---------------------|
| **You + model** | Reasoning, design, refactors, integration | Cursor / Claude chats |
| **ESLint** | Style + common TS foot-guns | `npm run lint` |
| **TypeScript** | Types | `npm run build` (`tsc`) |
| **Vitest** | Unit / integration tests | `npm run test` |
| **npm audit** | Known vulnerable dependency patterns | `npm audit --audit-level=high` |
| **Semgrep** | Extra static rules (CI + optional local) | CI job; see §5 |
| **GitHub Actions** | Same checks on every push / PR | `.github/workflows/ci.yml` |

Run everything locally before a PR:

```bash
npm ci          # or npm install
npm run ci
```

---

## 2. Day-to-day local loop

```bash
cd /path/to/widemcp
npm install
npm run lint
npm run build
npm run test
```

Fix lint warnings (`npm run lint:fix` when you add that script, or edit by hand). Keep `main()` green before pushing.

---

## 3. Git MCP (PR and diff context inside the agent)

Git MCP does **not** replace review; it gives the model **structured access** to PRs, files, and comments so answers match the real diff.

**GitHub MCP:** use a maintained server from the [MCP servers catalog](https://github.com/modelcontextprotocol/servers) or, for example, [anthropics/github-mcp-server](https://github.com/anthropics/github-mcp-server) (install, scopes, and `GITHUB_TOKEN` / PAT per that repo’s README — prefer least privilege).

**Claude Desktop** — add to `~/Library/Application Support/Claude/claude_desktop_config.json` under `mcpServers` (exact keys depend on the server you choose; follow the server’s README for `command` / `args` / env vars such as `GITHUB_PERSONAL_ACCESS_TOKEN`).

**Cursor** — Settings → MCP → add server using the same style of command + env as in the GitHub MCP docs.

Use it when you want the agent to: summarize a PR, list review comments, or reason over the latest diff without pasting everything by hand.

---

## 4. npm audit noise

CI runs `npm audit --audit-level=high`. If a **high** finding is a false positive or only fixable by a major bump, track it in an issue and temporarily document the exception; prefer `npm audit fix` when safe.

---

## 5. Semgrep locally (optional)

CI runs Semgrep with **`p/typescript`** on `packages/`. To match locally (Docker):

```bash
docker run --rm -v "$PWD:/src" -w /src semgrep/semgrep semgrep scan --config p/typescript packages/
```

Tuning: add a `.semgrepignore` at the repo root if needed (e.g. ignore generated paths).

---

## 6. How this maps to “model + tools”

- **Model:** architecture, security *reasoning*, test design, readability.
- **ESLint + tsc + Vitest:** deterministic baseline on every change.
- **Semgrep + audit:** extra rule / dependency signal; not exhaustive.
- **Git MCP:** better **context** for PR-sized work, not a second brain.

For important merges, still do a **human** pass on risk and product fit.
