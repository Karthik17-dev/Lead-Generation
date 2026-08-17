'use client';

import {
  BellIcon as Bell,
  RobotIcon as Bot,
  CalendarDotsIcon as CalendarClock,
  ShippingContainerIcon as Container,
  FileCodeIcon as FileCode,
  PackageIcon as Package,
  SidebarSimpleIcon as PanelLeft,
  SparkleIcon as SparklesSolid,
  UsersThreeIcon as UsersGroupSolid,
  SquaresFourIcon as HiOutlineViewGrid,
  EnvelopeIcon as Mail,
} from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState, type ComponentType, type ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Hint from '@/components/ui/hint';
import { useSidebar } from '@/components/ui/sidebar';
import { Zed } from '@/features/icon/icons/zed';
import { Slack } from '@/features/icon/icons/slack';
import { ComposerChatInput, type ComposerOptions } from '@/features/session/composer-chat-input';
import type { AttachedFile } from '@/features/session/session-chat-input';
import { SessionWelcome } from '@/features/session/session-welcome';
import {
  CAPABILITY_TABS,
  capabilityTabHref,
  type CapabilityTab,
} from '@/features/workspace/capabilities/shared/capability-tab-routes';
import {
  sidebarOpenerLabel,
  useShowPageSidebarOpener,
} from '@/features/workspace/project-layout/sidebar-opener';
import { STARTER_PROMPTS } from '@/lib/starter-prompts';
import { cn } from '@/lib/utils';
import { useComposerPrefillStore } from '@/stores/composer-prefill-store';
import { useSettingsPanelStore } from '@/stores/settings-panel-store';
import {
  type SandboxTemplate,
  listProjectAccessRequests,
  listProjectSandboxes,
} from '@zed/sdk';
import { contract, qk, useProjectName, type Command } from '@zed/sdk/react';
import { META_SANDBOX_SLUG, chalkColors, isMetaAgentName } from '@zed/shared';

export interface ProjectHomeSendOptions extends ComposerOptions {
  sandbox_slug?: string;
}

