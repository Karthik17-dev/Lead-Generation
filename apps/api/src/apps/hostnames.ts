/**
 * Where an App is reachable. One resolver, used by BOTH the URL Zed hands
 * out (appPublicUrl) and the host matcher that accepts inbound App traffic
 * (resolveAppHost). They used to carry separate copies of the same
 * `ZED_APPS_BASE_DOMAIN || 'apps.zed.com'` fallback with different
 * normalization, which is how a self-hosted deployment ended up publishing
 * `https://prod-<slug>-<key>.apps.zed.com` — a hostname on Zed's domain,
 * pointing at Zed's Cloudflare Worker, for an App running on the operator's
 * own hardware. The operator could not serve it and did not own it.
 *
 * Resolution order:
 *   1. local development / worktrees → `<route-key>.apps.localhost:<port>`;
 *   2. `ZED_APPS_BASE_DOMAIN` when the operator sets one;
 *   3. otherwise DERIVED from this deployment's own public API origin, so
 *      `api.zed.com` still yields `apps.zed.com` (managed cloud keeps its
 *      exact hostnames, including the dev- and staging- prefixed variants) and
 *      a self-host at `api.acme.com` yields `apps.acme.com` — a domain that
 *      operator actually controls and can point DNS at.
 *
 * The environment prefix and the immutable route key are unchanged: routing has
 * never been derived from the mutable slug.
 */
import { config } from '../config';

/** Hostname shape for an App on a real domain. Kept in one regexp. */
const APP_LABEL = /^(dev|staging|prod|preview)-[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?-([a-f0-9]{16})$/;
const LOCAL_HOST = /^([a-f0-9]{16})\.apps\.localhost$/;

export interface ResolvedAppHost {
  routeKey: string;
  local: boolean;
}

export function appsLocalMode(): boolean {
  return process.env.ZED_APPS_LOCAL === 'true' || config.ZED_URL.includes('localhost');
}

function normalizeDomain(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    // Drop a path/trailing slash BEFORE the dot trim, so `https://serve.acme.io/`
    // normalizes to `serve.acme.io` rather than keeping the slash.
    .replace(/\/.*$/, '')
    .replace(/^\.+|\.+$/g, '');
}

/**
 * The registrable domain of this deployment's public API origin: drop the
 * leftmost label once there are three or more, so `api.zed.com` and
 * `dev-api.zed.com` both give `zed.com`, and a bare `acme.com` is left
 * alone. Good enough for deriving a sibling `apps.` domain; an operator whose
 * DNS does not fit this shape sets ZED_APPS_BASE_DOMAIN explicitly.
 */
function registrableDomain(origin: string): string | null {
  let hostname: string;
  try {
    hostname = new URL(origin).hostname.toLowerCase().replace(/\.$/, '');
  } catch {
    return null;
  }
  if (!hostname || hostname === 'localhost') return null;
  const labels = hostname.split('.');
  if (labels.length < 2) return null;
  return (labels.length >= 3 ? labels.slice(1) : labels).join('.');
}

/**
 * The base domain every App hostname sits under, or null when this deployment
 * has no App domain at all. Never falls back to a domain the deployment does
 * not own.
 */
export function appsBaseDomain(): string | null {
  const configured = process.env.ZED_APPS_BASE_DOMAIN;
  if (configured && normalizeDomain(configured)) return normalizeDomain(configured);
  const derived = registrableDomain(config.ZED_URL);
  return derived ? `apps.${derived}` : null;
}

export function appPublicUrl(row: { slug: string; routeKey: string }): string {
  if (appsLocalMode()) {
    const localPort = process.env.ZED_APPS_LOCAL_PORT || String(config.PORT);
    return `http://${row.routeKey}.apps.localhost:${localPort}`;
  }
  const domain = appsBaseDomain();
  if (!domain) {
    throw new Error(
      'Zed Apps has no base domain: set ZED_APPS_BASE_DOMAIN to a wildcard domain this deployment serves.',
    );
  }
  return `https://${config.INTERNAL_ZED_ENV}-${row.slug}-${row.routeKey}.${domain}`;
}

export function resolveAppHost(hostname: string): ResolvedAppHost | null {
  const host = hostname.toLowerCase().replace(/\.$/, '');
  const local = LOCAL_HOST.exec(host);
  if (local) return { routeKey: local[1]!, local: true };
  const domain = appsBaseDomain();
  if (!domain || !host.endsWith(`.${domain}`)) return null;
  const label = host.slice(0, -(domain.length + 1));
  if (label.includes('.')) return null;
  const match = APP_LABEL.exec(label);
  if (!match || match[1] !== config.INTERNAL_ZED_ENV) return null;
  return { routeKey: match[2]!, local: false };
}
