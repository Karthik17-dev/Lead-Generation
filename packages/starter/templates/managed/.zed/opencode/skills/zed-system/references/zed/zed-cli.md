# Zed CLI — full reference

The `zed` CLI is the canonical way to drive everything the Zed
dashboard can do — from a terminal, from a coding agent, from a session
sandbox. It is **always available** inside a Zed session sandbox:

- the binary is on `PATH` (`/usr/local/bin/zed`)
- `ZED_CLI_TOKEN` is pre-injected — a project-scoped token the CLI
  authenticates with automatically (not `ZED_SANDBOX_TOKEN` / its
  deprecated `ZED_TOKEN` alias; see "Inside a sandbox" below)
- `ZED_API_URL` points at the platform you're running against

So you can run `zed sessions ls` or `zed secrets set FOO=bar`
from any shell in the sandbox with no setup.

This document lives under the `zed-system` skill at
`.zed/opencode/skills/zed-system/references/zed/zed-cli.md`
— it travels with your repo and is loaded on-demand whenever an agent
needs CLI specifics.

## Quickstart inside a session

```sh
zed whoami                       # confirms what project + account this token has
zed projects info                # the project you're running inside
zed secrets ls                   # encrypted env vars + manifest [env] spec
zed sessions ls                  # every session on this project (incl. you)
zed cr ls                        # open change requests
zed cr open --title "..."        # propose merging your branch into main
```

The token in the sandbox is **project-scoped**: it can read + write
anything on *this* project (secrets, sessions, triggers, change
requests), but it cannot list other projects or touch
account-level resources. See "Token scope" below for the full
permission model.

## On your laptop

The local install flow is one curl + one click:

```sh
curl -fsSL https://zed.com/install | bash
zed login                        # opens browser, you click Authorize
```

The local CLI uses a **user-scoped** token saved at
`~/.config/zed/config.json` (mode 0600). That token can see every
project on every account you're a member of.

## Command surface

### Machine-readable output (`--json`) — driving Zed as an agent

Every **read/list** command accepts `--json`: it prints the raw API
payload to **stdout** (the human table is suppressed) and nothing else,
so an agent can parse it directly. All diagnostics — the `host …` banner,
update notices, errors — go to **stderr**, so `… --json 2>/dev/null | jq`
is always clean JSON. Mutations are flag-driven with no hidden prompts.

Net effect: the CLI is a **100% scriptable surface** — an agent can drive
Zed end-to-end from the terminal, the same surface a human drives in
the dashboard (list/select/interact with sessions, read messages, browse
files & diffs, open/merge change requests, manage secrets/triggers/
connectors, …).

```sh
zed sessions ls --json                       # what's running
zed sessions log <id> --json                 # what an agent is doing
zed cr ls --json                             # open change requests
zed files cat README.md --json | jq -r .content
```

### Auth

| Command | Effect |
| --- | --- |
| `zed login [--token <pat>] [--host <name>] [--api <url>]` | Default: opens browser → click Authorize → token written. `--token` is the headless fallback. `--host` logs into a named host slot (see Hosts). |
| `zed logout [--host <name>]` | Remove the token for the active host (or named one). |
| `zed whoami [--host <name>]` | Print the user + active account on the chosen host. |

### Hosts — pick which Zed you talk to

A host is one Zed API endpoint. You can configure several
(cloud, localhost, self-hosted) and switch between them. One is
"active" at any moment; commands operate on the active host by default.

