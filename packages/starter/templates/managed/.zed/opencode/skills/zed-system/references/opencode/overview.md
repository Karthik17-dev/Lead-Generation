# OpenCode reference — overview

OpenCode is the Zed session runtime. Version 2 uses OpenCode REST. This
directory is the complete OpenCode reference.

The same `.zed/opencode/` config directory drives both surfaces:

- **Remote** — when a Zed session boots, the platform points OpenCode
  at this dir via `OPENCODE_CONFIG_DIR=.zed/opencode` and launches
  the agent inside the sandbox VM.
- **Local** — when you (or anyone) runs `opencode` in this repo on
  their machine, the same config dir drives that session too.

OpenCode-specific files can therefore serve both local and remote OpenCode.

This folder mirrors the upstream OpenCode docs as standalone Markdown
files so an agent can read them without a network fetch. Pages are
canonical when they match upstream; if something here drifts, the
linked upstream page wins.

## Pages

| Topic                       | File             | Upstream                                                                          |
| --------------------------- | ---------------- | --------------------------------------------------------------------------------- |
| Agents                      | `agents.md`      | <https://opencode.ai/docs/agents/>                                                |
| Skills                      | `skills.md`      | <https://opencode.ai/docs/skills/>                                                |
| Commands                    | `commands.md`    | <https://opencode.ai/docs/commands/>                                              |
| Tools (built-in + custom)   | `tools.md`       | <https://opencode.ai/docs/tools/> + <https://opencode.ai/docs/custom-tools/>      |
| Plugins                     | `plugins.md`     | <https://opencode.ai/docs/plugins/>                                               |
| MCP servers                 | `mcp-servers.md` | <https://opencode.ai/docs/mcp-servers/>                                           |
| Permissions                 | `permissions.md` | <https://opencode.ai/docs/permissions/>                                           |
| Rules (`AGENTS.md`)         | `rules.md`       | <https://opencode.ai/docs/rules/>                                                 |
| Models                      | `models.md`      | <https://opencode.ai/docs/models/>                                                |

## Where OpenCode looks for things in a Zed project

OpenCode discovers its config from `OPENCODE_CONFIG_DIR`, which the
Zed runtime sets to `.zed/opencode/`. So everything below is
rooted there.

| Surface       | Path inside the Zed project                                                              |
| ------------- | ------------------------------------------------------------------------------------------- |
| Config root   | `.zed/opencode/opencode.jsonc`                                                           |
| Agents        | `.zed/opencode/agents/<name>.md`                                                         |
| Skills        | `.zed/opencode/skills/<name>/SKILL.md`                                                   |
| Commands      | `.zed/opencode/commands/<name>.md`                                                       |
| Custom tools  | `.zed/opencode/tools/<file>.ts`                                                          |
| Plugins       | `.zed/opencode/plugins/<file>.ts` (+ `.zed/opencode/package.json` for npm deps)       |
| MCP servers   | `.zed/opencode/opencode.jsonc` → `mcp` key                                               |

## The contract with Zed

OpenCode owns the behavior under `.zed/opencode/`. Zed can inspect agent
metadata and overlays current managed system skills, but it does not reinterpret
OpenCode prompts, permissions, tools, providers, or plugins.

Conversely, Zed-specific config (triggers, secrets schema, sandbox
image, project metadata) lives in `zed.yaml` at
the repo root. OpenCode never reads `zed.yaml`.

Both halves are versioned in the same repo, but the boundary is
strict — see `../zed/zed-yaml.md` for the Zed half.
