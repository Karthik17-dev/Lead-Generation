/**
 * What the shim is allowed to relay, derived from what the guest already has.
 *
 * No new API plumbing was needed for this. Everything the shim needs is already
 * injected at provision:
 *
 *   ZED_SECRET_CAPABILITIES  the host -> identifier rules (values-free)
 *   ZED_PROJECT_ID           the project the broker route is scoped to
 *   ZED_API_URL              where the broker route lives
 *   ZED_CLI_TOKEN            the session credential that may spend a secret
 *
 * ## Why ZED_CLI_TOKEN and not ZED_TOKEN
 *
 * The sandbox holds TWO credentials and only one of them works here.
 *
 *  - `ZED_SANDBOX_TOKEN` / `ZED_TOKEN` (`zed_sb_…`) is the DAEMON's
 *    identity. It carries no user identity, and project-scoped routes reject it
 *    outright (platform/services/session-sandbox.ts).
 *  - `ZED_CLI_TOKEN` (`zed_pat_…`) is the SESSION credential: it acts as
 *    the launching user, scoped by the agent grant, and is what the in-sandbox
 *    `zed` CLI already uses to call this very route.
 *
 * The broker route requires `authType === 'pat'` plus a session id plus an agent
 * grant (projects/routes/secret-broker.ts). Only the CLI token satisfies that,
 * so reaching for the more obvious `ZED_TOKEN` yields a 403 on every request.
 *
 * ## Failing closed
 *
 * A missing token, project id, or API url yields NO rules, which means the shim
 * does not start at all. That is the safe direction: with no shim the agent's
 * request simply leaves without a credential and the upstream answers 401 — an
 * honest failure. The dangerous direction would be a shim that starts, accepts
 * the connection, and then cannot relay.
 */

/** One host set the shim will terminate and relay for. Never holds a value. */
export interface ShimBrokerRule {
  /** Exact hosts, lowercased. No wildcards, no suffix matching. */
  readonly hosts: readonly string[]
  /** Secret identifier, NOT a value. The guest is allowed to see this. */
  readonly identifier: string
}

export interface ShimConfig {
  readonly rules: readonly ShimBrokerRule[]
  readonly apiUrl: string
  readonly projectId: string
  readonly token: string
}

const IDENTIFIER_RE = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$/
const HOST_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/
const MAX_CATALOG_BYTES = 64 * 1024

/**
 * The `delivery: 'network'` entries of ZED_SECRET_CAPABILITIES, as shim
 * rules. Anything malformed is dropped rather than guessed at — a rule the shim
 * cannot trust is a host it should tunnel blind instead of terminate.
 *
 * Deliberately mirrors the validation in secret-capabilities.ts rather than
 * importing it: that module renders agent-facing prose and this one gates a TLS
 * MITM. Sharing a parser would let a loosening made for the prose quietly widen
 * what gets terminated.
 */
export function parseShimRules(raw: string | undefined): ShimBrokerRule[] {
  if (!raw || Buffer.byteLength(raw, 'utf8') > MAX_CATALOG_BYTES) return []
  let value: { version?: unknown; capabilities?: unknown }
  try {
    value = JSON.parse(raw) as { version?: unknown; capabilities?: unknown }
  } catch {
    return []
  }
  if (value.version !== 1 || !Array.isArray(value.capabilities)) return []

  const out: ShimBrokerRule[] = []
  const claimed = new Set<string>()
  for (const entry of value.capabilities) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue
    const item = entry as Record<string, unknown>
    if (item.delivery !== 'network') continue
    if (typeof item.identifier !== 'string' || !IDENTIFIER_RE.test(item.identifier)) continue
    if (!Array.isArray(item.hosts)) continue

    const hosts: string[] = []
    for (const host of item.hosts) {
      if (typeof host !== 'string') continue
      const lower = host.trim().toLowerCase()
      if (!HOST_RE.test(lower)) continue
      // First rule to claim a host wins. Two secrets on one host is already
      // rejected at save time as a destination conflict; if one ever reaches
      // the guest, terminating once and relaying to a single identifier beats
      // picking nondeterministically per connection.
      if (claimed.has(lower)) continue
      claimed.add(lower)
      hosts.push(lower)
    }
    if (hosts.length > 0) out.push({ hosts, identifier: item.identifier })
  }
  return out
}

/**
 * The full shim configuration, or null when this session should not run one.
 *
 * Null is the common case and is not an error: most sessions hold no
 * network-boundary secret, and starting a TLS-terminating proxy for them would
 * be pure risk with no benefit.
 */
export function resolveShimConfig(env: NodeJS.ProcessEnv): ShimConfig | null {
  const rules = parseShimRules(env.ZED_SECRET_CAPABILITIES)
  if (rules.length === 0) return null

  const apiUrl = env.ZED_API_URL?.trim()
  const projectId = env.ZED_PROJECT_ID?.trim()
  const token = env.ZED_CLI_TOKEN?.trim()
  if (!apiUrl || !projectId || !token) return null

  return { rules, apiUrl, projectId, token }
}

/**
 * Why a session that HAS boundary rules still gets no shim — for the log line.
 *
 * Returning the reason separately keeps `resolveShimConfig` a plain predicate
 * while still letting boot say which piece was missing. A silent "no shim" on a
 * session that clearly wanted one is the single hardest thing to debug here:
 * the secret saves, the agent sends its request, and the 401 looks like a bad
 * credential rather than a shim that never started.
 */
export function shimUnavailableReason(env: NodeJS.ProcessEnv): string | null {
  if (parseShimRules(env.ZED_SECRET_CAPABILITIES).length === 0) return null
  if (!env.ZED_API_URL?.trim()) return 'ZED_API_URL is not set'
  if (!env.ZED_PROJECT_ID?.trim()) return 'ZED_PROJECT_ID is not set'
  if (!env.ZED_CLI_TOKEN?.trim()) {
    return 'ZED_CLI_TOKEN is not set (the sandbox token cannot spend a secret)'
  }
  return null
}