| Command | Effect |
| --- | --- |
| `zed hosts ls` | List configured hosts (`●` marks active). |
| `zed hosts use [<name>]` | Switch active host. No name → arrow-key picker. |
| `zed hosts add <name> --url <url> [--login]` | Register a new host. `--login` runs the browser flow right after. |
| `zed hosts rm <name>` | Remove a host (confirms when it's the last one). |
| `zed hosts info [<name>]` | Detailed view of one host. |
| `zed hosts current` | Print the active host name (script-friendly). |

`--host <name>` on any command overrides the active host for a single
invocation: `zed projects ls --host local`.

### Projects

| Command | Effect |
| --- | --- |
| `zed projects ls` | Every project on the active account. |
| `zed projects info [<id-or-slug>]` | Show one project (defaults to the linked one — see below). |
| `zed projects link [<id>]` | Bind cwd to a remote project. Writes `.zed/link.json` with `project_id`, `account_id`, `host`, `host_url`. No arg → arrow-key picker. |
| `zed projects unlink` | Drop `.zed/link.json`. |
| `zed projects open [<id>]` | Open the dashboard URL for a project in your browser. |

#### How a command finds "the project"

In strict order:

1. `--project <id>` flag.
2. `ZED_PROJECT_ID` env var.
3. `.zed/link.json` in cwd (or any ancestor — git-style).
4. Inside a session sandbox: the sandbox's own `ZED_PROJECT_ID`.

If none resolve, the command errors with a pointer to `projects link`.

#### How a command finds "the host"

1. `--host <name>` flag.
2. `host` field in `.zed/link.json` (so a repo always hits its
   home Zed instance).
3. The globally-active host.

### Apps — serverless application deployments

Apps have stable URLs and immutable deployment versions. Each deployment runs
in one provider-neutral sandbox. Public traffic wakes an idle sandbox. Manual
stop blocks wake.

The selected project must enable **Apps** under Project Settings →
Experimental. The top-level CLI help and every `zed apps` command stay dark
when no selected project has the feature enabled.

| Command | Effect |
| --- | --- |
| `zed apps ls [--json]` | List the project's Apps, state, and stable URL. |
| `zed apps create <slug> [--name …]` | Create an App identity without deploying source. Resource flags: `--cpu`, `--memory`, `--disk`, `--idle-timeout`, `--budget`. |
| `zed apps deploy [path]` | Upload and deploy a directory or `.tar.gz`. Auto-detects static, bundle, or Dockerfile source. Waits for readiness by default. |
| `zed apps deploy --manifest-app <name>` | Use one v2 `zed.yaml` `apps.<name>` block. A sole App block is selected automatically for bare `deploy`. |
| `zed apps deploy --image <ref> --command <argv> --port <n>` | Deploy a public OCI image. `--command` accepts a JSON string array or shell-like string. |
| `zed apps show <id-or-slug> [--json]` | Show an App and immutable deployment history. |
| `zed apps logs <id-or-slug> [deployment-id]` | Read supervisor, Caddy, and user-process logs. Supports `--after` and `--limit`. |
| `zed apps start <id-or-slug>` | Permit traffic and start the active deployment now. |
| `zed apps stop <id-or-slug>` | Stop the active runtime and block cold wake. |
| `zed apps rollback <id-or-slug> <deployment-id>` | Start a ready target, move traffic atomically, then stop the previous runtime. |
| `zed apps delete <id-or-slug> --yes` | Delete the App and every runtime. |

Deploy options include `--type static|bundle|dockerfile`, `--root`, `--spa`,
`--output-dir`, `--install-command`, `--build-command`, `--dockerfile`,
`--command`, `--port`, `--readiness-path`, and `--provider`. Omit `--provider`
for platform policy. Use `--no-wait` only when another process will poll the
deployment.

Directory uploads read `.gitignore`, `.dockerignore`, and `.zedignore`.
They always exclude `.git`, `.zed`, `.env*`, and `node_modules`.
`--include-node-modules` only overrides the `node_modules` default.

See the `apps.md` reference for the complete manifest, runtime, secret, and
failure contract.

### Secrets

Encrypted project credentials. Delivery follows each secret's policy and the
session's agent grant. Only `sandbox` delivery exposes plaintext as an
environment variable.

| Command | Effect |
| --- | --- |
| `zed secrets ls` | List secret names + manifest `[env]` spec; marks required-but-missing. |
| `zed secrets set NAME=VALUE …` | Upsert one or more. `NAME=-` reads VALUE from stdin (so values never appear in shell history). |
| `zed secrets request NAME …` | **Mint a short-lived link for a human to ENTER the value(s)** — you never see/handle the raw key. Surface the URL (web: fill-in modal, Slack: tappable link). `--scope runtime\|connector` (default `runtime` = injected into the sandbox env), `--expires <minutes>` (default 30). Use this when you need a key you don't have. |
| `zed secrets unset NAME …` | Remove. |
| `zed secrets call IDENTIFIER URL [--method METHOD] [--header NAME:VALUE] [--data BODY\|--data-file PATH]` | Send one policy-bound HTTPS request. Zed injects the secret server-side. |

`$ZED_SECRET_CAPABILITIES` is the session's value-free machine-readable
catalog. It contains only granted capabilities. Use `zed secrets ls --json`
for the full stored policy. Brokered and service-delivered secrets are not
plaintext environment variables.

> **Asking a human for a secret.** You usually don't *have* the value, so don't
> use `set`. Run `zed secrets request APOLLO_API_KEY` (or the `request_secret`
> tool on the `zed-connectors` MCP), surface the returned URL, end your turn, and
> when they say "done" confirm with `zed secrets ls`. See the
> **credentials-and-setup-links** reference.

### Connectors — call external tools

A connector defines actions against an external system. A connection stores one
usable authorization. Calls run **server-side** through the connector gateway,
so no third-party credential enters the sandbox. The same gateway is available
through the `zed-connectors` **MCP**, this **CLI**, and the
`@zed/sdk` **TypeScript package**. JSON output.

| Command | Effect |
| --- | --- |
| `zed connectors ls [--session <id>]` | List project or session-visible connectors and actions. |
| `zed connectors discover "<intent>"` | Search actions by natural language (`--limit`). |
| `zed connectors show <connector>.<action>` | Show one action's input schema and risk. |
| `zed connectors call <connector> <action> '<json>'` | Invoke an action. The gateway resolves the connection, enforces policy, and audits. |
| `zed connectors add <slug> --provider pipedream --app <app> --apply` | Add a connector now, commit it to `zed.yaml` on main, and sync it. |
| `zed connectors rm <slug> --apply` | Remove a connector from `zed.yaml` on main and sync it. |
| `zed connectors connect <slug>` | Mint a Pipedream connection URL for the human. |
| `zed connectors mcp` | Run the `zed-connectors` stdio MCP server. |

> Inside a session, the `zed-connectors` MCP tools can expose the same
> list/discover/show/call loop. Use the CLI when those tools are absent.

### Env — dotenv ↔ secrets

| Command | Effect |
| --- | --- |
| `zed env pull [--out .env] [--force]` | Write a `.env` skeleton (names only — plaintext can't leave the cloud). |
| `zed env push --from <path>` | Upload every `NAME=VALUE` from a dotenv file as a secret. Supports quoted values, `export NAME=…`, comment lines. |

### Sessions

Each session is an isolated sandbox VM on its own ephemeral branch.

| Command | Effect |
| --- | --- |
| `zed sessions ls` | All sessions on the project. `--json` for machine-readable output. |
| `zed sessions status [--all] [--json]` | **Mission control** — every session + what each agent is doing *right now* (live: current tool / thinking / idle + last activity). Built for when many run in parallel. Aliases: `overview`, `ps`. |
| `zed sessions info <id>` | Detail view: status, branch, base ref, agent, sandbox URL, errors. `--json`. |
| `zed sessions log [<id>] [--limit N] [--json]` | **Read-only** peek at a session agent's recent messages — see what another agent is *doing right now* without sending it anything. Aliases: `messages`, `history`. No id → most-recent running (an interactive picker when several run on a TTY). |
| `zed sessions chat [<id>]` | Talk to a session's agent. `--prompt "<text>"` = one-shot (prints the reply and exits); add `--json` to get that reply as JSON (a synchronous subagent call); no flag = REPL. No id → picks/asks which running session. `--new` starts a fresh one. |
| `zed sessions new [--prompt "<text>"] [--wait] [--json]` | Start a new session. `--wait` blocks until it's running; `--json` prints the session object so you can capture `session_id` to orchestrate. `--with-file <local path>` (repeatable) uploads each file to `/workspace/incoming/<name>` **before** the prompt is delivered, and appends a manifest of the paths to the prompt. |
| `zed sessions wait-for <id> [--timeout <s>]` | Block until the session's agent finishes its current work — never poll with sleeps. Exit `0` = done, `3` = blocked on a permission/question ask (answer via `sessions pending`), `124` = still working at the timeout (default 300s). Alias: `wait`. |
| `zed sessions cp <src> <dst> [-r]` | Copy files between your machine/sandbox and a session's sandbox, or directly between two sessions' sandboxes. Refs are scp-style: `<session-id>:<path>` is remote, plain is local; paths resolve under `/workspace` unless absolute. Overwrites the exact destination path; `-r` for directories. Wakes stopped sandboxes on demand. |
| `zed sessions restart <id>` | Re-provision a session in place. |
| `zed sessions rm <id>` | Stop + delete. |
| `zed sessions open <id>` | Open the dashboard URL for a session. |

Session ids can be abbreviated: any unambiguous prefix works (the 8-char
ids `sessions ls` prints are fine).

**Stopped ≠ failed.** A spawned session's sandbox stops automatically a
couple of minutes after its agent finishes, to save compute. Its files
and conversation are intact — `sessions cp`, `sessions chat`, and
`sessions wait-for` wake it on demand. Treat `stopped` as *parked*.

**Inside a sandbox:** `ZED_SESSION_ID` tells you which session
you're running in. `zed sessions info $ZED_SESSION_ID` gives
you the live view of yourself.

**Watch + talk to other agents.** From any session (or your laptop) you
can see the whole project's activity and read it live — this is how an
agent checks up on every other agent that's running:

```sh
zed sessions status                      # all agents + what each is doing now
zed sessions status --json | jq .        # …parsed for a monitoring loop
zed sessions log <id> --limit 20         # read one agent's recent transcript
zed sessions chat <id> --prompt "…"      # talk to another agent
```

`log` is **read-only** — it never sends a message, so it's the safe way
to observe. To actually talk to another session, one-shot it:
`zed sessions chat <id> --prompt "status?"` (prints the reply and
exits), or drop into a REPL with `zed sessions chat <id>`.

**Orchestrate parallel subagents.** The whole fan-out loop is CLI-only —
spawn many sessions, watch the fleet, collect results, land work:

```sh
# spawn a subagent (optionally shipping input files) and get a ready session id
id=$(zed sessions new --json --wait \
       --with-file input.pdf \
       --prompt "Process /workspace/incoming/input.pdf; write results to /workspace/out/" \
     | jq -r .session_id)

zed sessions wait-for "$id" --timeout 300  # block until it finishes (exit 3 = it asked something)
zed sessions cp "$id":out/result.pdf .     # collect the deliverable
zed sessions log "$id" --json              # …or read progress without interrupting
zed sessions chat "$id" --prompt "status?" --json | jq -r .text   # synchronous call

zed cr ls --json                           # subagents land work as CRs → review/merge
zed sessions rm "$id"                       # tear the subagent down when fully done
```

`--json --wait` is the spawn primitive (one call → a running session id you
can immediately drive); `wait-for` replaces sleep-polling; `sessions cp`
moves files in/out (also session↔session); `sessions status` is the
at-a-glance fleet view; `chat … --prompt --json` is a synchronous call;
`log` is async observation. Session sandboxes have Python (via **uv** —
`uv run` / `uvx` / `uv pip`, prefer it over bare `pip`), Node, browsers,
and document tooling preinstalled.

### Triggers

Round-trip through `zed.yaml`'s `triggers:`. Dashboard sees
the same state.

| Command | Effect |
| --- | --- |
| `zed triggers ls` | List triggers + runtime state (`last_fired_at`). |
| `zed triggers info <slug>` | Show one trigger in full. |
| `zed triggers fire <slug>` | Manually fire a trigger now. |
| `zed triggers enable <slug>` | Set `enabled = true`. |
| `zed triggers disable <slug>` | Set `enabled = false`. |

### Channels (Slack)

The project's Slack wiring. **Connecting Slack is one command** — never a
manifest, bot token, or secret-intake link on Zed Cloud.

| Command | Effect |
| --- | --- |
| `zed channels connect` | **THE way to connect Slack.** Prints a one-click "Add to Slack" install link (Zed Cloud) — surface the URL; the human picks a workspace and clicks Allow. Add `--wait` to block until the install lands. Self-host without the shared Slack app: falls back to manual token mode and says so. `--json` for machine output. |
| `zed channels status` | Show the connected workspace (or "not connected"). `--json`. |
| `zed channels disconnect` | Drop the project's Slack connection. |
| `zed channels manifest` | Slack app manifest JSON — **manual/self-host setup only**. |

### Change requests (`cr`)

Zed-native PR layer for session work landing on `main`. A change
request proposes merging one branch (`head_ref`) into another
(`base_ref`) inside a project. The CR layer is **Zed-native** —
it works on top of any git host (GitHub, GitLab, plain
git) without a per-host adapter. A CR is the **only sanctioned
way** for an agent to land session-branch work on `main`; see
`change-requests.md` (alongside this file) for the full mandate and
lifecycle.

| Command | Effect |
| --- | --- |
| `zed cr ls [--status open\|merged\|closed\|all] [--project <id>]` | List CRs on the project. Default: `--status open`. |
| `zed cr show <cr> [--project <id>]` | Show one CR's metadata. Alias: `zed cr info`. Includes the merge-preview (clean / fast-forward / conflicts) for open CRs. |
| `zed cr diff <cr> [--no-color] [--project <id>]` | Unified diff of the CR. Three-dot diff for open / closed CRs; for merged CRs it uses the SHAs captured at merge time so the patch still renders even though `head_ref` is now reachable from `base_ref`. |
| `zed cr open --title "<text>" [--description "<text>"] [--head <ref>] [--base <ref>] [--session <id>] [--project <id>]` | Open a new CR. Aliases: `zed cr new`, `zed cr create`. Inside a sandbox, `--head` defaults to `$ZED_BRANCH_NAME` and `--session` defaults to `$ZED_SESSION_ID`, so `zed cr open --title "..."` Just Works. `--base` defaults to the project's default branch (usually `main`). `--title` is required. Alias for `--head`: `--from`. Alias for `--base`: `--into`. Alias for `--description`: `--body`. |
| `zed cr merge <cr> [--message "<text>"] [--project <id>]` | Merge an open CR into its `base_ref`. Fast-forward when possible, three-way merge otherwise. The default commit message is `Merge CR #<n>: <title>` (override with `-m / --message`). Fails with 409 if the CR is not `open` or there are conflicts. |
| `zed cr close <cr> [--project <id>]` | Close an open CR without merging. Cannot close a merged CR. |
| `zed cr reopen <cr> [--project <id>]` | Reopen a closed CR (only — merged CRs are terminal). |

`<cr>` accepts either the short per-project number (`3`, `#3`) or the
full UUID `cr_id`. Numbers are unique per project, monotonically
increasing.

#### Inside a sandbox — the typical agent flow

```sh
# 1. Commit on the session branch
git add .
git commit -m "Add release-notes skill"

# 2. Push the branch (ZED_BRANCH_NAME)
git push origin HEAD

# 3. Open the CR — head and session are auto-detected
zed cr open \
  --title  "Add release-notes skill" \
  --description "Drafts release notes from merged commits. Tested against the last 5 tags."

# 4. Confirm it's listed
zed cr ls

# 5. (Optional) show the diff one more time
zed cr diff 3
```

The agent **does not merge its own CR** — that's the user's call,
either in the dashboard or via `zed cr merge <n>`.

#### Conflicts

`zed cr show <cr>` prints a merge preview:

- `Mergeable cleanly` — no conflicts; `zed cr merge` will succeed.
- `Mergeable cleanly (fast-forward)` — `head_ref` is strictly ahead of
  `base_ref`; the merge will be a fast-forward.
- `Conflicts in N files:` — listed; resolve on the branch first, push,
  then re-show.

#### Output format

`zed cr ls` prints `#NUM`, status badge (`● open` / `✔ merged` /
`× closed`), `head_ref → base_ref` (truncated UUID-style branches),
title. Sorted newest first.

#### Exit codes

| Code | Meaning |
| --- | --- |
| `0`  | Success. |
| `1`  | Operation failed (CR not found, merge failed, etc.). |
| `2`  | Bad flag / missing required arg. |

> See `change-requests.md` (alongside this file) for the full
> data model, REST API, and the "MUST open a CR" agent mandate.

### Install / update / uninstall

| Command | Effect |
| --- | --- |
| `zed update` | Re-runs `curl -fsSL zed.com/install | bash` to pull the latest binary. |
| `zed uninstall` | Removes the binary, /usr/local/bin shim, and `~/.config/zed/`. `--keep-auth` keeps the token. |
| `zed version` | Print the CLI version. |

### Project scaffold

| Command | Effect |
| --- | --- |
| `zed init` | Scaffold one general-purpose v2 OpenCode REST project with the canonical skill source and default agent. |

```sh
zed init my-project --yes --no-git
```

### System skills

System skills are the live agent manual for the deployed Zed host.

| Command | Effect |
| --- | --- |
| `zed system-skills` | List system skill names and routing descriptions. |
| `zed system-skills get <name>` | Print the current `SKILL.md`. |
| `zed system-skills get <name> --full` | Print `SKILL.md` and every referenced file. |
| `zed system-skills path [name]` | Print the local project path. |

`zed skills` is a permanent alias. Optional project skills use
`zed marketplace`, not `system-skills`.

## Token scope

There are **two** token types issued by the Zed API. Both use the
`zed_pat_…` prefix; they're distinguished by an internal `project_id`
column on the token row.

| Type | Scope | Issued by | Typical use |
| --- | --- | --- | --- |
| **User token** | All projects on accounts the user belongs to + account-level routes (`/v1/accounts/me`, billing, etc.) | `zed login` browser flow → minted via `POST /v1/accounts/tokens` | The CLI on your laptop |
| **Project token** | Read + write everything on **one** project — secrets, sessions, triggers, and change requests. Cannot list other projects or hit account-level routes. | Auto-minted at session create; surfaced via `POST /v1/projects/:id/cli-token` | The CLI inside a sandbox |

Enforcement: every project route handler checks the token's
`project_id` against the URL's `:projectId` parameter. Mismatch → 403.
Account routes (`/v1/accounts/*`) reject any project-scoped token
outright.

### Inside a sandbox

The session bootstrap injects:

```
ZED_CLI_TOKEN=zed_pat_…       ← project-scoped PAT; what the CLI authenticates with
ZED_SANDBOX_TOKEN=zed_sb_…    ← sandbox service key (runtime/clone/LLM) — NOT for the CLI
ZED_TOKEN=zed_sb_…            ← deprecated alias for ZED_SANDBOX_TOKEN, same value
ZED_API_URL=https://<host>/v1
ZED_PROJECT_ID=<uuid>
ZED_SESSION_ID=<uuid>
ZED_BRANCH_NAME=<session-branch>
```

The CLI reads `ZED_CLI_TOKEN` automatically and uses `ZED_API_URL` as the
host base. No config file,
no `zed login` needed — `zed …` just works.

> **Don't authenticate with `ZED_SANDBOX_TOKEN`** (or its deprecated
> `ZED_TOKEN` alias). That's the sandbox *service key* (used for the LLM
> gateway, the tool router, and just-in-time git clone credentials). The
> project-scoped routes the CLI calls (`change-requests`, `secrets`, …)
> reject it with `401 Invalid or expired token` — it isn't expired, it's
> simply the wrong token. Use the CLI; it already holds the right one.