export function ProjectHome({
  projectId,
  onSend,
  busy,
}: {
  projectId: string;
  onSend: (
    text: string,
    files: AttachedFile[] | undefined,
    options?: ProjectHomeSendOptions,
  ) => void;
  busy: boolean;
}) {
  const tI18nHardcoded = useTranslations('hardcodedUi');
  const { state: sidebarState, toggleSidebar, peek, peekEnter, peekLeave } = useSidebar();
  const sidebarToggleLabel = sidebarOpenerLabel({ state: sidebarState, peek });
  const showSidebarToggle = useShowPageSidebarOpener();

  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [prefill, setPrefill] = useState<{ text: string; id: number } | null>(null);

  const sandboxesQuery = useQuery({
    queryKey: qk.project.sandboxes(projectId),
    queryFn: () => listProjectSandboxes(projectId),
    ...contract('config'),
    refetchOnWindowFocus: false,
  });
  const sandboxItems: SandboxTemplate[] = sandboxesQuery.data?.items ?? [];
  const defaultSlug = sandboxesQuery.data?.default_slug ?? 'default';
  const activeSlug = selectedSlug ?? defaultSlug;
  const metaSelected = isMetaAgentName(selectedAgent);

  useEffect(() => {
    if (metaSelected) setSelectedSlug(null);
  }, [metaSelected]);

  const showSandboxPicker = true;
  const openSettings = useSettingsPanelStore((s) => s.openSettings);
  const accessRequests = useQuery({
    queryKey: qk.project.accessRequests(projectId),
    queryFn: () => listProjectAccessRequests(projectId, { showErrors: false }),
    retry: false,
    ...contract('inventory'),
    refetchOnWindowFocus: false,
  });
  const pendingAccessCount = accessRequests.data?.requests.length ?? 0;

  const pendingPrefill = useComposerPrefillStore((s) => s.prefillByProject[projectId]);
  const consumePrefill = useComposerPrefillStore((s) => s.consume);

  useEffect(() => {
    if (!pendingPrefill) return;
    consumePrefill(projectId);
    setPrefill({ text: pendingPrefill, id: Date.now() });
  }, [pendingPrefill, projectId, consumePrefill]);

  const handleSend = useCallback(
    (text: string, files: AttachedFile[] | undefined, options: ComposerOptions) => {
      onSend(text, files, {
        ...options,
        ...(metaSelected
          ? { sandbox_slug: META_SANDBOX_SLUG }
          : selectedSlug
            ? { sandbox_slug: selectedSlug }
            : {}),
      });
    },
    [metaSelected, selectedSlug, onSend],
  );

  const handleCommand = useCallback(
    (cmd: Command, args: string | undefined, options: ComposerOptions) => {
      handleSend(`/${cmd.name}${args ? ` ${args}` : ''}`, undefined, options);
    },
    [handleSend],
  );

  const applySuggestion = (s: string) => {
    setPrefill({ text: s, id: Date.now() });
  };

  return (
    <div
      className={cn('bg-background relative flex min-h-0 flex-1 flex-col overflow-hidden px-4.5')}
    >
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        <SessionWelcome />
      </div>
      {showSidebarToggle && (
        <Button
          type="button"
          aria-label={sidebarToggleLabel}
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          onPointerEnter={sidebarState === 'collapsed' ? peekEnter : undefined}
          onPointerLeave={sidebarState === 'collapsed' ? peekLeave : undefined}
          className="hover:bg-sidebar-accent hover:text-sidebar-foreground absolute top-2 left-2 z-20 shrink-0 cursor-pointer items-center justify-center rounded-md transition-[color,background-color,transform] duration-150 ease-out active:scale-[0.96]"
        >
          <PanelLeft className="cn-rtl-flip size-4" />
        </Button>
      )}
      {pendingAccessCount > 0 ? (
        <div className="absolute top-4 right-4 z-20">
          <Hint
            label={`${pendingAccessCount} pending access request${pendingAccessCount === 1 ? '' : 's'}`}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="bg-background/80 relative backdrop-blur-sm"
              onClick={() => openSettings('members')}
              aria-label={`${pendingAccessCount} pending access request${pendingAccessCount === 1 ? '' : 's'}`}
            >
              <Bell className="size-4" />
              <Badge
                size="xs"
                variant="new"
                className="absolute -top-1 -right-1 min-w-5 px-1 tabular-nums"
              >
                {pendingAccessCount}
              </Badge>
            </Button>
          </Hint>
        </div>
      ) : null}

      <ProjectHomeWelcomeBody
        projectId={projectId}
        onPickSuggestion={applySuggestion}
        composer={
          <ComposerChatInput
            onSend={handleSend}
            onCommand={handleCommand}
            projectId={projectId}
            isSending={busy}
            disabled={busy}
            clearOnSend={false}
            autoFocus
            cardClassName="min-h-[120px] rounded-2xl flex flex-col justify-between shadow-xs border-border/70 bg-sidebar/95 backdrop-blur-sm"
            parentClassName="px-0 md:px-0 w-full max-w-[50rem]"
            dockClassName="right-0 left-0 md:right-0"
            underbarPlacement="inline"
            slashMenuPlacement="below"
            placeholder="Describe a task to start a session..."
            prefill={prefill}
            onAgentSelectionChange={setSelectedAgent}
            toolbarSlot={
              metaSelected ? (
                <MetaRuntimeIndicator />
              ) : showSandboxPicker ? (
                <SandboxPicker
                  items={sandboxItems}
                  activeSlug={activeSlug}
                  selectedSlug={selectedSlug}
                  onSelect={setSelectedSlug}
                />
              ) : null
            }
          />
        }
      />
    </div>
  );
}

function MetaRuntimeIndicator() {
  return (
    <Hint label="Meta uses a fixed minimal sandbox. It starts specialized sessions for project work.">
      <span className="text-muted-foreground inline-flex h-8 items-center gap-1.5 px-2.5 text-xs font-medium">
        <Container className="size-3.5" />
        Meta runtime
      </span>
    </Hint>
  );
}

