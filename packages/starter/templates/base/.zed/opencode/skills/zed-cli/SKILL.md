---
name: zed-cli
description: "Drive Zed itself from the terminal with the `zed` CLI — preinstalled and pre-authenticated in every session sandbox. Use whenever a task means acting on THIS project's Zed control plane rather than just editing files: manage secrets, list/spawn/watch/talk-to sessions, open or inspect change requests to land work on main, fire or manage triggers, call connectors, connect Slack, or read project info. This is a discovery stub — the full, always-current reference is served live via `zed skills get zed-system` and its reference files."
---

# zed-cli

The **`zed`** CLI is the control plane for Zed — the same surface a human
drives in the dashboard, fully scriptable from a terminal. It is **already
installed and pre-authenticated** in every session sandbox: the binary is on
`$PATH` (`/usr/local/bin/zed`), a project-scoped token (`ZED_CLI_TOKEN`)
and `ZED_API_URL` are pre-injected, so `zed …` just works with no setup.

## Start here

This file is a **discovery stub, not the usage guide.** The full, always-current
Zed reference — every command, the manifest, change requests, the runtime — is
served **live by the CLI**, so it never goes stale between releases:

```bash
zed skills                    # list the Zed system skills served live
zed skills get zed-system  # THE reference + the paths of its 18 sub-docs
```

`get` prints the body and then **lists** the skill's reference files. Pull the
one you need instead of the whole tree — `zed-system` is ~230 KB in full:

```bash
zed skills file zed-system references/zed/zed-cli.md   # the FULL CLI reference
zed skills file zed-system references/zed/zed-yaml.md  # the manifest
zed skills get zed-system --full                             # everything, ~230 KB
```

Load `zed skills get zed-system` before doing anything non-trivial with
Zed — the CLI serves version-matched content, which this static stub can't.
The complete `zed` command reference is
`references/zed/zed-cli.md` inside `zed-system` — **not** `zed skills
get zed-cli`, which just returns this same stub.

## The moves you'll reach for

```bash
zed whoami                                   # which project + account this token has
zed secrets request <NAME>                   # mint a link for a human to enter a key (never handle raw keys)
zed sessions status                          # every agent on the project + what it's doing now
zed sessions new --json --wait --prompt "…"  # spawn a subagent, get a ready session id
zed connectors call <connector> <action> '…' # run a configured connector action (server-side)
zed apps deploy . --slug <slug>               # deploy and block until the stable URL is ready
zed cr open --title "…"                       # propose landing your branch on main (the user merges)
```

## Coordinating sessions (spawn → wait → collect)

```bash
zed sessions new --json --wait --with-file data.csv --prompt "…"   # files land in /workspace/incoming/ BEFORE the prompt
zed sessions wait-for <id> --timeout 300     # block until the agent finishes (0=done, 3=blocked on an ask, 124=timeout) — never sleep-poll
zed sessions pending <id>                    # see what a blocked agent is asking; answer with approve/answer
zed sessions cp <id>:out/result.pdf .        # pull deliverables; also local→session and session→session, -r for dirs
```

- A finished session's sandbox **stops automatically** to save compute.
  `stopped` means *parked*, not failed — `sessions cp`, `sessions chat`, and
  `sessions wait-for` wake it on demand.
- Session ids abbreviate: any unambiguous prefix (the 8-char ids `sessions ls`
  prints) works.
- Session sandboxes have Python via **uv** (`uv run` / `uvx` / `uv pip` —
  prefer these over bare `pip`), Node, browsers, and document tooling
  preinstalled — spawn the task, not an environment-setup plan.

Every read command takes `--json` (clean payload on stdout), so the CLI is a
100% scriptable surface. For anything beyond the above — flags, the token-scope
model, host switching, orchestration patterns — read
`zed skills file zed-system references/zed/zed-cli.md` (the full
command reference), or `zed skills get <name>` for another system skill.

## Landing work on `main`

A session runs on its own branch; the **only** sanctioned path to `main` is a
change request, and you open it — the user reviews and merges:

```bash
git add . && git commit -m "…" && git push origin HEAD
zed cr open --title "…" --description "…"     # head + session auto-detected in a sandbox
```

Never merge your own CR. Full CR lifecycle: `zed skills get zed-system`.
