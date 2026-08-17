import { type ChildProcess, spawn } from 'node:child_process';
import { createWriteStream, existsSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
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
    if (!isAlive(sandbox.daemonPid)) {
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
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 1000));
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
    await writeFile(
      join(dir, '.env'),
      `${Object.entries(env)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
        .join('\n')}\n`,
      'utf8',
    );

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
    if (isAlive(sandbox.daemonPid)) return;

    if (sandbox.port === 0) {
      sandbox.port = await allocatePort();
      sandbox.env = {
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
      await writeFile(
        join(sandbox.dir, '.env'),
        `${Object.entries(sandbox.env)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
          .join('\n')}\n`,
        'utf8',
      );
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
    daemon.once('exit', (code, signal) => {
      sandbox.status = code === 0 ? 'stopped' : 'error';
      sandbox.error = code === 0 ? undefined : (stderrBuffer.trim() || `Daemon exited with code ${code} signal ${signal}`);
      sandbox.updatedAt = new Date();
    });
    daemon.unref();
    sandbox.daemon = daemon;
    sandbox.daemonPid = daemon.pid;

    await new Promise((resolvePromise) => setTimeout(resolvePromise, 1500));
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
    if (sandbox.status === 'running' && isAlive(sandbox.daemonPid)) return 'running';
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
      url: `http://127.0.0.1:${port}${request.path ?? ''}`,
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
    const running = sandbox.status === 'running' && isAlive(sandbox.daemonPid);
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
    return Array.from(sandboxes.values())
      .filter((sandbox) => sandbox.status === 'running' && isAlive(sandbox.daemonPid))
      .map((sandbox) => ({ externalId: sandbox.id, createdAt: sandbox.createdAt }));
  }
}