### Rotating

```sh
# From a logged-in user CLI:
zed projects info                    # confirm you're on the right project
zed project token rotate             # rotates the project token
# (existing sandboxes keep their token until they restart)
```

## Common workflows

### Spin up a fresh session with custom env

```sh
zed secrets set STRIPE_API_KEY=sk_live_… WEBHOOK_SLACK_SECRET=whsec_…
zed sessions new --prompt "Audit the auth module and propose a fix"
```

### Inside a session: trigger another session

```sh
# I'm an agent that just finished a big migration. Spawn a verifier:
zed sessions new --prompt "Verify migration 0048 by running pnpm test + opening a CR if anything fails"
```

### Run a trigger by hand for debugging

```sh
zed triggers ls                      # confirm the slug + status
zed triggers fire daily-digest       # one-shot manual fire
zed sessions ls | head -3            # the new session that the trigger spawned
```

### Pull current secrets into a local `.env` for development

```sh
zed env pull                         # names only, values left blank
$EDITOR .env                            # fill in values locally
# (don't push — local-only file)
```

### Bulk-upload local `.env` to the cloud project

```sh
zed env push --from .env
zed secrets ls                       # confirm
```

### Land session work on `main` (the CR flow)

The agent in the sandbox is responsible for opening the CR; the user
reviews + merges. **There is no other path to `main` from inside a
session.**

