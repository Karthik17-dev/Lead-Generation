import { type ChildProcess, spawn } from 'node:child_process';
import { createWriteStream, existsSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import type {
  CreateSandboxOpts,
  InPlaceRecoveryStatus,
  ProviderName,
  ProvisionResult,
  ProvisioningStatus,
  ProvisioningTraits,
  ResolvedEndpoint,
  ResolvedSandboxIngress,
  SandboxIngressRequest,
  SandboxIngressRoute,
  SandboxProvider,
  SandboxStatus,
} from './index';

type LocalSandboxState = 'creating' | 'running' | 'stopped' | 'removed' | 'error';

interface LocalSandbox {
  id: string;
  dir: string;
  port: number;
  status: LocalSandboxState;
  createdAt: Date;
  updatedAt: Date;
  env: Record<string, string>;
  daemon?: ChildProcess;
  daemonPid?: number;
  error?: string;
  lastHealth?: Record<string, unknown>;
}

const providerName: ProviderName = 'local';
const workspaceRoot =
  process.env.ZED_LOCAL_SANDBOX_ROOT ||
  process.env.KORTIX_LOCAL_SANDBOX_ROOT ||
  join(tmpdir(), 'zed-local');
const sandboxes = new Map<string, LocalSandbox>();

async function allocatePort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolvePromise, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolvePromise());
  });
  const address = server.address();
  await new Promise<void>((resolvePromise, reject) => {
    server.close((err) => (err ? reject(err) : resolvePromise()));
  });
  if (!address || typeof address === 'string') {
    throw new Error('Failed to allocate local sandbox port');
  }
  return address.port;
}

function repoRoot(): string {
  return resolve(import.meta.dir, '../../../../..');
}

function sandboxIdFor(opts: CreateSandboxOpts): string {
  const fromEnv =
    opts.envVars?.ZED_SESSION_ID?.trim() || opts.envVars?.KORTIX_SESSION_ID?.trim();
  if (fromEnv) return fromEnv;
  return opts.name.replace(/^session-/, 'local-');
}

function getSandbox(externalId: string): LocalSandbox {
  let sandbox = sandboxes.get(externalId);
  if (!sandbox) {
    const dir = join(workspaceRoot, externalId);
    sandbox = {
      id: externalId,
      dir,
      port: 0,
      status: 'stopped',
      createdAt: new Date(),
      updatedAt: new Date(),
      env: {},
    };
    sandboxes.set(externalId, sandbox);
  }
  return sandbox;
}

