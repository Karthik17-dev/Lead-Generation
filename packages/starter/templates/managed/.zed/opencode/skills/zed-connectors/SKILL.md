---
name: zed-connectors
description: Use Zed connectors to reach external systems from a session. Use the `zed connectors` CLI for agent work, `@zed/sdk` for durable TypeScript workflows, and `zed connectors mcp` when a stdio MCP server is required. Load this skill to inspect, add, connect, or call external tools without exposing third-party credentials to the sandbox.
---

<skill name="zed-connectors">

<overview>
A **connector** defines tools against an external system. A **connection** stores
one usable authorization for a connector. A **connector call** invokes one tool.

Use the **`zed connectors` CLI** for normal agent work:

- `zed connectors ls` lists connectors and actions.
- `zed connectors discover "<intent>"` searches visible actions.
- `zed connectors show <connector>.<action>` shows one input schema and risk.
- `zed connectors call <connector> <action> '<json>'` invokes one action.
- `zed connectors add`, `rm`, and `connect` manage connectors and connections.
- `zed connectors mcp` runs the optional `zed-connectors` stdio MCP server.

Durable TypeScript workflows use **`@zed/sdk`** and `createZed`. Every
call runs through the connector gateway. The
gateway resolves credentials, enforces access and policy, invokes the upstream
system, and records an audit event. The sandbox carries `ZED_CLI_TOKEN`; it
does not carry raw third-party credentials.
</overview>

<when-to-load>
Load this skill when the user wants to:

- Act in an external app or API.
- Inspect available connectors, actions, or connected computers.
- Add or configure a connector or connection.
- Request connector credentials without exposing the value.
- Build a repeatable workflow that calls external systems.

Do not load it for work that stays inside the local repository or sandbox.
</when-to-load>

<cli-first-loop>
Use the CLI first. It is pre-authenticated in a session sandbox.

1. List visible connectors:

```sh
zed connectors ls
```

2. Search by intent:

```sh
zed connectors discover "send an email"
```

3. Inspect one action before an unfamiliar call:

```sh
zed connectors show email_email_inbox_bjgk.reply_message
```

4. Call the action:

```sh
zed connectors call email_email_inbox_bjgk reply_message \
  '{"inbox_id":"email-inbox@agentmail.to","message_id":"<message-id>","text":"Reply text"}'
```

For GraphQL actions, put selected fields in `args.__select`:

```sh
zed connectors call internal_graph query.user \
  '{"id":"1","__select":"id name email"}'
```
</cli-first-loop>

<sdk-workflows>
Use `@zed/sdk` for dependent calls, pagination, branching, retries, or
reusable scripts. Read `references/sdk.md` for the full pattern.

```ts
import { createZed } from '@zed/sdk';

const zed = createZed({
  backendUrl: process.env.ZED_API_URL!,
  getToken: async () => process.env.ZED_CLI_TOKEN ?? null,
});
const connectors = process.env.ZED_PROJECT_ID
  ? zed.project(process.env.ZED_PROJECT_ID).connectors
  : zed.connectors;

const matches = await connectors.search('send an email', { limit: 5 });
const action = await connectors.describe(matches[0]!.tool);
if (!action) throw new Error('Email action not found');

const result = await connectors.call('email_email_inbox_bjgk.reply_message', {
  inbox_id: 'email-inbox@agentmail.to',
  message_id: '<message-id>',
  text: 'Reply text',
});

if (!result.ok) {
  throw new Error(`Connector call failed: ${result.reason ?? result.status ?? 'unknown'}`);
}
```

Run repository scripts with `bun run path/to/script.ts`. Keep provider
credentials out of code and repository files.
</sdk-workflows>

<complete-api-access>
Use named actions when they fit. Pipedream connectors also expose `request` for
an endpoint that is absent from the named catalog.

```sh
zed connectors call github request '{
  "method": "POST",
  "url": "https://api.github.com/repos/karthikxa/AI-Management-System/issues/1234/comments",
  "body": { "body": "Review note" }
}'
```
</complete-api-access>

<adding-connectors>
Connector definitions live in `zed.yaml`. Connections remain server-side.

```yaml
connectors:
  - slug: stripe
    name: Stripe API
    provider: openapi
    spec: https://raw.githubusercontent.com/stripe/openapi/master/openapi/spec3.json
    auth:
      type: bearer
```

Supported providers are `pipedream`, `mcp`, `openapi`, `postman`, `graphql`, and
`http`. Add and connect a Pipedream connector with:

```sh
zed connectors add github --provider pipedream --app github --apply
zed connectors connect github
```

Surface the returned connection URL. Never ask the user to paste a credential
into chat. For an API key, use `zed secrets request NAME --scope connector`.

Slack uses the channel flow. Do not add a Slack connector. Run:

```sh
zed channels connect
```
</adding-connectors>

<rules>
- Use `zed connectors` for one-off agent actions.
- Use `@zed/sdk` for durable or testable workflows.
- Do not use raw provider tokens from the sandbox.
- Treat `denied`, `not_shared`, `needs_auth`, and `ok: false` as real outcomes.
- Confirm irreversible work before a destructive connector call.
- The `zed-connectors` MCP server is optional. Use the CLI if it is absent.
</rules>

</skill>