```sh
# inside a session sandbox, on branch session-<id>
git add .
git commit -m "Add release-notes skill"
git push origin HEAD

zed cr open \
  --title       "Add release-notes skill" \
  --description "Drafts release notes from merged commits. Tested against the last 5 tags."

zed cr ls                            # confirm
```

The user can then:

```sh
zed cr show 3                        # diff + merge-preview
zed cr diff 3
zed cr merge 3                       # merges into base (main)
# or
zed cr close 3                       # close without merging
```

See `change-requests.md` next to this file for the full lifecycle,
conflict story, and data model.

## Environment variables the CLI reads

| Variable | Purpose |
| --- | --- |
| `ZED_CLI_TOKEN` | Project-scoped PAT the CLI authenticates with (injected in sandboxes). |
| `ZED_SANDBOX_TOKEN` | Sandbox **service key** — runtime/clone/LLM auth. **Not** a CLI token; project routes reject it. |
| `ZED_TOKEN` | Deprecated alias for `ZED_SANDBOX_TOKEN`, same value. **Not** a CLI token. |
| `ZED_API_URL` | API base URL. In a sandbox it already includes the `/v1` mount. |
| `ZED_PROJECT_ID` | Override the linked project for one command. |
| `ZED_CONFIG_FILE` | Override `~/.config/zed/config.json` location (useful for tests). |
| `ZED_DASHBOARD_URL` | Override the dashboard URL the `login` flow opens (default: derived from API URL). |

