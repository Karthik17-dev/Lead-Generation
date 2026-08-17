import type {
  BuildLogTap,
  BuildableTemplate,
  BuildSnapshotResult,
  ProviderState,
  SandboxProviderAdapter,
  SnapshotView,
} from './index';

class LocalSnapshotAdapter implements SandboxProviderAdapter {
  readonly id = 'local' as const;

  isConfigured(): boolean {
    return true;
  }

  async buildSnapshot(_input: BuildableTemplate, _tap?: BuildLogTap): Promise<BuildSnapshotResult | void> {
    // Local development runs locally in process; no image build required.
    return;
  }

  async getSnapshotState(_snapshotName: string): Promise<ProviderState> {
    return 'ready';
  }

  async listSnapshots(): Promise<SnapshotView[]> {
    return [{ name: 'default', state: 'ready' }];
  }

  async deleteSnapshot(_snapshotName: string): Promise<void> {
    return;
  }
}

export const localSnapshotProvider = new LocalSnapshotAdapter();