function isAlive(pid: number | undefined): boolean {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/**
 * The recorded daemon pid is the process this API spawned — on Windows that is
 * the `cmd.exe` shell (spawned with `shell: true`), which can exit while the
 * `bun` daemon it launched keeps serving. A dead recorded pid is therefore not
 * proof the runtime is gone. The health endpoint is the ground truth: a daemon
 * answering it on the recorded port is adopted as alive.
 */
async function isSandboxDaemonAlive(sandbox: LocalSandbox): Promise<boolean> {
  if (isAlive(sandbox.daemonPid)) return true;
  if (sandbox.port === 0) return false;
  try {
    const res = await fetch(`http://127.0.0.1:${sandbox.port}/zed/health`).catch(() =>
      fetch(`http://127.0.0.1:${sandbox.port}/kortix/health`),
    );
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * The sandbox dir's `.env` is the durable store of the daemon environment a
 * create passed (sandbox tokens, LLM-gateway keys, git context). A respawn
 * must preserve it — the port-0 branch used to rebuild the env from scratch,
 * which silently dropped ZED_TOKEN/ZED_SANDBOX_TOKEN and left every proxied
 * request behind a "ZED_TOKEN unset" gate.
 */
async function readSandboxEnvFile(dir: string): Promise<Record<string, string>> {
  try {
    const text = await readFile(join(dir, '.env'), 'utf8');
    const env: Record<string, string> = {};
    for (const line of text.split(/\r?\n/)) {
      const eq = line.indexOf('=');
      if (eq <= 0) continue;
      const key = line.slice(0, eq).trim();
      const raw = line.slice(eq + 1).trim();
      if (!key || !raw) continue;
      try {
        const value = JSON.parse(raw);
        if (typeof value === 'string') env[key] = value;
      } catch {
        // Not a JSON-encoded value; skip rather than guess.
      }
    }
    return env;
  } catch {
    return {};
  }
}

async function writeSandboxEnvFile(sandbox: LocalSandbox): Promise<void> {
  await writeFile(
    join(sandbox.dir, '.env'),
    `${Object.entries(sandbox.env)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
      .join('\n')}\n`,
    'utf8',
  );
}

function localRuntimeReadyTimeoutMs(): number {
  const raw = Number(
    process.env.ZED_LOCAL_RUNTIME_READY_TIMEOUT_MS ||
      process.env.KORTIX_LOCAL_RUNTIME_READY_TIMEOUT_MS,
  );
  if (Number.isFinite(raw) && raw > 0) return raw;
  return 10 * 60_000;
}

async function waitForHealth(
  sandbox: LocalSandbox,
  opts: { runtimeReady: boolean; timeoutMs: number },
): Promise<void> {
  const deadline = Date.now() + opts.timeoutMs;
  let lastError = 'health endpoint did not respond';
  while (Date.now() < deadline) {
    if (!(await isSandboxDaemonAlive(sandbox))) {
      throw new Error(sandbox.error ?? 'Local sandbox daemon is not running');
    }
    try {
      const res = await fetch(`http://127.0.0.1:${sandbox.port}/zed/health`).catch(() =>
        fetch(`http://127.0.0.1:${sandbox.port}/kortix/health`),
      );
      const body = (await res.json()) as Record<string, unknown>;
      sandbox.lastHealth = body;
      if (body.boot_error) lastError = String(body.boot_error);
      if (body.daemon === 'ok' && (!opts.runtimeReady || body.runtimeReady === true)) return;
      lastError = `daemon status=${String(body.status)} runtimeReady=${String(body.runtimeReady)}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 25));
  }
  throw new Error(`Local sandbox runtime did not become ready: ${lastError}`);
}

export class LocalProvider implements SandboxProvider {
  readonly name = providerName;
  readonly provisioning: ProvisioningTraits = {
    async: false,
    stages: [{ id: 'local-runtime', progress: 100, message: 'Starting local runtime' }],
  };

  async create(opts: CreateSandboxOpts): Promise<ProvisionResult> {
    const id = sandboxIdFor(opts);
    const dir = join(workspaceRoot, id);
    const port = await allocatePort();
    const env = {
      ...(opts.envVars ?? {}),
      ZED_SERVICE_PORT: String(port),
      KORTIX_SERVICE_PORT: String(port),
      ZED_WORKSPACE: dir,
      KORTIX_WORKSPACE: dir,
      ZED_PROJECT_TARGET: dir,
      KORTIX_PROJECT_TARGET: dir,
      ZED_OPENCODE_INTERNAL_PORT: String(await allocatePort()),
      KORTIX_OPENCODE_INTERNAL_PORT: String(await allocatePort()),
      ZED_OPENCODE_STANDBY_PORT: String(await allocatePort()),
      KORTIX_OPENCODE_STANDBY_PORT: String(await allocatePort()),
      ZED_STATIC_PORT: String(await allocatePort()),
      KORTIX_STATIC_PORT: String(await allocatePort()),
    };

    await mkdir(dir, { recursive: true });

    const sandbox: LocalSandbox = {
      id,
      dir,
      port,
      status: 'creating',
      createdAt: new Date(),
      updatedAt: new Date(),
      env,
    };
    sandboxes.set(id, sandbox);

    try {
      await this.ensureAppRuntimeStarted(id);
      await waitForHealth(sandbox, {
        runtimeReady: true,
        timeoutMs: localRuntimeReadyTimeoutMs(),
      });
      // Persist the durable daemon env only AFTER the runtime is ready. The
      // daemon's own boot materializes the project repo into `dir` FIRST
      // (git.ts `materializeRepo` → `clearDirContents`), and that wipe used to
      // delete a .env written before the spawn — leaving nothing for a later
      // API restart/respawn to reconstruct (ZED_TOKEN lost → every proxied
      // request behind the daemon's "ZED_TOKEN unset" gate). The spawn env
      // carries the same values, so the file is a respawn store, not a boot
      // input: writing it once the materializer has finished is both safe and
      // sufficient.
      await writeSandboxEnvFile(sandbox);
      sandbox.status = 'running';
      sandbox.updatedAt = new Date();
      return {
        externalId: id,
        baseUrl: `http://127.0.0.1:${port}`,
        metadata: {
          dir,
          port,
          daemonPid: sandbox.daemonPid ?? null,
          provider: 'local',
        },
      };
    } catch (error) {
      sandbox.status = 'error';
      sandbox.error = error instanceof Error ? error.message : String(error);
      sandbox.updatedAt = new Date();
      throw error;
    }
  }

  async ensureAppRuntimeStarted(externalId: string): Promise<void> {
    const sandbox = getSandbox(externalId);
    if (await isSandboxDaemonAlive(sandbox)) return;

    if (sandbox.port === 0) {
      sandbox.port = await allocatePort();
      sandbox.env = {
        // Preserve the environment the original create injected (sandbox
        // tokens, LLM-gateway keys) — override only the ports.
        ...(await readSandboxEnvFile(sandbox.dir)),
        ZED_SERVICE_PORT: String(sandbox.port),
        KORTIX_SERVICE_PORT: String(sandbox.port),
        ZED_WORKSPACE: sandbox.dir,
        KORTIX_WORKSPACE: sandbox.dir,
        ZED_PROJECT_TARGET: sandbox.dir,
        KORTIX_PROJECT_TARGET: sandbox.dir,
        ZED_OPENCODE_INTERNAL_PORT: String(await allocatePort()),
        KORTIX_OPENCODE_INTERNAL_PORT: String(await allocatePort()),
        ZED_OPENCODE_STANDBY_PORT: String(await allocatePort()),
        KORTIX_OPENCODE_STANDBY_PORT: String(await allocatePort()),
        ZED_STATIC_PORT: String(await allocatePort()),
        KORTIX_STATIC_PORT: String(await allocatePort()),
      };
      await mkdir(sandbox.dir, { recursive: true });
      await writeSandboxEnvFile(sandbox);
    }

    let entry = process.env.ZED_SANDBOX_AGENT_SERVER_ENTRY || process.env.KORTIX_SANDBOX_AGENT_SERVER_ENTRY;
    if (!entry) {
      const candidates = [
        join(repoRoot(), 'apps', 'zed-sandbox-agent-server', 'src', 'main.ts'),
        join(repoRoot(), 'apps', 'kortix-sandbox-agent-server', 'src', 'main.ts'),
      ];
      entry = candidates.find((c) => existsSync(c)) ?? candidates[1];
    }
    const logDir = join(sandbox.dir, '.zed-local');
    await mkdir(logDir, { recursive: true });
    const stdout = createWriteStream(join(logDir, 'daemon.stdout.log'), { flags: 'a' });
    const stderr = createWriteStream(join(logDir, 'daemon.stderr.log'), { flags: 'a' });

    let stderrBuffer = '';
    const isWin = process.platform === 'win32';
    const daemon = spawn(isWin ? 'bun.exe' : 'bun', ['run', '--hot', entry], {
      cwd: sandbox.dir,
      env: { ...process.env, ...sandbox.env },
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: isWin,
      windowsHide: true,
    });
    daemon.stdout?.pipe(stdout);
    daemon.stderr?.pipe(stderr);
    daemon.stderr?.on('data', (chunk) => {
      stderrBuffer += chunk.toString();
    });
    daemon.once('exit', async (code, signal) => {
      // The spawned wrapper can exit while the daemon it launched keeps
      // serving (Windows shell wrapper). The health endpoint decides: an
      // answering daemon is not a failure.
      if (await isSandboxDaemonAlive(sandbox)) return;
      sandbox.status = code === 0 ? 'stopped' : 'error';
      sandbox.error = code === 0 ? undefined : (stderrBuffer.trim() || `Daemon exited with code ${code} signal ${signal}`);
      sandbox.updatedAt = new Date();
    });
    daemon.unref();
    sandbox.daemon = daemon;
    sandbox.daemonPid = daemon.pid;

    if (daemon.exitCode !== null) {
      throw new Error(`Local sandbox daemon exited during boot: ${sandbox.error || `exit code ${daemon.exitCode}`}`);
    }
    await waitForHealth(sandbox, { runtimeReady: false, timeoutMs: 30_000 });
  }

  async start(externalId: string): Promise<void> {
    const sandbox = getSandbox(externalId);
    await this.ensureAppRuntimeStarted(externalId);
    await waitForHealth(sandbox, {
      runtimeReady: true,
      timeoutMs: localRuntimeReadyTimeoutMs(),
    });
    sandbox.status = 'running';
    sandbox.updatedAt = new Date();
  }

  async stop(externalId: string): Promise<void> {
    const sandbox = getSandbox(externalId);
    if (sandbox.daemonPid && isAlive(sandbox.daemonPid)) {
      sandbox.daemon?.kill();
    }
    sandbox.status = 'stopped';
    sandbox.updatedAt = new Date();
  }

  async remove(externalId: string): Promise<void> {
    const sandbox = getSandbox(externalId);
    await this.stop(externalId).catch(() => {});
    sandboxes.delete(externalId);
    await rm(sandbox.dir, { recursive: true, force: true });
  }

  async getStatus(externalId: string): Promise<SandboxStatus> {
    const sandbox = getSandbox(externalId);
    if (sandbox.status === 'running' && (await isSandboxDaemonAlive(sandbox))) return 'running';
    if (sandbox.status === 'error') return 'terminal';
    if (sandbox.status === 'removed') return 'removed';
    return 'stopped';
  }

  async recoverInPlace(_externalId: string): Promise<InPlaceRecoveryStatus> {
    return 'unavailable';
  }

  async resolveEndpoint(externalId: string): Promise<ResolvedEndpoint> {
    const sandbox = getSandbox(externalId);
    return { url: `http://127.0.0.1:${sandbox.port}`, headers: {} };
  }

  routeIngress(request: SandboxIngressRequest): SandboxIngressRoute {
    return { effectivePort: request.port };
  }

  async resolveIngress(
    externalId: string,
    request: SandboxIngressRequest,
  ): Promise<ResolvedSandboxIngress> {
    const sandbox = getSandbox(externalId);
    const port = request.port === 8000 ? sandbox.port : request.port;
    return {
      // Base URL only, exactly like the cloud providers: every caller joins
      // `request.path` onto it themselves (preview.ts, ws-proxy.ts), and
      // `postEnvToDaemon` appends `/zed/env`. Embedding the path here used to
      // poison the path-free ingress cache and sent the env-sync to
      // `/session/.../zed/env` — rejected by the daemon's proxy gate as
      // `401 unauthorized reason=malformed`.
      url: `http://127.0.0.1:${port}`,
      headers: {},
      effectivePort: port,
    };
  }

  async ensureRunning(externalId: string): Promise<void> {
    await this.start(externalId);
  }

  async getProvisioningStatus(externalId: string): Promise<ProvisioningStatus | null> {
    const sandbox = sandboxes.get(externalId);
    if (!sandbox) return null;
    const running = sandbox.status === 'running' && (await isSandboxDaemonAlive(sandbox));
    return {
      stage: sandbox.status,
      progress: running ? 100 : 0,
      message: sandbox.error ?? `Local sandbox is ${sandbox.status}`,
      complete: running,
      error: sandbox.status === 'error',
      ...(sandbox.error ? { errorMessage: sandbox.error } : {}),
    };
  }

  async listManagedRunningSandboxes(): Promise<
    Array<{ externalId: string; createdAt: Date | null }>
  > {
    const running: Array<{ externalId: string; createdAt: Date | null }> = [];
    for (const sandbox of sandboxes.values()) {
      if (sandbox.status === 'running' && (await isSandboxDaemonAlive(sandbox))) {
        running.push({ externalId: sandbox.id, createdAt: sandbox.createdAt });
      }
    }
    return running;
  }
}
