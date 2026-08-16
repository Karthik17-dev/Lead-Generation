import { cors } from 'hono/cors';

const CLOUD_ORIGINS = [
  'https://www.zed.com',
  'https://zed.com',
  'https://dev.zed.com',
  'https://new-dev.zed.com',
  'https://dev-new.zed.com',
  'https://staging.zed.com',
  'https://zed.cloud',
  'https://www.zed.cloud',
  'https://new.zed.com',
];

const LOCAL_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3010',
  'http://127.0.0.1:3010',
];

const PREVIEW_ORIGIN = /^https:\/\/[a-z0-9-]+\.(vercel\.app|preview\.zed\.com)$/i;

interface CorsMiddlewareOptions {
  internalEnvironment: string;
  extraOrigins: string[];
}

export function createCorsMiddleware(options: CorsMiddlewareOptions) {
  const allowedOrigins = new Set([
    ...CLOUD_ORIGINS,
    ...LOCAL_ORIGINS,
    ...options.extraOrigins.map((origin) => origin.trim()).filter(Boolean),
  ]);
  const allowPreviewOrigins = options.internalEnvironment === 'preview';

  return cors({
    origin: (origin) => {
      if (!origin) return origin;
      if (allowedOrigins.has(origin)) return origin;
      if (allowPreviewOrigins && PREVIEW_ORIGIN.test(origin)) return origin;
      return null;
    },
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: [
      'Content-Type',
      'Authorization',
      'X-Zed-Token',
      'X-Api-Key',
      'Accept',
      'X-Zed-Signature',
      'X-Hub-Signature-256',
      'traceparent',
      'tracestate',
      'X-Request-Id',
      'Last-Event-ID',
      'X-Zed-Client',
      // Act-as impersonation. A header absent from this list is stripped by the
      // browser's preflight, so the request arrives WITHOUT the grant and runs
      // as the operator's own account — the exact silent mis-scoping the
      // server-side design refuses to allow. It has to be declared here for the
      // banner to ever be true in a browser.
      'X-Zed-Impersonate',
      // Same reason for the platform-admin read-only bypass the SDK already
      // attaches (setAdminBypass → `x-zed-admin-bypass: 1`): without it, the
      // header never survives a cross-origin preflight.
      'X-Zed-Admin-Bypass',
    ],
    exposeHeaders: [
      'X-Next-Cursor',
      'X-Request-Id',
      'X-Audit-Row-Count',
      'X-Audit-Capped',
      'X-Audit-Complete',
      'X-Audit-Next-Cursor',
    ],
    credentials: true,
    maxAge: 600,
  });
}