/**
 * The project-home empty-state body, laid out with the centered welcome heading,
 * the composer directly beneath it, and the starter-prompt chips right under the input,
 * with the setup pills at the bottom of the viewport.
 */
export function ProjectHomeWelcomeBody({
  projectId,
  composer,
  onPickSuggestion,
}: {
  projectId: string;
  composer?: ReactNode;
  onPickSuggestion?: (text: string) => void;
}) {
  const name = useProjectName(projectId) ?? '';
  const displayName = name.trim() || 'this project';

  return (
    <div className="relative z-10 flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="m-auto flex w-full max-w-[52rem] flex-col items-center gap-8 px-2 py-8 sm:px-4">
          <h1 className="text-muted-foreground max-w-2xl text-center text-4xl leading-[1.2] tracking-tight text-balance max-sm:text-3xl">
            Give <span className="text-foreground">{displayName}</span>{' '}
            something real to work on.
          </h1>

          {composer || onPickSuggestion ? (
            <div className="flex w-full flex-col items-center gap-4">
              {composer}
              {onPickSuggestion ? <StarterPromptChips onPick={onPickSuggestion} /> : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 justify-center px-4 pb-6">
        <ProjectHomeSections projectId={projectId} />
      </div>
    </div>
  );
}

/**
 * Starter prompt suggestions rendered as a centered, wrapping row of quiet
 * pills directly beneath the composer.
 */
export function StarterPromptChips({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {STARTER_PROMPTS.map((p, i) => {
        const ChipIcon = p.icon;
        const chalk = chalkColors(p.label);
        return (
          <Button
            key={p.id}
            onClick={() => onPick(p.prompt)}
            variant="outline"
            size="sm"
            className={cn(
              'bg-background/60 shrink-0 gap-1.5 rounded-md backdrop-blur-sm',
              i >= 4 && 'max-sm:hidden',
            )}
          >
            <ChipIcon
              className="size-3.5 shrink-0"
              style={{ color: chalk.foreground }}
              aria-hidden
            />
            {p.label}
          </Button>
        );
      })}
    </div>
  );
}

function SandboxPicker({
  items,
  activeSlug,
  selectedSlug,
  onSelect,
}: {
  items: SandboxTemplate[];
  activeSlug: string;
  selectedSlug: string | null;
  onSelect: (slug: string | null) => void;
}) {
  const tI18nHardcoded = useTranslations('hardcodedUi');
  const fallbackDefault: SandboxTemplate = {
    template_id: 'default',
    slug: 'default',
    name: 'Agent environment',
    is_default: true,
    daytona_state: 'active',
  };
  const active = items.find((t) => t.slug === activeSlug) ?? items[0] ?? fallbackDefault;
  const ActiveIcon = active.is_default ? Container : active.has_image ? Package : FileCode;
  const activeStateTone =
    active.daytona_state === 'active'
      ? 'bg-zed-green'
      : ['pulling', 'building'].includes(active.daytona_state)
        ? 'bg-zed-blue'
        : active.daytona_state === 'missing'
          ? 'bg-muted-foreground/40'
          : 'bg-destructive';
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={tI18nHardcoded.raw(
            'autoFeaturesCoWorkerProjectLayoutProjectHomeJsxAttrAria4acf4ecd',
          )}
          className="text-muted-foreground hover:text-foreground hover:bg-muted inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-xs font-medium transition-colors duration-200"
        >
          <ActiveIcon className="size-3.5 shrink-0" />
          <span className="max-w-[7rem] truncate">
            {selectedSlug ? active.name : 'Agent environment'}
          </span>
          <span className={cn('size-1.5 shrink-0 rounded-full', activeStateTone)} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80">
        <DropdownMenuLabel>
          {tI18nHardcoded.raw('autoFeaturesCoWorkerProjectLayoutProjectHomeJsxTextSandboxe9c5fbaa')}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="flex items-start gap-2" onSelect={() => onSelect(null)}>
          <Bot className="text-muted-foreground mt-0.5 size-4" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Agent environment</span>
              {selectedSlug === null && (
                <Badge variant="outline" size="xs">
                  selected
                </Badge>
              )}
            </div>
            <div className="text-muted-foreground text-xs">
              Uses the selected agent, project, or platform default.
            </div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {items.map((tpl) => {
          const Icon = tpl.is_default ? Container : tpl.has_image ? Package : FileCode;
          const subtitle = tpl.is_default
            ? 'Platform default · clones workspace at boot'
            : tpl.has_image
              ? `Image: ${tpl.image}`
              : `Dockerfile: ${tpl.dockerfile_path}`;
          const stateTone =
            tpl.daytona_state === 'active'
              ? 'text-zed-green'
              : ['pulling', 'building'].includes(tpl.daytona_state)
                ? 'text-zed-blue'
                : tpl.daytona_state === 'missing'
                  ? 'text-muted-foreground'
                  : 'text-destructive';
          const stateLabel =
            tpl.daytona_state === 'active'
              ? 'Ready'
              : ['pulling', 'building'].includes(tpl.daytona_state)
                ? 'Building — session will wait'
                : tpl.daytona_state === 'missing'
                  ? 'Not built — first session will build it'
                  : tpl.daytona_state.replace('_', ' ');
          return (
            <DropdownMenuItem
              key={tpl.template_id ?? `tpl-${tpl.slug}`}
              className="flex items-start gap-2"
              onSelect={() => onSelect(tpl.slug)}
            >
              <Icon className="text-muted-foreground mt-0.5 size-4" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{tpl.name}</span>
                  {tpl.slug === selectedSlug && (
                    <Badge variant="outline" size="xs">
                      selected
                    </Badge>
                  )}
                </div>
                <div className="text-muted-foreground truncate text-xs">{subtitle}</div>
                <div className={cn('mt-0.5 text-xs capitalize', stateTone)}>{stateLabel}</div>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type SetupTile = {
  icon: ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  section: string | CapabilityTab['key'];
};

const isCapabilityTabKey = (section: SetupTile['section']): section is CapabilityTab['key'] =>
  CAPABILITY_TABS.some((tab) => tab.key === section);

const PROJECT_SETUP_TILES: SetupTile[] = [
  {
    icon: HiOutlineViewGrid,
    title: 'Connectors',
    desc: 'Connect tools your agent can act in.',
    section: 'connectors',
  },
  {
    icon: Mail,
    title: 'Email',
    desc: 'Run this project via email.',
    section: 'channels',
  },
  {
    icon: CalendarClock,
    title: 'Scheduled tasks',
    desc: 'Run work on a schedule or from an event.',
    section: 'schedules',
  },
  {
    icon: SparklesSolid,
    title: 'Skills',
    desc: 'Repeatable workflows your agent reuses.',
    section: 'skills',
  },
  {
    icon: Slack,
    title: 'Slack',
    desc: 'Run this project right from chat.',
    section: 'channels',
  },
  {
    icon: UsersGroupSolid,
    title: 'Your team',
    desc: 'Invite people to run and review work.',
    section: 'members',
  },
  {
    icon: Zed,
    title: 'Agent',
    desc: 'Shape how your agent thinks and acts.',
    section: 'agent',
  },
];

function ProjectHomeSections({ projectId }: { projectId: string }) {
  const openSettings = useSettingsPanelStore((s) => s.openSettings);
  const router = useRouter();
  const tiles = PROJECT_SETUP_TILES;

  return (
    <div className="flex w-full max-w-3xl flex-wrap items-center justify-center gap-2">
      {tiles.map((tile) => {
        const { icon: TileIcon, title, desc, section } = tile;

        return (
          <Hint key={title} label={desc} side="top">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                isCapabilityTabKey(section)
                  ? router.push(capabilityTabHref(projectId, section))
                  : openSettings(section as any)
              }
              className="bg-background/60 gap-1.5 rounded-md backdrop-blur-sm"
            >
              <TileIcon className="text-muted-foreground size-4 shrink-0" />
              {title}
            </Button>
          </Hint>
        );
      })}
    </div>
  );
}
