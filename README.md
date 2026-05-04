# widemcp

Monorepo for **WideMCP** — production-oriented, **local-first** [Model Context Protocol (MCP)](https://modelcontextprotocol.io) servers. This repo currently ships **`@widemcp/av-server`** (audio/video helpers) and **`@widemcp/shared`** (shared utilities).

## Where to learn more (updates & web)

- **Website:** [widemcp.dev](https://widemcp.dev/) — public project home and updates. Content may **temporarily lag** this repository while releases catch up.
- **Source code (this repo):** [github.com/WideMCP/widemcp](https://github.com/WideMCP/widemcp)
- **Landing / marketing site (GitHub Pages):** [github.com/WideMCP/widemcp.github.io](https://github.com/WideMCP/widemcp.github.io) — the **widemcp.dev** front page is built from that repo; **DNS** (e.g. **Porkbun**) points the domain at **GitHub Pages**. To change **homepage or marketing copy**, edit **`widemcp.github.io`**, not this monorepo.

## Prerequisites

- **Node.js 20+** and **npm** — [nodejs.org](https://nodejs.org) or [nvm](https://github.com/nvm-sh/nvm)
- **Optional:** [`yt-dlp`](https://github.com/yt-dlp/yt-dlp) on your `PATH` for `get_media_info` and related tests. In **CI** (`CI=true`), the heavy YouTube `--dump-json` integration test is **skipped** unless you set `RUN_YTDLP_NETWORK_TEST=true`; a **`yt-dlp --version`** check still runs when `yt-dlp` is installed.

## Clone and install

```bash
git clone https://github.com/WideMCP/widemcp.git
cd widemcp
npm ci
```

This repository is **`WideMCP/widemcp`** (MCP server code). Do **not** clone [`WideMCP/widemcp.github.io`](https://github.com/WideMCP/widemcp.github.io) for that — that repo is only the **GitHub Pages** source for [widemcp.dev](https://widemcp.dev/).

Use `npm install` only if you intentionally skip the lockfile (not recommended for reproducible builds).

## Verify the repo

```bash
npm run ci
```

This runs **ESLint** → **TypeScript build** (`@widemcp/shared` then `@widemcp/av-server`) → **Vitest** in all workspaces → **`npm audit --audit-level=high`**. Exit code **0** means the same gate you get in GitHub Actions for PRs.

## Layout

| Path | Purpose |
|------|---------|
| `packages/shared` | `runCommand`, `ensureDependency`, etc. |
| `packages/av-server` | MCP server **`widemcp-av`** (`echo`, `get_media_info`, …) |
| `docs/` | e.g. [`docs/dev-quality.md`](docs/dev-quality.md) — CI, Semgrep, Git MCP |
| `.github/workflows/` | GitHub Actions (see `ci.yml`) |

## Build

From the repo root:

```bash
npm run build
```

This runs **`@widemcp/shared`** first, then **`@widemcp/av-server`** (required because `av-server` depends on shared types from `dist/`). Equivalent:

```bash
npm run build -w @widemcp/shared && npm run build -w @widemcp/av-server
```

Confirm `packages/shared/dist/` and `packages/av-server/dist/` exist.

## Run the AV MCP server (stdio)

After a successful build, the entrypoint is compiled JavaScript:

```bash
node /ABSOLUTE/PATH/TO/widemcp/packages/av-server/dist/index.js
```

Replace the path with your clone location. The server logs **“WideMCP AV Server running…”** on **stderr**; **stdout** is reserved for the MCP protocol — do not pipe casual output into it.

## Connect an MCP client

This server speaks **MCP over stdio**. **Clone, install, build, and the `node …/dist/index.js` command are the same for every client**; only **where you register** the `command` and `args` changes.

Use **absolute paths**. If you use **nvm**, resolve the real **`node`** binary (e.g. `$(which node)` in a shell, then paste the full path) — GUI apps often do not load nvm shims.

### Example A — Claude Desktop

**macOS:** edit `~/Library/Application Support/Claude/claude_desktop_config.json` (other OS: see Anthropic’s Claude Desktop docs). Merge a server under `mcpServers`:

```json
{
  "mcpServers": {
    "widemcp-av": {
      "command": "/ABSOLUTE/PATH/TO/node",
      "args": ["/ABSOLUTE/PATH/TO/widemcp/packages/av-server/dist/index.js"]
    }
  }
}
```

**Quit Claude completely** and reopen so MCP config reloads. You should see tools such as **`echo`** and **`get_media_info`** (server name in code is `widemcp-av`).

### Example B — Cursor

Install [Cursor](https://cursor.com). Add the **same** stdio server via **Settings → MCP**, or edit **`mcp.json`**:

- **Project:** `.cursor/mcp.json` inside this repo  
- **Global:** `~/.cursor/mcp.json`

Example:

```json
{
  "mcpServers": {
    "widemcp-av": {
      "command": "/ABSOLUTE/PATH/TO/node",
      "args": ["/ABSOLUTE/PATH/TO/widemcp/packages/av-server/dist/index.js"]
    }
  }
}
```

See [Cursor MCP (stdio)](https://cursor.com/docs/context/mcp). Reload MCP or restart Cursor; use **View → Output → MCP Logs** if the server fails to start.

### Other hosts (OpenAI, OSS agents, IDEs, …)

If you use **neither** Claude Desktop nor Cursor, open **your product’s MCP (or tools / integrations / plugins) settings** — or the **config file** that product uses for MCP — and **add a stdio server** with the same **`command`** (path to `node`) and **`args`** (path to `packages/av-server/dist/index.js`) as above. **Save**, then **restart** the app or reload MCP. Follow **that vendor’s documentation** for the exact UI or file path.

Any **MCP-capable client** works (including vendor apps that expose MCP, other IDEs such as Windsurf, and open-source stacks like Continue or LibreChat **when** they let you register an MCP server). **Out of scope here:** using only a raw **HTTP LLM API** with no MCP host — you need an application that acts as an **MCP client** to attach this server.

## CI and quality

Pull requests run [**`.github/workflows/ci.yml`**](.github/workflows/ci.yml): install, lint, build, install `yt-dlp` for tests, test, audit, plus a **Semgrep** job on `packages/`.

More detail (local workflow, Git MCP, optional scans): [**`docs/dev-quality.md`**](docs/dev-quality.md).

## Contributing

We welcome pull requests from **forks**. Expect **maintainer review** and **green CI** before anything lands on **`main`**.

1. **Fork** [WideMCP/widemcp](https://github.com/WideMCP/widemcp) and clone your fork (or add a remote).
2. Create a branch from an **up-to-date** `main` (this repo often uses `ncpk-<short-task-name>` for task branches).
3. Run **`npm run ci`** locally before you push.
4. Open a **pull request** into `main`. Address review feedback; keep PRs focused and small when possible.
5. **Merges:** a **maintainer** will review and merge when things look good. Fork contributors **cannot** merge into this repo unless they are explicitly given that access on GitHub.

Do not commit secrets (tokens, `.env`, machine-specific absolute paths meant only for your laptop). Use issue/PR templates later if you add them.

## Quick success checklist

For **opening pull requests**, use a **fork** and clone that URL instead—see **Contributing** above.

1. Install **Node 20+** and **npm**.
2. `git clone https://github.com/WideMCP/widemcp.git` && `cd widemcp` (read-only exploration of upstream)
3. `npm ci`
4. `npm run ci` → exit code **0**
5. (Optional) Install **`yt-dlp`** for full local AV behavior.
6. `npm run build` → `packages/*/dist` present.
7. `node …/packages/av-server/dist/index.js` smoke run (Ctrl+C to stop).
8. Register the server in **Claude Desktop**, **Cursor**, or **another MCP client**; confirm **`echo`** / **`get_media_info`** in the tool list.

## License

Apache-2.0 — see root [`package.json`](package.json) and each package’s `package.json` (`license` field). Add a root `LICENSE` file in the repo if the org publishes one; this README does not replace legal text.