The `ZED_*` env-var prefix is **reserved** for platform-injected
values. Don't declare your own project secrets with that prefix —
the secrets-manager API rejects them, and the manifest validator
warns.

## Exit codes

| Code | Meaning |
| --- | --- |
| `0` | Success. |
| `1` | Operation failed (API error, missing project, etc.). Diagnostics printed to stderr. |
| `2` | Bad flag, unknown subcommand, missing required arg. |

## What the CLI is not

- **Not a self-host installer.** That legacy lives at the old
  `~/.zed/zed` bash script; this binary is the cloud-native
  replacement. If you self-host, `zed login --api http://…` still
  works against your instance — just point it at your own URL.
- **Not a `git` replacement.** `zed cr` is the change-request
  surface; it composes with `git` rather than wrapping it.
- **Not the runtime.** OpenCode executes the agent inside the sandbox. The CLI
  is the control plane for sessions, secrets, triggers, system instructions,
  and change requests.

## See also

- `.zed/opencode/skills/zed-system/SKILL.md` — entry point for
  the zed-system skill. Mention the CLI from there.
- `change-requests.md` (alongside this file) — full CR data model,
  lifecycle, REST API, and the "MUST open a CR" agent mandate.
- `zed.yaml` — the manifest the dashboard + the CLI both read.
- `.zed/Dockerfile` — an optional custom sandbox image when `zed.yaml` declares it.
- `.zed/link.json` — current dir's binding to a remote project
  (project_id + host).
